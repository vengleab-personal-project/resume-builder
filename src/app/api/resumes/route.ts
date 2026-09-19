import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import {
  createResume,
  listOwnedResumes,
  toResumeDTO,
} from '@/server/modules/resumes/resumePersistenceService';
import { createResumeSchema, resumeKindQuerySchema } from '@/shared/lib/validation/resumeSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();

  // Absent `kind` means FULL, so every caller written before the basic CV
  // existed -- useResumeSync's hydration above all -- keeps returning exactly
  // the rows it returned before, and can never be handed a shape it cannot
  // render.
  const parsed = resumeKindQuerySchema.safeParse({
    kind: req.nextUrl.searchParams.get('kind') ?? undefined,
  });
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Unknown resume kind');
  }

  const resumes = await listOwnedResumes(user.id, parsed.data.kind);

  return NextResponse.json({ resumes }, { headers: { 'Cache-Control': 'no-store' } });
});

// Creates a FULL resume only. A basic CV is created by starting a voice
// interview (POST /api/basic-resume/session), which is the only path that can
// produce a valid BasicResumeData, so there is nothing for this route to accept.
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const body = await req.json().catch(() => null);
  const parsed = createResumeSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid resume payload');
  }

  const { title, data, sectionOrder, theme, isDefault } = parsed.data;

  const row = await createResume(user.id, {
    title: title ?? 'Untitled Resume',
    kind: 'FULL',
    data: data as Prisma.InputJsonValue,
    sectionOrder: sectionOrder as Prisma.InputJsonValue,
    theme: theme as Prisma.InputJsonValue,
    isDefault,
  });

  return NextResponse.json({ resume: toResumeDTO(row) }, { status: 201 });
});
