import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { HttpError, requireUser, withAuthErrors } from '@/server/auth/guards';
import {
  EVALUATION_SUMMARY_SELECT,
  toEvaluationSummary,
} from '@/server/services/evaluationPersistenceService';
import { evaluationListQuerySchema } from '@/shared/lib/validation/resumeSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuthErrors(async (req: NextRequest) => {
  const user = await requireUser();

  const parsed = evaluationListQuerySchema.safeParse({
    limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
  });

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid pagination parameters');
  }

  const { limit, cursor } = parsed.data;

  // Cursor pagination on a cuid primary key, not OFFSET: history grows without
  // bound and an offset scan gets linearly slower as it does.
  const rows = await prisma.evaluationResult.findMany({
    where: { userId: user.id },
    select: EVALUATION_SUMMARY_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json(
    {
      evaluations: page.map(toEvaluationSummary),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
});
