import type { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { serverEnv } from '@/server/config/env.server';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError } from '@/server/errors';
import { getBalance } from '@/server/modules/billing/coinService';
import { syncPaymentOrder, toPaymentOrderDTO } from '@/server/modules/billing/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Development affordance that makes the full purchase UX demoable before Bakong
// credentials exist. Refuses in production twice over: here, and again at the
// mock provider's module-load assertion.
export const POST = withBillingErrors(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    if (serverEnv.isProduction || !serverEnv.PAYMENTS_MOCK_ENABLED) {
      throw new HttpError(404, 'NOT_FOUND', 'Not found');
    }

    assertSameOrigin(req);
    const user = await requireUser();
    const { id } = await ctx.params;

    const order = await prisma.paymentOrder.findFirst({
      where: { id, userId: user.id, provider: 'MOCK' },
      select: { billNumber: true },
    });
    if (!order) {
      throw new HttpError(404, 'NOT_FOUND', 'Mock order not found');
    }

    const { markMockOrderPaid } = await import('@/server/modules/billing/payments/providers/mock');
    markMockOrderPaid(order.billNumber);

    const synced = await syncPaymentOrder({ orderId: id, userId: user.id, force: true });

    return jsonNoStore({
      order: await toPaymentOrderDTO(synced),
      balance: await getBalance(user.id),
    });
  }
);
