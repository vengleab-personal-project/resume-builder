import type { NextRequest } from 'next/server';
import { serverEnv } from '@/server/config/env.server';
import { HttpError } from '@/server/auth/guards';
import { reconcilePendingOrders } from '@/server/services/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/services/billingHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Safety net for "user paid, then closed the tab". The client poll is the
// primary mechanism; nothing here is required for correctness.
export const GET = withBillingErrors(async (req: NextRequest) => {
  const secret = serverEnv.CRON_SECRET;

  // An unset secret disables the route rather than leaving it open.
  if (!secret) {
    throw new HttpError(404, 'NOT_FOUND', 'Not found');
  }

  const presented =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.nextUrl.searchParams.get('secret') ??
    '';

  if (presented !== secret) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid cron secret');
  }

  return jsonNoStore(await reconcilePendingOrders());
});
