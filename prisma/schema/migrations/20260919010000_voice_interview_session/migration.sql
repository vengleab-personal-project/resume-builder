-- ---------------------------------------------------------------------------
-- Voice interview sessions (Basic Resume, slice M5).
--
-- Purely additive: one new enum, one new table, no existing column or index
-- touched.
--
-- The partial unique index at the bottom is hand-appended, as in
-- 20260912030000_resume_persistence: Prisma's `@@unique` cannot express "at most
-- one row per user WHERE status = 'ACTIVE'". It is the thing that stops a user
-- who double-clicks Start, or reloads mid-interview, being charged twice for the
-- same CV -- the application checks for a live session first, but the index is
-- what makes that check safe under a race.
--
-- Verified by applying it to a throwaway postgres:16 instance on top of the
-- migrations that precede it.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "VoiceSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXHAUSTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "VoiceInterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "questionId" TEXT,
    "followUpUsed" BOOLEAN NOT NULL DEFAULT false,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "deductionTxId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceInterviewSession_userId_status_idx" ON "VoiceInterviewSession"("userId", "status");

-- CreateIndex
CREATE INDEX "VoiceInterviewSession_resumeId_idx" ON "VoiceInterviewSession"("resumeId");

-- AddForeignKey
ALTER TABLE "VoiceInterviewSession" ADD CONSTRAINT "VoiceInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceInterviewSession" ADD CONSTRAINT "VoiceInterviewSession_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-appended: one live interview per user. A second concurrent session would
-- mean a second VOICE_INTERVIEW debit for one CV.
CREATE UNIQUE INDEX "voice_session_single_active_per_user_idx"
    ON "VoiceInterviewSession" ("userId")
    WHERE "status" = 'ACTIVE';
