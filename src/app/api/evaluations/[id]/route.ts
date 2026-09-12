import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { HttpError, assertSameOrigin, requireUser, withAuthErrors } from '@/server/auth/guards';
import {
  EVALUATION_SUMMARY_SELECT,
  toEvaluationDTO,
} from '@/server/services/evaluationPersistenceService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuthErrors(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireUser();
  const { id } = await context.params;

  const row = await prisma.evaluationResult.findFirst({
    where: { id, userId: user.id },
    select: { ...EVALUATION_SUMMARY_SELECT, resumeSnapshot: true },
  });

  if (!row) {
    throw new HttpError(404, 'NOT_FOUND', 'Evaluation not found');
  }

  return NextResponse.json(
    { evaluation: toEvaluationDTO(row) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
});

export const DELETE = withAuthErrors(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  // deleteMany scoped by userId, not delete-by-id: a delete() would 404 on
  // someone else's row only after confirming it exists.
  const { count } = await prisma.evaluationResult.deleteMany({
    where: { id, userId: user.id },
  });

  if (count === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Evaluation not found');
  }

  return NextResponse.json({ ok: true });
});
