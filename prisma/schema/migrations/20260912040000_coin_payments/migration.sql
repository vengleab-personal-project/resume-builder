-- ---------------------------------------------------------------------------
-- Workstream C -- coin ledger + multi-provider payments.
--
-- The DDL below was produced by `prisma migrate diff --from-migrations
-- prisma/schema/migrations --to-schema-datamodel prisma/schema --script`, then
-- the CHECK constraints at the bottom were hand-appended -- Prisma's schema
-- language cannot express "the sign of `amount` must agree with `type`" or
-- "a balance may never go negative".
--
-- Verified against a throwaway postgres:16 container: applied on top of
-- 20260912000000_init_auth, 20260912020000_config_management and
-- 20260912030000_resume_persistence; `migrate diff` against the applied
-- database then reported no drift from the datamodel.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('PURCHASE', 'DEDUCTION', 'REFUND', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentProviderId" AS ENUM ('BAKONG', 'MOCK');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('KHR', 'USD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coinBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedAction" "AiAction",
    "modelId" TEXT,
    "requestId" TEXT,
    "paymentOrderId" TEXT,
    "reversesId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coinAmount" INTEGER NOT NULL,
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "priceMinor" INTEGER NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProviderId" NOT NULL,
    "packageId" TEXT,
    "coinAmount" INTEGER NOT NULL,
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "fiatAmountMinor" INTEGER NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "billNumber" TEXT NOT NULL,
    "providerRef" TEXT,
    "providerTxnId" TEXT,
    "qrPayload" TEXT,
    "qrMd5" TEXT,
    "checkoutUrl" TEXT,
    "deepLink" TEXT,
    "failureReason" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoinTransaction_paymentOrderId_key" ON "CoinTransaction"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinTransaction_reversesId_key" ON "CoinTransaction"("reversesId");

-- CreateIndex
CREATE INDEX "CoinTransaction_userId_createdAt_idx" ON "CoinTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoinTransaction_userId_type_createdAt_idx" ON "CoinTransaction"("userId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoinPackage_code_key" ON "CoinPackage"("code");

-- CreateIndex
CREATE INDEX "CoinPackage_isActive_sortOrder_idx" ON "CoinPackage"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_billNumber_key" ON "PaymentOrder"("billNumber");

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_expiresAt_idx" ON "PaymentOrder"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_lastCheckedAt_idx" ON "PaymentOrder"("status", "lastCheckedAt");

-- CreateIndex
CREATE INDEX "PaymentOrder_qrMd5_idx" ON "PaymentOrder"("qrMd5");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_provider_providerTxnId_key" ON "PaymentOrder"("provider", "providerTxnId");

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "CoinTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CoinPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Hand-written: the ledger invariant is SUM(CoinTransaction.amount) ==
-- User.coinBalance, which only holds if a DEDUCTION can never be written as a
-- positive number (free coins) or a PURCHASE as a negative one. ADMIN_ADJUSTMENT
-- is deliberately unconstrained -- it is bidirectional by definition -- but is
-- still barred from being a no-op.
ALTER TABLE "CoinTransaction"
    ADD CONSTRAINT "CoinTransaction_amount_sign_check"
    CHECK (
        ("type" = 'PURCHASE'         AND "amount" > 0) OR
        ("type" = 'DEDUCTION'        AND "amount" < 0) OR
        ("type" = 'REFUND'           AND "amount" > 0) OR
        ("type" = 'ADMIN_ADJUSTMENT' AND "amount" <> 0)
    );

-- Hand-written: last line of defence behind the atomic conditional debit in
-- coinService.debitCoins. If a future code path ever reads-then-writes the
-- balance, this turns a silent overdraft into a loud transaction failure.
ALTER TABLE "User"
    ADD CONSTRAINT "User_coin_balance_non_negative_check"
    CHECK ("coinBalance" >= 0);

-- Hand-written: only a DEDUCTION may be reversed, and only a REFUND may reverse.
ALTER TABLE "CoinTransaction"
    ADD CONSTRAINT "CoinTransaction_reversal_is_refund_check"
    CHECK ("reversesId" IS NULL OR "type" = 'REFUND');

-- Hand-written: a package price is a positive integer in minor units. A zero or
-- negative price would mint free coins through the ordinary purchase path.
ALTER TABLE "CoinPackage"
    ADD CONSTRAINT "CoinPackage_amounts_check"
    CHECK ("priceMinor" > 0 AND "coinAmount" > 0 AND "bonusCoins" >= 0);

ALTER TABLE "PaymentOrder"
    ADD CONSTRAINT "PaymentOrder_amounts_check"
    CHECK ("fiatAmountMinor" > 0 AND "coinAmount" > 0 AND "bonusCoins" >= 0);
