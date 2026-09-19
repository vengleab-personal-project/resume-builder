import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError } from '@/server/errors';
import { isPaymentProviderKey, listAvailableProviders } from '@/server/modules/billing/payments/registry';
import {
  createPaymentOrder,
  listUserOrders,
  toPaymentOrderDTO,
} from '@/server/modules/billing/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  packageId: z.string().min(1),
  provider: z.string().optional(),
});

export const GET = withBillingErrors(async () => {
  const user = await requireUser();
  const orders = await listUserOrders({ userId: user.id });

  return jsonNoStore({
    orders: await Promise.all(orders.map((order) => toPaymentOrderDTO(order))),
  });
});

export const POST = withBillingErrors(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();

  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'packageId is required');
  }

  const available = await listAvailableProviders();
  if (available.length === 0) {
    throw new HttpError(503, 'INTERNAL_ERROR', 'No payment provider is currently configured');
  }

  const requested = parsed.data.provider;
  if (requested !== undefined && !isPaymentProviderKey(requested)) {
    throw new HttpError(400, 'INVALID_INPUT', `Unknown payment provider: ${requested}`);
  }

  const provider = requested === undefined ? available[0].id : requested;

  const order = await createPaymentOrder({
    userId: user.id,
    packageId: parsed.data.packageId,
    provider,
  });

  return jsonNoStore(
    { order: await toPaymentOrderDTO(order, { includeQrImage: true }) },
    { status: 201 }
  );
});
