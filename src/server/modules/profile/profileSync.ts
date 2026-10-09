import 'server-only';
import type { Prisma } from '@/server/db/generated/prisma';
import {
  changedFields,
  identityFromPersonalInfo,
  PROFILE_FIELDS,
  type ProfileFields,
} from '@/shared/lib/profile';
import type { ProfileDTO } from '@/shared/types/persistence';

/**
 * The profile side of the profile <-> default-resume sync, in its own file so
 * `resumePersistenceService` can call it from inside its transactions without an
 * import cycle (`profileService` needs the resume service, not the other way round).
 */

type Tx = Prisma.TransactionClient;

export const PROFILE_SELECT = {
  userId: true,
  fullName: true,
  title: true,
  email: true,
  phone: true,
  address: true,
  linkedin: true,
  website: true,
  photoUrl: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ProfileRow = Prisma.UserProfileGetPayload<{ select: typeof PROFILE_SELECT }>;

/** Rows hold NULL for unset; everything above the database sees '' (see shared/lib/profile). */
export const profileFieldsFromRow = (row: ProfileRow): ProfileFields => ({
  fullName: row.fullName ?? '',
  title: row.title ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  address: row.address ?? '',
  linkedin: row.linkedin ?? '',
  website: row.website ?? '',
  photoUrl: row.photoUrl ?? '',
});

export const toProfileDTO = (row: ProfileRow): ProfileDTO => ({
  ...profileFieldsFromRow(row),
  version: row.version,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** '' -> NULL for the columns a partial write touches. */
export const profileColumns = (fields: Partial<ProfileFields>) => {
  const data: Partial<Record<keyof ProfileFields, string | null>> = {};
  for (const field of PROFILE_FIELDS) {
    const value = fields[field];
    if (value !== undefined) data[field] = value === '' ? null : value;
  }
  return data;
};

/**
 * Resume -> profile. Called inside the transaction of every write that makes (or
 * keeps) a FULL resume the default, with that resume's `personalInfo`.
 *
 * - Only an existing profile is updated. A user who never opened their profile has no
 *   row, and `getOrCreateProfile` seeds one from the default resume on first read, so
 *   creating it here would add a write to every autosave for nothing.
 * - Only fields carrying a real value are copied (`identityFromPersonalInfo`), so a
 *   placeholder or a blanked field can never erase the profile.
 * - Nothing is written when nothing changed, so a typing session that only touches
 *   experience does not churn the profile's version.
 */
export async function syncProfileFromResume(
  tx: Tx,
  userId: string,
  personalInfo: unknown
): Promise<void> {
  const row = await tx.userProfile.findUnique({ where: { userId }, select: PROFILE_SELECT });
  if (!row) return;

  const changes = changedFields(
    profileFieldsFromRow(row),
    identityFromPersonalInfo(personalInfo as Parameters<typeof identityFromPersonalInfo>[0])
  );
  if (!Object.keys(changes).length) return;

  await tx.userProfile.update({
    where: { userId },
    data: { ...profileColumns(changes), version: { increment: 1 } },
  });
}
