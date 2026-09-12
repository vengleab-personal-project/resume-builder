import 'server-only';
import type { AiAction, CoinTransaction, Prisma } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import { getActionCost } from '@/server/ai/registry/actionCostService';
import type { CoinTransactionDTO } from '@/shared/types/coins';

type DbClient = Prisma.TransactionClient | typeof prisma;

export const SIGNUP_BONUS_COINS = 10;

export class InsufficientCoinsError extends Error {
  readonly code = 'INSUFFICIENT_COINS' as const;
  readonly status = 402 as const;
  readonly required: number;
  readonly balance: number;

  constructor(required: number, balance: number) {
    super(`Insufficient coins: ${required} required, ${balance} available`);
    this.name = 'InsufficientCoinsError';
    this.required = required;
    this.balance = balance;
  }
}

function assertPositiveInteger(amount: number, label: string): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive integer, received ${amount}`);
  }
}

export async function getBalance(userId: string, client: DbClient = prisma): Promise<number> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  });
  return user?.coinBalance ?? 0;
}

// Every balance mutation goes through one of these two helpers, and both do it
// with a single conditional `UPDATE ... RETURNING`. Postgres re-evaluates the
// WHERE clause after taking the row lock, so a concurrent debit that would
// overdraw simply matches zero rows -- no SELECT FOR UPDATE, no read-then-write
// race, and no interactive transaction held open across the AI call that
// follows.
async function applyBalanceDelta(
  client: DbClient,
  userId: string,
  delta: number,
  requireNonNegative: boolean
): Promise<number | null> {
  const rows = requireNonNegative
    ? await client.$queryRaw<{ coinBalance: number }[]>`
        UPDATE "User"
           SET "coinBalance" = "coinBalance" + ${delta}
         WHERE "id" = ${userId}
           AND "coinBalance" + ${delta} >= 0
        RETURNING "coinBalance"`
    : await client.$queryRaw<{ coinBalance: number }[]>`
        UPDATE "User"
           SET "coinBalance" = "coinBalance" + ${delta}
         WHERE "id" = ${userId}
        RETURNING "coinBalance"`;

  return rows[0]?.coinBalance ?? null;
}

export interface DebitParams {
  userId: string;
  amount: number;
  action?: AiAction;
  modelId?: string;
  requestId?: string;
  note?: string;
}

export interface DebitResult {
  balance: number;
  // null when the action was free (cost 0): nothing was charged, so there is
  // nothing to refund either.
  transactionId: string | null;
  charged: number;
}

export async function debitCoins(params: DebitParams): Promise<DebitResult> {
  const { userId, amount, action, modelId, requestId, note } = params;

  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`Debit amount must be a non-negative integer, received ${amount}`);
  }

  if (amount === 0) {
    return { balance: await getBalance(userId), transactionId: null, charged: 0 };
  }

  return prisma.$transaction(async (tx) => {
    const balanceAfter = await applyBalanceDelta(tx, userId, -amount, true);

    if (balanceAfter === null) {
      throw new InsufficientCoinsError(amount, await getBalance(userId, tx));
    }

    const transaction = await tx.coinTransaction.create({
      data: {
        userId,
        type: 'DEDUCTION',
        amount: -amount,
        balanceAfter,
        relatedAction: action ?? null,
        modelId: modelId ?? null,
        requestId: requestId ?? null,
        note: note ?? null,
      },
      select: { id: true },
    });

    return { balance: balanceAfter, transactionId: transaction.id, charged: amount };
  });
}

export interface CreditParams {
  userId: string;
  amount: number;
  type?: 'PURCHASE' | 'REFUND' | 'ADMIN_ADJUSTMENT';
  paymentOrderId?: string;
  reversesId?: string;
  note?: string;
}

export async function creditCoins(
  params: CreditParams,
  client: DbClient = prisma
): Promise<{ balance: number; transactionId: string }> {
  const { userId, amount, type = 'ADMIN_ADJUSTMENT', paymentOrderId, reversesId, note } = params;
  assertPositiveInteger(amount, 'Credit amount');

  const balanceAfter = await applyBalanceDelta(client, userId, amount, false);
  if (balanceAfter === null) {
    throw new Error(`Cannot credit coins: user ${userId} not found`);
  }

  const transaction = await client.coinTransaction.create({
    data: {
      userId,
      type,
      amount,
      balanceAfter,
      paymentOrderId: paymentOrderId ?? null,
      reversesId: reversesId ?? null,
      note: note ?? null,
    },
    select: { id: true },
  });

  return { balance: balanceAfter, transactionId: transaction.id };
}

export async function adjustCoins(params: {
  userId: string;
  amount: number;
  note?: string;
}): Promise<{ balance: number; transactionId: string }> {
  const { userId, amount, note } = params;
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error(`Adjustment must be a non-zero integer, received ${amount}`);
  }

  return prisma.$transaction(async (tx) => {
    const balanceAfter = await applyBalanceDelta(tx, userId, amount, amount < 0);
    if (balanceAfter === null) {
      throw new InsufficientCoinsError(Math.abs(amount), await getBalance(userId, tx));
    }

    const transaction = await tx.coinTransaction.create({
      data: {
        userId,
        type: 'ADMIN_ADJUSTMENT',
        amount,
        balanceAfter,
        note: note ?? null,
      },
      select: { id: true },
    });

    return { balance: balanceAfter, transactionId: transaction.id };
  });
}

export async function grantSignupBonus(userId: string): Promise<void> {
  if (SIGNUP_BONUS_COINS <= 0) return;

  try {
    await creditCoins({
      userId,
      amount: SIGNUP_BONUS_COINS,
      type: 'ADMIN_ADJUSTMENT',
      note: 'SIGNUP_BONUS',
    });
  } catch (error) {
    // A failed welcome bonus must never fail the signup that triggered it.
    console.error(`Failed to grant signup bonus to ${userId}:`, error);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

/**
 * Reverses a DEDUCTION. Idempotent: `CoinTransaction.reversesId` is unique, so a
 * concurrent or retried refund loses the insert race and returns the winner's
 * row instead of crediting a second time.
 */
export async function refundDeduction(params: {
  deductionId: string;
  reason?: string;
}): Promise<{ balance: number; transactionId: string; alreadyRefunded: boolean }> {
  const { deductionId, reason } = params;

  const existing = await prisma.coinTransaction.findUnique({
    where: { reversesId: deductionId },
    select: { id: true, balanceAfter: true, userId: true },
  });
  if (existing) {
    return {
      balance: await getBalance(existing.userId),
      transactionId: existing.id,
      alreadyRefunded: true,
    };
  }

  const deduction = await prisma.coinTransaction.findUnique({
    where: { id: deductionId },
    select: { id: true, userId: true, amount: true, type: true },
  });

  if (!deduction || deduction.type !== 'DEDUCTION') {
    throw new Error(`Cannot refund ${deductionId}: not a deduction`);
  }

  try {
    const result = await prisma.$transaction((tx) =>
      creditCoins(
        {
          userId: deduction.userId,
          amount: Math.abs(deduction.amount),
          type: 'REFUND',
          reversesId: deduction.id,
          note: reason,
        },
        tx
      )
    );
    return { ...result, alreadyRefunded: false };
  } catch (error) {
    if (isUniqueViolation(error)) {
      const winner = await prisma.coinTransaction.findUniqueOrThrow({
        where: { reversesId: deductionId },
        select: { id: true, userId: true },
      });
      return {
        balance: await getBalance(winner.userId),
        transactionId: winner.id,
        alreadyRefunded: true,
      };
    }
    throw error;
  }
}

export function toCoinTransactionDTO(row: CoinTransaction): CoinTransactionDTO {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    relatedAction: row.relatedAction,
    modelId: row.modelId,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listTransactions(params: {
  userId: string;
  limit?: number;
  cursor?: string;
}): Promise<{ transactions: CoinTransactionDTO[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);

  const rows = await prisma.coinTransaction.findMany({
    where: { userId: params.userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const page = rows.slice(0, limit);
  return {
    transactions: page.map(toCoinTransactionDTO),
    nextCursor: rows.length > limit ? page[page.length - 1].id : null,
  };
}

export interface CoinDeductionContext {
  userId: string;
  action: AiAction;
  modelId: string;
  requestId?: string;
}

export interface BillableOutcome<T> {
  data: T;
  // `false` means the request was served by a non-billable path -- the mock
  // refinement or the heuristic evaluation -- and the pre-charge is refunded.
  billable?: boolean;
}

export interface CoinDeductionResult<T> {
  data: T;
  balance: number;
  charged: number;
}

/**
 * Pre-charge, then compensate.
 *
 * The alternative, checking the balance and deducting after success, lets N
 * concurrent requests all pass the same check and run for free. A reservation
 * table was also rejected: the atomic conditional debit already *is* the
 * reservation, and a second table would need an orphan reaper for functions
 * killed mid-flight.
 *
 * The debit is committed before `fn` runs, deliberately -- holding a Prisma
 * transaction open across a 30-60s AI call would pin a pooled connection and
 * exhaust the serverless pool. Failure is handled by writing a compensating
 * REFUND row, not by rolling back.
 */
export async function withCoinDeduction<T>(
  context: CoinDeductionContext,
  fn: () => Promise<BillableOutcome<T>>
): Promise<CoinDeductionResult<T>> {
  const cost = await getActionCost(context.action, context.modelId);

  const { balance, transactionId, charged } = await debitCoins({
    userId: context.userId,
    amount: cost,
    action: context.action,
    modelId: context.modelId,
    requestId: context.requestId,
  });

  let outcome: BillableOutcome<T>;
  try {
    outcome = await fn();
  } catch (error) {
    if (transactionId) {
      await refundDeduction({ deductionId: transactionId, reason: 'AI_CALL_FAILED' }).catch(
        (refundError) => {
          console.error(`Failed to refund deduction ${transactionId}:`, refundError);
        }
      );
    }
    throw error;
  }

  if (outcome.billable === false && transactionId) {
    const refund = await refundDeduction({
      deductionId: transactionId,
      reason: 'NON_BILLABLE_RESULT',
    }).catch((refundError) => {
      console.error(`Failed to refund non-billable deduction ${transactionId}:`, refundError);
      return null;
    });

    return { data: outcome.data, balance: refund?.balance ?? balance, charged: 0 };
  }

  return { data: outcome.data, balance, charged };
}

export async function getActionCosts(modelId: string): Promise<Record<AiAction, number>> {
  const actions: AiAction[] = ['PARSE_RESUME', 'REFINE_RESUME', 'EVALUATE_RESUME'];
  const costs = await Promise.all(actions.map((action) => getActionCost(action, modelId)));
  return Object.fromEntries(actions.map((action, index) => [action, costs[index]])) as Record<
    AiAction,
    number
  >;
}
