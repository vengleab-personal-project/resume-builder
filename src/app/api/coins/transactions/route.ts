import type { NextRequest } from 'next/server';
import { requireUser } from '@/server/modules/auth/guards';
import { getBalance, listTransactions } from '@/server/modules/billing/coinService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withBillingErrors(async (req: NextRequest) => {
  const user = await requireUser();

  const limitParam = req.nextUrl.searchParams.get('limit');
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const page = await listTransactions({
    userId: user.id,
    limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
  });

  return jsonNoStore({ ...page, balance: await getBalance(user.id) });
});
