import { HttpError } from '@/server/errors';
import { isPaymentProviderKey } from '@/server/modules/billing/payments/registry';
import { handleProviderWebhook } from '@/server/modules/billing/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deliberately unauthenticated by session: providers call this server-to-server.
// Authenticity is the provider adapter's `verifyWebhook` responsibility, and the
// endpoint only ever moves an order towards the state the provider reports --
// it can never create an order or credit an arbitrary user.
export const POST = withBillingErrors(
  async (req: Request, ctx: { params: Promise<{ provider: string }> }) => {
    const { provider } = await ctx.params;
    const providerId = provider.toUpperCase();

    if (!isPaymentProviderKey(providerId)) {
      throw new HttpError(404, 'NOT_FOUND', `Unknown payment provider: ${provider}`);
    }

    const result = await handleProviderWebhook(providerId, req);
    return jsonNoStore(result, { status: result.handled ? 200 : 202 });
  }
);
