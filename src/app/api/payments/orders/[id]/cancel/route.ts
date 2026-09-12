import type { NextRequest } from 'next/server';
import { assertSameOrigin, requireUser } from '@/server/auth/guards';
import { cancelPaymentOrder, toPaymentOrderDTO } from '@/server/services/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/services/billingHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withBillingErrors(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { id } = await ctx.params;

    const order = await cancelPaymentOrder({ orderId: id, userId: user.id });
    return jsonNoStore({ order: await toPaymentOrderDTO(order) });
  }
);
