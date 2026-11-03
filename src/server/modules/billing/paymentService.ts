import 'server-only';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import type { CoinPackage, PaymentOrder, Prisma } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import { serverEnv } from '@/server/config/env.server';
import { formatMinor } from '@/server/modules/billing/payments/currency';
import { getConfiguredProvider, getPaymentProvider } from '@/server/modules/billing/payments/registry';
import { PaymentProviderError, type CheckStatusResult } from '@/server/modules/billing/payments/types';
import type {
  CoinPackageDTO,
  CurrencyKey,
  PaymentOrderDTO,
  PaymentProviderKey,
} from '@/shared/types/coins';
import { creditCoins } from './coinService';

export class PaymentError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = 'PaymentError';
    this.status = status;
    this.code = code;
  }
}

const BILL_NUMBER_PREFIX = 'RB';

/** Orders a user may have waiting for payment at once (each one is a live, payable QR). */
export const MAX_OPEN_ORDERS_PER_USER = 5;

/** Reconcile checks this many orders at a time against the provider. */
const RECONCILE_CHUNK_SIZE = 5;
/** Stop starting new chunks after this long: the route's maxDuration is 60s. */
const RECONCILE_BUDGET_MS = 45_000;
/** An order verified unpaid stops being polled this long after it expired. */
const EXPIRED_POLL_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

// Short enough for the KHQR bill-number tag, random enough that a collision is
// a retry rather than a design flaw. Uniqueness is decided by the DB index.
function generateBillNumber(): string {
  return `${BILL_NUMBER_PREFIX}${Date.now().toString(36).toUpperCase()}${randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
}

function isUniqueViolation(error: unknown, target?: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { code?: string; meta?: { target?: unknown } };
  if (candidate.code !== 'P2002') return false;
  if (!target) return true;

  const meta = candidate.meta?.target;
  const fields = Array.isArray(meta) ? meta.join(',') : String(meta ?? '');
  return fields.includes(target);
}

export function totalCoinsFor(source: { coinAmount: number; bonusCoins: number }): number {
  return source.coinAmount + source.bonusCoins;
}

export function toCoinPackageDTO(row: CoinPackage): CoinPackageDTO {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    coinAmount: row.coinAmount,
    bonusCoins: row.bonusCoins,
    totalCoins: totalCoinsFor(row),
    priceMinor: row.priceMinor,
    currency: row.currency,
    priceLabel: formatMinor(row.priceMinor, row.currency),
  };
}

export async function listCoinPackages(): Promise<CoinPackageDTO[]> {
  const rows = await prisma.coinPackage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { priceMinor: 'asc' }],
  });
  return rows.map(toCoinPackageDTO);
}

export async function toPaymentOrderDTO(
  order: PaymentOrder,
  options: { includeQrImage?: boolean } = {}
): Promise<PaymentOrderDTO> {
  // The QR image is rendered on demand from the stored payload rather than
  // persisted: it is a pure function of qrPayload and would only be a second
  // copy of the same truth to keep in sync.
  const qrSvg =
    options.includeQrImage && order.qrPayload
      ? await QRCode.toString(order.qrPayload, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 1,
        })
      : null;

  return {
    id: order.id,
    provider: order.provider,
    status: order.status,
    coinAmount: order.coinAmount,
    bonusCoins: order.bonusCoins,
    totalCoins: totalCoinsFor(order),
    fiatAmountMinor: order.fiatAmountMinor,
    currency: order.currency,
    priceLabel: formatMinor(order.fiatAmountMinor, order.currency),
    billNumber: order.billNumber,
    qrPayload: order.qrPayload,
    qrSvg,
    checkoutUrl: order.checkoutUrl,
    deepLink: order.deepLink,
    failureReason: order.failureReason,
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function createPaymentOrder(params: {
  userId: string;
  packageId: string;
  provider: PaymentProviderKey;
}): Promise<PaymentOrder> {
  const provider = await getConfiguredProvider(params.provider);

  // Price, coin amount and bonus all come from the database. A client-supplied
  // amount is never read anywhere in this file.
  const coinPackage = await prisma.coinPackage.findFirst({
    where: { id: params.packageId, isActive: true },
  });
  if (!coinPackage) {
    throw new PaymentError(404, 'PACKAGE_NOT_FOUND', 'Coin package not found or inactive');
  }

  if (!provider.capabilities.currencies.includes(coinPackage.currency as CurrencyKey)) {
    throw new PaymentError(
      400,
      'CURRENCY_UNSUPPORTED',
      `${provider.id} does not support ${coinPackage.currency}`
    );
  }

  // Each open order is a live QR that can still be paid, so they are not cancelled to make
  // room (the oldest may be the one the user already paid). A user over the cap cancels one.
  const open = await prisma.paymentOrder.count({
    where: { userId: params.userId, status: 'PENDING', expiresAt: { gt: new Date() } },
  });
  if (open >= MAX_OPEN_ORDERS_PER_USER) {
    throw new PaymentError(429, 'TOO_MANY_OPEN_ORDERS', 'Too many unpaid orders. Cancel one first.');
  }

  const expiresAt = new Date(Date.now() + serverEnv.PAYMENT_ORDER_TTL_SECONDS * 1000);

  let order: PaymentOrder | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
    try {
      order = await prisma.paymentOrder.create({
        data: {
          userId: params.userId,
          provider: params.provider,
          packageId: coinPackage.id,
          coinAmount: coinPackage.coinAmount,
          bonusCoins: coinPackage.bonusCoins,
          fiatAmountMinor: coinPackage.priceMinor,
          currency: coinPackage.currency,
          billNumber: generateBillNumber(),
          expiresAt,
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error, 'billNumber')) throw error;
    }
  }

  if (!order) {
    throw new PaymentError(500, 'BILL_NUMBER_COLLISION', 'Could not allocate a bill number');
  }

  // The row exists before the provider is called so that a provider failure
  // leaves an auditable FAILED order rather than a payment nobody can trace.
  try {
    const result = await provider.createOrder({
      orderId: order.id,
      billNumber: order.billNumber,
      userId: params.userId,
      coinAmount: totalCoinsFor(order),
      amountMinor: order.fiatAmountMinor,
      currency: order.currency,
      description: `${totalCoinsFor(order)} coins`,
      expiresAt: order.expiresAt,
    });

    return prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        qrPayload: result.qrPayload ?? null,
        qrMd5: result.qrMd5 ?? null,
        checkoutUrl: result.checkoutUrl ?? null,
        deepLink: result.deepLink ?? null,
        providerRef: result.providerRef ?? null,
      },
    });
  } catch (error) {
    await prisma.paymentOrder.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: {
        status: 'FAILED',
        failureReason:
          error instanceof PaymentProviderError ? error.code : 'PROVIDER_CREATE_FAILED',
      },
    });
    throw error;
  }
}

export interface SettlementResult {
  settled: boolean;
  alreadySettled: boolean;
  balance: number | null;
}

/**
 * Credits an order exactly once, no matter how many pollers, retries and
 * webhooks race for it. Three independent guards, any one of which is
 * sufficient:
 *
 *  1. The status transition itself is the claim -- `updateMany` scoped to
 *     `status: 'PENDING'` returns count 0 for every loser.
 *  2. `CoinTransaction.paymentOrderId` is unique, so a second PURCHASE row for
 *     the same order cannot be inserted.
 *  3. `PaymentOrder @@unique([provider, providerTxnId])` stops two *different*
 *     orders from both claiming one real-world bank transaction.
 *
 * Claim and credit share one transaction: no external call happens between
 * them, so there is no window where an order reads PAID but no coins exist.
 */
/**
 * Whether what the provider says was paid covers the order. Money-handling and pure, so it is
 * the part that is tested on its own.
 *
 * Both the amount and its currency must be present and right. Treating a missing amount as
 * "fine" credited the full package whenever a provider response omitted it, and comparing
 * minor units across currencies (100 KHR vs 100 USD cents) is meaningless.
 */
export type SettlementDecision =
  | { ok: true }
  | { ok: false; reason: 'AMOUNT_UNVERIFIED' | 'AMOUNT_MISMATCH' | 'CURRENCY_MISMATCH' };

export function decideSettlement(
  order: { fiatAmountMinor: number; currency: string },
  paid: { paidAmountMinor?: number; paidCurrency?: string }
): SettlementDecision {
  if (typeof paid.paidAmountMinor !== 'number' || !paid.paidCurrency) {
    return { ok: false, reason: 'AMOUNT_UNVERIFIED' };
  }
  if (paid.paidCurrency !== order.currency) return { ok: false, reason: 'CURRENCY_MISMATCH' };
  if (paid.paidAmountMinor < order.fiatAmountMinor) return { ok: false, reason: 'AMOUNT_MISMATCH' };
  return { ok: true };
}

export async function settlePaidOrder(params: {
  orderId: string;
  providerTxnId: string | null;
  paidAmountMinor?: number;
  paidCurrency?: string;
}): Promise<SettlementResult> {
  const { orderId, providerTxnId, paidAmountMinor, paidCurrency } = params;

  const order = await prisma.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new PaymentError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
  }

  if (order.status !== 'PENDING') {
    return {
      settled: false,
      alreadySettled: order.status === 'PAID',
      balance: null,
    };
  }

  // An underpayment, a wrong currency or an amount the provider did not report must not be
  // settled: crediting the full package is a direct loss. The order is parked FAILED with the
  // reason, which is what a manual review reads; the coins are not credited.
  const decision = decideSettlement(order, { paidAmountMinor, paidCurrency });
  if (!decision.ok) {
    try {
      await prisma.paymentOrder.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'FAILED', failureReason: decision.reason, providerTxnId },
      });
    } catch (error) {
      // The bank transaction is already recorded on another order. Park this one without it:
      // the reason it was refused matters more than the reference, and a poll must not 500.
      if (!isUniqueViolation(error, 'providerTxnId')) throw error;
      await prisma.paymentOrder.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'FAILED', failureReason: decision.reason },
      });
    }
    return { settled: false, alreadySettled: false, balance: null };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const claim = await tx.paymentOrder.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          providerTxnId,
          lastCheckedAt: new Date(),
          failureReason: null,
        },
      });

      if (claim.count === 0) {
        return { settled: false, alreadySettled: true, balance: null };
      }

      const { balance } = await creditCoins(
        {
          userId: order.userId,
          amount: totalCoinsFor(order),
          type: 'PURCHASE',
          paymentOrderId: order.id,
          note: `Order ${order.billNumber}`,
        },
        tx as Prisma.TransactionClient
      );

      return { settled: true, alreadySettled: false, balance };
    });
  } catch (error) {
    // Guard 3 firing means another order already owns this bank transaction.
    // The whole transaction rolled back, so this order is still PENDING; park
    // it as FAILED so it stops being polled and shows up in reconciliation.
    if (isUniqueViolation(error, 'providerTxnId')) {
      console.error(
        `Order ${order.id} tried to claim providerTxnId ${providerTxnId}, already owned by another order.`
      );
      await prisma.paymentOrder.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'FAILED', failureReason: 'DUPLICATE_PROVIDER_TXN' },
      });
      return { settled: false, alreadySettled: false, balance: null };
    }

    // Guard 2 firing means the coins were already credited for this order.
    if (isUniqueViolation(error, 'paymentOrderId')) {
      return { settled: false, alreadySettled: true, balance: null };
    }

    throw error;
  }
}

async function applyProviderState(
  order: PaymentOrder,
  result: CheckStatusResult
): Promise<PaymentOrder> {
  if (result.state === 'PAID') {
    await settlePaidOrder({
      orderId: order.id,
      providerTxnId: result.providerTxnId ?? null,
      paidAmountMinor: result.paidAmountMinor,
      paidCurrency: result.paidCurrency,
    });
  } else if (result.state === 'FAILED') {
    await prisma.paymentOrder.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'FAILED', failureReason: result.failureReason ?? 'PROVIDER_FAILED' },
    });
  } else if (result.state === 'EXPIRED') {
    await prisma.paymentOrder.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });
  }

  return prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
}

/**
 * Polling entry point. Debounced through `PaymentOrder.lastCheckedAt` rather
 * than an in-memory timer, because consecutive polls from one browser land on
 * independent serverless invocations that share nothing but the database.
 */
export async function syncPaymentOrder(params: {
  orderId: string;
  userId?: string;
  force?: boolean;
}): Promise<PaymentOrder> {
  const order = await prisma.paymentOrder.findUnique({ where: { id: params.orderId } });

  if (!order || (params.userId && order.userId !== params.userId)) {
    throw new PaymentError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
  }

  if (order.status !== 'PENDING') return order;

  const debounceCutoff = new Date(Date.now() - serverEnv.PAYMENT_SYNC_DEBOUNCE_MS);
  const claim = await prisma.paymentOrder.updateMany({
    where: {
      id: order.id,
      status: 'PENDING',
      ...(params.force
        ? {}
        : { OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: debounceCutoff } }] }),
    },
    data: { lastCheckedAt: new Date() },
  });

  if (claim.count === 0) return order;

  const provider = await getPaymentProvider(order.provider);

  let result: CheckStatusResult;
  try {
    result = await provider.checkStatus({
      orderId: order.id,
      billNumber: order.billNumber,
      qrMd5: order.qrMd5,
      providerRef: order.providerRef,
      amountMinor: order.fiatAmountMinor,
      currency: order.currency,
      expiresAt: order.expiresAt,
    });
  } catch (error) {
    // Our credentials or the network broke -- never the user's payment. The
    // order stays PENDING so the reconcile cron can recover it.
    if (error instanceof PaymentProviderError && error.retryable) {
      // The debounce claim above stamped lastCheckedAt, but nothing was checked. For an order
      // that is already past its time that stamp would read as "verified unpaid after it
      // expired", so give it back and let the next run try this order first.
      if (order.expiresAt.getTime() < Date.now()) {
        await prisma.paymentOrder.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { lastCheckedAt: order.lastCheckedAt },
        });
      }
      throw new PaymentError(503, error.code, error.message);
    }
    throw error;
  }

  return applyProviderState(order, result);
}

export async function handleProviderWebhook(
  providerId: PaymentProviderKey,
  req: Request
): Promise<{ handled: boolean }> {
  const provider = await getPaymentProvider(providerId);

  if (!provider.verifyWebhook) {
    throw new PaymentError(404, 'WEBHOOK_UNSUPPORTED', `${providerId} has no webhook endpoint`);
  }

  const payload = await provider.verifyWebhook(req);

  const order = await prisma.paymentOrder.findFirst({
    where: {
      provider: providerId,
      ...(payload.billNumber
        ? { billNumber: payload.billNumber }
        : payload.qrMd5
          ? { qrMd5: payload.qrMd5 }
          : { id: '__unmatched__' }),
    },
  });

  if (!order) return { handled: false };

  await applyProviderState(order, {
    state: payload.state,
    providerTxnId: payload.providerTxnId,
    paidAmountMinor: payload.paidAmountMinor,
    paidCurrency: payload.paidCurrency,
    failureReason: payload.failureReason,
  });

  return { handled: true };
}

export async function cancelPaymentOrder(params: {
  orderId: string;
  userId: string;
}): Promise<PaymentOrder> {
  const canceled = await prisma.paymentOrder.updateMany({
    where: { id: params.orderId, userId: params.userId, status: 'PENDING' },
    data: { status: 'CANCELED' },
  });

  const order = await prisma.paymentOrder.findFirst({
    where: { id: params.orderId, userId: params.userId },
  });

  if (!order) {
    throw new PaymentError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
  }

  // A zero count with a PAID order means the payment landed between the user
  // pressing cancel and this write; the settlement wins.
  if (canceled.count === 0 && order.status !== 'CANCELED') {
    throw new PaymentError(409, 'ORDER_NOT_CANCELABLE', `Order is already ${order.status}`);
  }

  return order;
}

export async function listUserOrders(params: {
  userId: string;
  limit?: number;
}): Promise<PaymentOrder[]> {
  return prisma.paymentOrder.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(params.limit ?? 20, 1), 100),
  });
}

/**
 * Stops polling orders that were verified unpaid long ago. An order is only ever marked
 * EXPIRED by `applyProviderState`, i.e. after the provider said "no such payment" for an
 * order past `expiresAt`; a blanket "past its time, so expired" sweep (what this used to be)
 * turned a payment made just before the deadline by someone who then closed the tab into a
 * terminal EXPIRED order nobody ever checked.
 *
 * Prisma cannot compare two columns, hence the raw statement: only orders that were checked
 * *after* they expired, and expired a good while ago, are dropped.
 */
export async function expireStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - EXPIRED_POLL_GRACE_MS);
  return prisma.$executeRaw`
    UPDATE "PaymentOrder"
       SET "status" = 'EXPIRED'
     WHERE "status" = 'PENDING'
       AND "expiresAt" < ${cutoff}
       AND "lastCheckedAt" IS NOT NULL
       AND "lastCheckedAt" > "expiresAt"`;
}

/**
 * Safety net for "user paid, then closed the tab". Correctness does not depend
 * on this running -- the client poll is the primary mechanism -- so it swallows
 * per-order failures and reports counts.
 *
 * Orders that are past their time and have not been checked since go first, so a flood of
 * fresh orders cannot push a real one out of the batch. Checks run a few at a time under a
 * time budget: sequentially, 25 checks at the provider's 10s timeout is far past the route's
 * 60s limit, and being killed mid-run skipped everything after it.
 */
export async function reconcilePendingOrders(
  limit = 25,
  options: { now?: () => number; budgetMs?: number } = {}
): Promise<{
  checked: number;
  settled: number;
  expired: number;
  failed: number;
  skipped: number;
}> {
  const now = options.now ?? Date.now;
  const budgetMs = options.budgetMs ?? RECONCILE_BUDGET_MS;
  const startedAt = now();
  const take = Math.min(Math.max(limit, 1), 100);

  const overdue = await prisma.paymentOrder.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    // Checked-before-expiry (or never) first: those are the ones not yet verified as unpaid.
    orderBy: [{ lastCheckedAt: { sort: 'asc', nulls: 'first' } }],
    take,
    select: { id: true, expiresAt: true, lastCheckedAt: true },
  });
  const unverified = overdue.filter(
    (order) => !order.lastCheckedAt || order.lastCheckedAt <= order.expiresAt
  );

  const rest =
    unverified.length >= take
      ? []
      : await prisma.paymentOrder.findMany({
          where: { status: 'PENDING', id: { notIn: unverified.map((order) => order.id) } },
          orderBy: { lastCheckedAt: { sort: 'asc', nulls: 'first' } },
          take: take - unverified.length,
          select: { id: true },
        });

  const ids = [...unverified.map((order) => order.id), ...rest.map((order) => order.id)];

  let settled = 0;
  let failed = 0;
  let checked = 0;

  for (let index = 0; index < ids.length; index += RECONCILE_CHUNK_SIZE) {
    if (now() - startedAt > budgetMs) break;

    const chunk = ids.slice(index, index + RECONCILE_CHUNK_SIZE);
    const outcomes = await Promise.allSettled(
      chunk.map((id) => syncPaymentOrder({ orderId: id, force: true }))
    );

    outcomes.forEach((outcome, position) => {
      checked += 1;
      if (outcome.status === 'fulfilled') {
        if (outcome.value.status === 'PAID') settled += 1;
      } else {
        failed += 1;
        console.error(`Reconcile failed for order ${chunk[position]}:`, outcome.reason);
      }
    });
  }

  // Orders the provider itself reported as expired were already marked by applyProviderState;
  // this only retires ones verified unpaid a long time ago.
  const expired = await expireStaleOrders();

  return { checked, settled, expired, failed, skipped: ids.length - checked };
}
