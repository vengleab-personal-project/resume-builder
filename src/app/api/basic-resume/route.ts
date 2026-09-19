import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { withErrorHandling } from '@/server/errors';
import {
  createResume,
  listOwnedResumes,
  toBasicResumeDTO,
} from '@/server/modules/resumes/resumePersistenceService';
import { BASIC_SECTION_ORDER, createEmptyBasicResumeData } from '@/shared/lib/basic-resume';
import { INITIAL_THEME } from '@/shared/config/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  const resumes = await listOwnedResumes(user.id, 'BASIC');

  return NextResponse.json({ resumes }, { headers: { 'Cache-Control': 'no-store' } });
});

// Creates an empty basic CV. Takes no body: there is nothing a client could
// usefully send, because every field starts blank and is filled in afterwards
// -- by typing today, by the voice interview once it lands.
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const row = await createResume(user.id, {
    title: 'Basic CV',
    kind: 'BASIC',
    data: createEmptyBasicResumeData() as unknown as Prisma.InputJsonValue,
    // Written so the column is never empty; the basic template renders its own
    // canonical order and does not read this back.
    sectionOrder: [...BASIC_SECTION_ORDER] as unknown as Prisma.InputJsonValue,
    theme: INITIAL_THEME as unknown as Prisma.InputJsonValue,
  });

  return NextResponse.json({ resume: toBasicResumeDTO(row) }, { status: 201 });
});
