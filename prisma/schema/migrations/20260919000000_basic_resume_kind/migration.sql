-- ---------------------------------------------------------------------------
-- Basic Resume, slice M1: the resume-kind split.
--
-- Additive only. No existing column changes type or nullability; `kind` lands
-- with a DEFAULT so every row already in the table back-fills to FULL in the
-- same statement, and every query written before BASIC existed keeps meaning
-- exactly what it meant.
--
-- The `resume_single_default_per_user_idx` partial unique index is dropped and
-- re-created scoped by kind. It is the one non-additive step here and it is
-- deliberate: "my default resume" has to mean one thing per product line, or a
-- user who makes their basic CV the default silently leaves the full editor
-- with no default to hydrate from. Prisma's `@@unique` cannot express a partial
-- index, so this stays hand-written, as it was when it was first added.
--
-- Verified by applying it to a throwaway postgres:16 instance on top of the
-- migrations that precede it, with a pre-existing Resume row present to confirm
-- the back-fill.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "ResumeKind" AS ENUM ('FULL', 'BASIC');

-- AlterEnum
-- Prisma wraps a migration file in a transaction, and Postgres forbids *using* a
-- value added to an enum in the same transaction that added it. Nothing here
-- inserts a VOICE_INTERVIEW row, so this is safe; the seed does that afterwards,
-- in its own connection.
ALTER TYPE "AiAction" ADD VALUE 'VOICE_INTERVIEW';

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "kind" "ResumeKind" NOT NULL DEFAULT 'FULL';

-- CreateIndex
CREATE INDEX "Resume_userId_kind_deletedAt_updatedAt_idx" ON "Resume"("userId", "kind", "deletedAt", "updatedAt");

-- Hand-appended: one default per user *per kind*. Replaces the unscoped index
-- from 20260912030000_resume_persistence.
DROP INDEX IF EXISTS "resume_single_default_per_user_idx";

CREATE UNIQUE INDEX "resume_single_default_per_user_kind_idx"
    ON "Resume" ("userId", "kind")
    WHERE "isDefault" = true AND "deletedAt" IS NULL;
