/**
 * Standalone verification for the two properties in this workstream most likely
 * to be subtly wrong, neither of which a type checker can catch:
 *
 *   1. Concurrent debits cannot overdraw. 10 simultaneous withCoinDeduction()
 *      calls against a balance that affords 3 must charge exactly 3.
 *   2. Concurrent settlements cannot double-credit. 5 simultaneous
 *      settlePaidOrder() calls for one order must produce exactly one PURCHASE.
 *
 * Run against a throwaway Postgres, never a real database:
 *   docker run -d --name rb-coin-pg -e POSTGRES_PASSWORD=postgres \
 *     -e POSTGRES_USER=postgres -e POSTGRES_DB=rbcoin -p 55433:5432 postgres:16
 *   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
 *   DATABASE_URL=... npx tsx --conditions=react-server \
 *     scripts/verify-coin-concurrency.ts
 *
 * `--conditions=react-server` is required: the services under test import
 * `server-only`, which throws under the default Node resolution conditions.
 */
import { PrismaClient } from '../src/server/db/generated/prisma';
import { getActionCost } from '../src/server/ai/registry/actionCostService';
import {
  InsufficientCoinsError,
  debitCoins,
  refundDeduction,
  withCoinDeduction,
} from '../src/server/services/coinService';
import {
  createPaymentOrder,
  settlePaidOrder,
  syncPaymentOrder,
} from '../src/server/services/paymentService';
import { markMockOrderPaid } from '../src/server/payments/providers/mock';
import {
  isSettled,
  isTransactionNotFound,
  type BakongCheckResponse,
} from '../src/server/payments/providers/bakong/client';
import { formatMinor, toMinor } from '../src/server/payments/currency';

const prisma = new PrismaClient();

let failures = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function reset(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "CoinTransaction", "PaymentOrder", "CoinPackage", "ActionCost", "ChatModel", "User" RESTART IDENTITY CASCADE'
  );
}

async function makeUser(balance: number): Promise<string> {
  const user = await prisma.user.create({
    data: {
      username: `probe_${Math.random().toString(36).slice(2, 10)}`,
      passwordHash: 'x',
      coinBalance: balance,
    },
    select: { id: true },
  });
  return user.id;
}

async function testConcurrentDebit(): Promise<void> {
  console.log('\n--- concurrent debit (no overdraft) ---');
  await reset();

  // Outside a Next request context getActionCost degrades to the static
  // fallback costs, so read the price rather than assuming it: the property
  // under test is "exactly floor(balance / cost) calls succeed", not the price.
  const COST = await getActionCost('PARSE_RESUME', 'gemini-3.8-flash');
  check('action cost is a positive integer', Number.isInteger(COST) && COST > 0, true);

  const AFFORDABLE = 3;
  const STARTING_BALANCE = COST * AFFORDABLE;
  const userId = await makeUser(STARTING_BALANCE);
  console.log(`  cost/call=${COST}, starting balance=${STARTING_BALANCE}, concurrent calls=10`);

  const results = await Promise.allSettled(
    Array.from({ length: 10 }, (_, index) =>
      withCoinDeduction(
        { userId, action: 'PARSE_RESUME', modelId: 'gemini-3.8-flash', requestId: `req-${index}` },
        async () => {
          // Stand-in for the AI call: long enough that every debit is in flight
          // before any of them completes.
          await new Promise((resolve) => setTimeout(resolve, 40));
          return { data: index };
        }
      )
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const insufficient = results.filter(
    (r) => r.status === 'rejected' && r.reason instanceof InsufficientCoinsError
  ).length;
  const otherErrors = results.filter(
    (r) => r.status === 'rejected' && !(r.reason instanceof InsufficientCoinsError)
  );
  for (const failure of otherErrors) {
    console.log('  unexpected rejection:', (failure as PromiseRejectedResult).reason);
  }

  const { coinBalance } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { coinBalance: true },
  });
  const deductions = await prisma.coinTransaction.count({
    where: { userId, type: 'DEDUCTION' },
  });
  const ledgerSum = await prisma.coinTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  check('successful calls', succeeded, AFFORDABLE);
  check('INSUFFICIENT_COINS rejections', insufficient, 10 - AFFORDABLE);
  check('unexpected rejections', otherErrors.length, 0);
  check('final balance', coinBalance, 0);
  check('DEDUCTION rows written', deductions, AFFORDABLE);
  // The core ledger invariant: SUM(amount) must account for every coin that
  // left the starting balance.
  check('ledger sum reconciles', STARTING_BALANCE + (ledgerSum._sum.amount ?? 0), coinBalance);
}

// Same property at a cost the registry does not get to pick, so the result does
// not silently depend on whatever getActionCost happens to return.
async function testConcurrentDebitAtFixedCost(): Promise<void> {
  console.log('\n--- concurrent debit at a fixed cost of 7 ---');
  await reset();

  const COST = 7;
  const AFFORDABLE = 3;
  const userId = await makeUser(COST * AFFORDABLE);

  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () =>
      debitCoins({ userId, amount: COST, action: 'EVALUATE_RESUME' })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const { coinBalance } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { coinBalance: true },
  });

  check('successful debits', succeeded, AFFORDABLE);
  check('final balance', coinBalance, 0);
  check(
    'DEDUCTION rows written',
    await prisma.coinTransaction.count({ where: { userId, type: 'DEDUCTION' } }),
    AFFORDABLE
  );
}

async function testOverdraftCheckConstraint(): Promise<void> {
  console.log('\n--- CHECK constraint backstop ---');
  await reset();
  const userId = await makeUser(1);

  const raw = await prisma
    .$executeRaw`UPDATE "User" SET "coinBalance" = "coinBalance" - 5 WHERE "id" = ${userId}`
    .then(() => 'accepted')
    .catch(() => 'rejected');
  check('raw overdraft rejected by CHECK', raw, 'rejected');

  const typed = await debitCoins({ userId, amount: 5 })
    .then(() => 'accepted')
    .catch((error) => (error instanceof InsufficientCoinsError ? 'insufficient' : 'other'));
  check('debitCoins reports insufficient', typed, 'insufficient');
}

async function testConcurrentSettlement(): Promise<void> {
  console.log('\n--- concurrent settlement (no double credit) ---');
  await reset();

  const userId = await makeUser(0);
  const pkg = await prisma.coinPackage.create({
    data: {
      code: 'probe',
      name: 'Probe',
      coinAmount: 100,
      bonusCoins: 20,
      priceMinor: 20000,
      currency: 'KHR',
    },
  });

  const order = await prisma.paymentOrder.create({
    data: {
      userId,
      provider: 'MOCK',
      packageId: pkg.id,
      coinAmount: pkg.coinAmount,
      bonusCoins: pkg.bonusCoins,
      fiatAmountMinor: pkg.priceMinor,
      currency: pkg.currency,
      billNumber: `RBPROBE${Date.now().toString(36).toUpperCase()}`,
      expiresAt: new Date(Date.now() + 600_000),
    },
  });

  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      settlePaidOrder({
        orderId: order.id,
        providerTxnId: 'mock_txn_probe',
        paidAmountMinor: pkg.priceMinor,
      })
    )
  );

  const settled = results.filter(
    (r) => r.status === 'fulfilled' && r.value.settled === true
  ).length;
  const rejected = results.filter((r) => r.status === 'rejected');
  for (const failure of rejected) {
    console.log('  unexpected rejection:', (failure as PromiseRejectedResult).reason);
  }

  const purchases = await prisma.coinTransaction.count({
    where: { userId, type: 'PURCHASE' },
  });
  const { coinBalance } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { coinBalance: true },
  });
  const settledOrder = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });

  check('settlements that claimed the order', settled, 1);
  check('unexpected rejections', rejected.length, 0);
  check('PURCHASE rows written', purchases, 1);
  check('balance credited once', coinBalance, pkg.coinAmount + pkg.bonusCoins);
  check('order status', settledOrder.status, 'PAID');

  // Guard 3: a second order must not be able to claim the same bank transaction.
  const rival = await prisma.paymentOrder.create({
    data: {
      userId,
      provider: 'MOCK',
      packageId: pkg.id,
      coinAmount: pkg.coinAmount,
      bonusCoins: pkg.bonusCoins,
      fiatAmountMinor: pkg.priceMinor,
      currency: pkg.currency,
      billNumber: `RBRIVAL${Date.now().toString(36).toUpperCase()}`,
      expiresAt: new Date(Date.now() + 600_000),
    },
  });

  const rivalResult = await settlePaidOrder({
    orderId: rival.id,
    providerTxnId: 'mock_txn_probe',
    paidAmountMinor: pkg.priceMinor,
  });
  const rivalOrder = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: rival.id } });
  const purchasesAfterRival = await prisma.coinTransaction.count({
    where: { userId, type: 'PURCHASE' },
  });

  check('duplicate bank txn not settled', rivalResult.settled, false);
  check('duplicate bank txn parked FAILED', rivalOrder.status, 'FAILED');
  check('duplicate bank txn reason', rivalOrder.failureReason, 'DUPLICATE_PROVIDER_TXN');
  check('still exactly one PURCHASE', purchasesAfterRival, 1);
}

// End-to-end through the provider abstraction, not just the service layer.
async function testMockProviderFlow(): Promise<void> {
  console.log('\n--- mock provider purchase flow ---');
  await reset();

  const userId = await makeUser(0);
  const pkg = await prisma.coinPackage.create({
    data: {
      code: 'flow',
      name: 'Flow',
      coinAmount: 60,
      bonusCoins: 10,
      priceMinor: 10000,
      currency: 'KHR',
    },
  });

  const order = await createPaymentOrder({ userId, packageId: pkg.id, provider: 'MOCK' });
  check('order starts PENDING', order.status, 'PENDING');
  check('order carries a QR payload', Boolean(order.qrPayload && order.qrMd5), true);
  check('price came from the package', order.fiatAmountMinor, pkg.priceMinor);

  const beforePay = await syncPaymentOrder({ orderId: order.id, userId, force: true });
  check('still PENDING before payment', beforePay.status, 'PENDING');

  markMockOrderPaid(order.billNumber);

  const afterPay = await syncPaymentOrder({ orderId: order.id, userId, force: true });
  check('PAID after payment', afterPay.status, 'PAID');

  // A duplicate poll after settlement must be a no-op, not a second credit.
  await syncPaymentOrder({ orderId: order.id, userId, force: true });

  const { coinBalance } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { coinBalance: true },
  });
  check('coins credited once', coinBalance, pkg.coinAmount + pkg.bonusCoins);
  check(
    'PURCHASE rows written',
    await prisma.coinTransaction.count({ where: { userId, type: 'PURCHASE' } }),
    1
  );
}

// Bakong has no sandbox reachable without credentials, so its response mapping
// is checked against recorded response shapes instead.
function testBakongResponseMapping(): void {
  console.log('\n--- bakong response fixtures ---');

  const settled: BakongCheckResponse = {
    responseCode: 0,
    responseMessage: 'Getting transaction successfully',
    data: { hash: 'abc123', amount: 10000, currency: 'KHR', externalRef: 'RBTEST' },
  };
  const notFound: BakongCheckResponse = {
    responseCode: 1,
    errorCode: 1,
    responseMessage: 'Transaction could not be found. Please check and try again.',
    data: null,
  };

  check('settled fixture reads as settled', isSettled(settled), true);
  check('settled fixture is not "not found"', isTransactionNotFound(settled), false);
  check('pending fixture reads as not found', isTransactionNotFound(notFound), true);
  check('pending fixture is not settled', isSettled(notFound), false);
  check('KHR 10000 major -> minor', toMinor(10000, 'KHR'), 10000);
  check('USD 12.34 major -> minor', toMinor(12.34, 'USD'), 1234);
  check('USD minor -> label', formatMinor(123456, 'USD'), '$1,234.56');
  check('KHR minor -> label', formatMinor(20000, 'KHR'), '20,000៛');
}

async function testRefundIdempotency(): Promise<void> {
  console.log('\n--- refund idempotency ---');
  await reset();

  const userId = await makeUser(10);
  const { transactionId } = await debitCoins({ userId, amount: 4, action: 'REFINE_RESUME' });

  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () => refundDeduction({ deductionId: transactionId!, reason: 'probe' }))
  );
  const rejected = results.filter((r) => r.status === 'rejected');
  for (const failure of rejected) {
    console.log('  unexpected rejection:', (failure as PromiseRejectedResult).reason);
  }

  const refunds = await prisma.coinTransaction.count({ where: { userId, type: 'REFUND' } });
  const { coinBalance } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { coinBalance: true },
  });

  check('unexpected rejections', rejected.length, 0);
  check('REFUND rows written', refunds, 1);
  check('balance restored', coinBalance, 10);
}

async function main(): Promise<void> {
  await testConcurrentDebit();
  await testConcurrentDebitAtFixedCost();
  await testOverdraftCheckConstraint();
  await testConcurrentSettlement();
  await testMockProviderFlow();
  testBakongResponseMapping();
  await testRefundIdempotency();

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
