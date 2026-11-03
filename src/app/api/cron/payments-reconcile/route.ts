import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { serverEnv } from '@/server/config/env.server';
import { HttpError } from '@/server/errors';
import { reconcilePendingOrders } from '@/server/modules/billing/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Constant-time, so the check does not reveal how much of a guess was right. The digests
// are compared (not the strings) because timingSafeEqual needs equal lengths.
const matchesSecret = (presented: string, secret: string) =>
  timingSafeEqual(createHash('sha256').update(presented).digest(), createHash('sha256').update(secret).digest());

// Safety net for "user paid, then closed the tab". The client poll is the
// primary mechanism; nothing here is required for correctness.
export const GET = withBillingErrors(async (req: NextRequest) => {
  const secret = serverEnv.CRON_SECRET;

  // An unset secret disables the route rather than leaving it open.
  if (!secret) {
    throw new HttpError(404, 'NOT_FOUND', 'Not found');
  }

  // Header only: a secret in the query string ends up in access logs and referrers.
  const presented = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

  if (!matchesSecret(presented, secret)) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid cron secret');
  }

  return jsonNoStore(await reconcilePendingOrders());
});
