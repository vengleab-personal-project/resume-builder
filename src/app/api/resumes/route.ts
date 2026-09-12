import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import { HttpError, assertSameOrigin, requireUser, withAuthErrors } from '@/server/auth/guards';
import {
  RESUME_FULL_SELECT,
  RESUME_SUMMARY_SELECT,
  toResumeDTO,
  toResumeSummary,
} from '@/server/services/resumePersistenceService';
import { createResumeSchema } from '@/shared/lib/validation/resumeSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuthErrors(async () => {
  const user = await requireUser();

  const rows = await prisma.resume.findMany({
    where: { userId: user.id, deletedAt: null },
    select: RESUME_SUMMARY_SELECT,
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  return NextResponse.json(
    { resumes: rows.map(toResumeSummary) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
});

export const POST = withAuthErrors(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const body = await req.json().catch(() => null);
  const parsed = createResumeSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid resume payload');
  }

  const { title, data, sectionOrder, theme, isDefault } = parsed.data;

  // The first resume a user ever creates is their default, so the sync hook
  // always has something to hydrate from without a separate "set default" call.
  const existingCount = await prisma.resume.count({
    where: { userId: user.id, deletedAt: null },
  });
  const shouldBeDefault = isDefault ?? existingCount === 0;

  const row = await prisma.$transaction(async (tx) => {
    // A partial unique index enforces one default per user, so the previous
    // default has to be demoted in the same transaction as the promotion.
    if (shouldBeDefault && existingCount > 0) {
      await tx.resume.updateMany({
        where: { userId: user.id, deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.resume.create({
      data: {
        userId: user.id,
        title: title ?? 'Untitled Resume',
        data: data as Prisma.InputJsonValue,
        sectionOrder: sectionOrder as Prisma.InputJsonValue,
        theme: theme as Prisma.InputJsonValue,
        isDefault: shouldBeDefault,
      },
      select: RESUME_FULL_SELECT,
    });
  });

  return NextResponse.json({ resume: toResumeDTO(row) }, { status: 201 });
});
