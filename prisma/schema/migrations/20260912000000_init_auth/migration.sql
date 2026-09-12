-- ---------------------------------------------------------------------------
-- Authored without the project's own database.
--
-- The DDL below was produced by `prisma migrate diff --from-empty
-- --to-schema-datamodel prisma/schema --script`, then the `CHECK` constraint at
-- the bottom was hand-appended -- Prisma's schema language cannot express
-- "at least one credential must be present".
--
-- It was verified by applying it to a throwaway postgres:16 container:
-- `prisma migrate deploy` succeeded, `prisma migrate status` reported no
-- pending migrations, `migrate diff` against the applied database reported no
-- drift from the datamodel, and the CHECK constraint correctly rejected an
-- insert with neither a passwordHash nor a telegramId.
--
-- It has NOT been applied to the real (not-yet-provisioned) project database.
-- ---------------------------------------------------------------------------

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "telegramId" TEXT,
    "telegramUsername" TEXT,
    "telegramPhotoUrl" TEXT,
    "displayName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "preferredAiProvider" TEXT,
    "preferredAiModel" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "lastLoginAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "ipHash" TEXT,
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_identifier_createdAt_idx" ON "AuthAttempt"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_ipHash_createdAt_idx" ON "AuthAttempt"("ipHash", "createdAt");

-- Hand-written: Prisma cannot express "at least one credential". Without this a
-- bad unlink or a partial signup could leave an account nobody can ever sign into.
ALTER TABLE "User"
    ADD CONSTRAINT "User_has_credential_check"
    CHECK ("passwordHash" IS NOT NULL OR "telegramId" IS NOT NULL);
