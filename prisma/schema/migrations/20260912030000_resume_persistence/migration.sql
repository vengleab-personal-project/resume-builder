-- ---------------------------------------------------------------------------
-- Resume / evaluation persistence (Foundation slice A2).
--
-- Generated with `prisma migrate diff --from-migrations prisma/schema/migrations
-- --to-schema-datamodel prisma/schema --script`, then the partial unique index
-- at the bottom was hand-appended: Prisma's `@@unique` cannot express
-- "at most one row per user WHERE isDefault".
--
-- Verified by applying it to a throwaway postgres:16 container on top of the
-- migrations that preceded it.
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Resume',
    "data" JSONB NOT NULL,
    "sectionOrder" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "jobDescription" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "resumeSnapshot" JSONB,
    "modelId" TEXT,
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resume_userId_deletedAt_updatedAt_idx" ON "Resume"("userId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "EvaluationResult_userId_createdAt_idx" ON "EvaluationResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EvaluationResult_resumeId_createdAt_idx" ON "EvaluationResult"("resumeId", "createdAt");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hand-appended: a user must never end up with two default resumes, or the
-- sync hook's "load my default resume" read becomes non-deterministic.
CREATE UNIQUE INDEX "resume_single_default_per_user_idx"
    ON "Resume" ("userId")
    WHERE "isDefault" = true AND "deletedAt" IS NULL;
