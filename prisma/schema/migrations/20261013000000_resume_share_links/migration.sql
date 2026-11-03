-- ---------------------------------------------------------------------------
-- Public share links to a resume (/s/<code>).
--
-- Purely additive: two enums and one table, no existing column or index touched.
--
-- The foreign keys cascade, but resumes are soft-deleted, so deleting a resume in
-- the app does NOT remove its links: the public read path filters on the resume
-- being live (deletedAt IS NULL) instead. The unique index on "code" is what makes a
-- URL resolve to exactly one link.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "ShareAccess" AS ENUM ('CODE', 'PASSCODE');

-- CreateEnum
CREATE TYPE "ShareContent" AS ENUM ('LIVE', 'SNAPSHOT');

-- CreateTable
CREATE TABLE "ResumeShareLink" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "access" "ShareAccess" NOT NULL,
    "passcodeHash" TEXT,
    "passcodeVersion" INTEGER NOT NULL DEFAULT 1,
    "content" "ShareContent" NOT NULL,
    "snapshotData" JSONB,
    "snapshotSectionOrder" JSONB,
    "snapshotTheme" JSONB,
    "snapshotAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeShareLink_code_key" ON "ResumeShareLink"("code");

-- CreateIndex
CREATE INDEX "ResumeShareLink_resumeId_idx" ON "ResumeShareLink"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeShareLink_userId_idx" ON "ResumeShareLink"("userId");

-- AddForeignKey
ALTER TABLE "ResumeShareLink" ADD CONSTRAINT "ResumeShareLink_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeShareLink" ADD CONSTRAINT "ResumeShareLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
