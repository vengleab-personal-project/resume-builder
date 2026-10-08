import { requireUser } from '@/server/modules/auth/guards';
import { getBalance } from '@/server/modules/billing/coinService';
import { syncPaymentOrder, toPaymentOrderDTO } from '@/server/modules/billing/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withBillingErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;

    const order = await syncPaymentOrder({ orderId: id, userId: user.id });

    return jsonNoStore({
      order: await toPaymentOrderDTO(order),
      balance: await getBalance(user.id),
    });
  }
);
