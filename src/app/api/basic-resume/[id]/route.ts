import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import {
  findOwnedBasicResume,
  softDeleteResume,
  updateBasicResumeWithVersionCheck,
  type ResumePatch,
} from '@/server/modules/resumes/resumePersistenceService';
import { updateBasicResumeSchema } from '@/shared/lib/validation/basicResumeSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireUser();
  const { id } = await context.params;

  const resume = await findOwnedBasicResume(user.id, id);
  if (!resume) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  return NextResponse.json({ resume }, { headers: { 'Cache-Control': 'no-store' } });
});

export const PATCH = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  const parsed = updateBasicResumeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid basic resume patch');
  }

  const { version, title, data, theme, isDefault } = parsed.data;

  const patch: ResumePatch = {};
  if (title !== undefined) patch.title = title;
  if (data !== undefined) patch.data = data as unknown as Prisma.InputJsonValue;
  if (theme !== undefined) patch.theme = theme as Prisma.InputJsonValue;
  if (isDefault !== undefined) patch.isDefault = isDefault;

  const outcome = await updateBasicResumeWithVersionCheck(user.id, id, version, patch);

  if (outcome.status === 'not-found') {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  if (outcome.status === 'conflict') {
    // The winning record travels with the 409 so the client can reconcile
    // without a follow-up GET, identically to /api/resumes/[id].
    return NextResponse.json({ error: 'VERSION_CONFLICT', resume: outcome.resume }, { status: 409 });
  }

  return NextResponse.json({ resume: outcome.resume });
});

export const DELETE = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  // Read the row as a BASIC one first: softDeleteResume is deliberately
  // kind-agnostic, so without this check this route would delete a full resume.
  const resume = await findOwnedBasicResume(user.id, id);
  if (!resume || !(await softDeleteResume(user.id, id))) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  return NextResponse.json({ ok: true });
});
