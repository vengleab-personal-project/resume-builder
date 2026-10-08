-- ---------------------------------------------------------------------------
-- Workstream B — chat model registry + coin-consumption config.
--
-- The DDL below was produced by `prisma migrate diff --from-migrations
-- prisma/schema/migrations --to-schema-datamodel prisma/schema --script`, then
-- the two partial unique indexes at the bottom were hand-appended: Prisma's
-- `@@unique` cannot express a `WHERE` clause, and without them pricing becomes
-- non-deterministic (two "default" models, or two inherited costs per action).
--
-- Verified by applying it on top of 20260912000000_init_auth in a throwaway
-- postgres:16 container: `prisma migrate deploy` succeeded, `prisma migrate
-- status` reported no pending migrations, `migrate diff` against the applied
-- database reported no drift, and both partial indexes correctly rejected a
-- second default row.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('GOOGLE', 'OPENAI');

-- CreateEnum
CREATE TYPE "AiAction" AS ENUM ('PARSE_RESUME', 'REFINE_RESUME', 'EVALUATE_RESUME');

-- CreateTable
CREATE TABLE "ChatModel" (
    "id" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "modelId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionCost" (
    "id" TEXT NOT NULL,
    "action" "AiAction" NOT NULL,
    "chatModelId" TEXT,
    "coinCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatModel_isActive_sortOrder_idx" ON "ChatModel"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ChatModel_provider_modelId_key" ON "ChatModel"("provider", "modelId");

-- CreateIndex
CREATE INDEX "ActionCost_action_idx" ON "ActionCost"("action");

-- CreateIndex
CREATE UNIQUE INDEX "ActionCost_action_chatModelId_key" ON "ActionCost"("action", "chatModelId");

-- AddForeignKey
ALTER TABLE "ActionCost" ADD CONSTRAINT "ActionCost_chatModelId_fkey" FOREIGN KEY ("chatModelId") REFERENCES "ChatModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written: exactly one model may be the default. `ActionCost_action_chatModelId_key`
-- above does NOT cover the inherited-default rows either, because Postgres treats
-- every NULL as distinct in a normal unique index.
CREATE UNIQUE INDEX "chat_models_single_default_idx" ON "ChatModel" ("isDefault") WHERE "isDefault" = true;

-- Hand-written: at most one inherited (model-agnostic) cost per action.
CREATE UNIQUE INDEX "action_costs_action_default_idx" ON "ActionCost" ("action") WHERE "chatModelId" IS NULL;
