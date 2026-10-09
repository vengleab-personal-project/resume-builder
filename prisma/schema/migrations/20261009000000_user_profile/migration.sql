-- ---------------------------------------------------------------------------
-- User profile: the identity details (name, title, contact, photo) that every
-- resume repeats, kept once per user and synchronised with the default FULL
-- resume's personalInfo by profileService.
--
-- Purely additive: one new table, no existing column or index touched. There is
-- no backfill -- a profile row is created lazily on first read, seeded from the
-- user's default resume (or their display name), so existing users need nothing.
--
-- "At most one profile per user" is the primary key itself, so unlike the
-- default-resume and voice-session rules no hand-appended partial index is needed.
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "linkedin" TEXT,
    "website" TEXT,
    "photoUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
