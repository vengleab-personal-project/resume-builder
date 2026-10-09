import 'server-only';
import type { Prisma } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import { HttpError } from '@/server/errors';
import {
  RESUME_FULL_SELECT,
  toResumeDTO,
} from '@/server/modules/resumes/resumePersistenceService';
import {
  emptyProfileFields,
  identityFromPersonalInfo,
  mergeProfileIntoPersonalInfo,
  type ProfileFields,
} from '@/shared/lib/profile';
import type { ResumeData } from '@/shared/types';
import type { ProfileDTO, ResumeDTO } from '@/shared/types/persistence';
import { PROFILE_SELECT, profileColumns, profileFieldsFromRow, toProfileDTO } from './profileSync';

/**
 * The profile <-> default-resume sync. This file is the profile -> resume direction
 * and the lazy creation; the resume -> profile direction runs inside the resume write
 * transactions (`syncProfileFromResume`, called from resumePersistenceService), so a
 * resume save and the profile change it implies commit or fail together.
 *
 * Only the user's default FULL resume takes part. Other resumes are copies the user
 * tailors independently, and BASIC resumes have a different `data` shape altogether.
 */

const findDefaultFullResume = (tx: Prisma.TransactionClient | typeof prisma, userId: string) =>
  tx.resume.findFirst({
    where: { userId, kind: 'FULL', isDefault: true, deletedAt: null },
    select: RESUME_FULL_SELECT,
  });

/**
 * The user's profile, created on first read. It starts from what the default resume
 * already says (so an existing user's profile is their current details, not a blank
 * form), falling back to the name they signed up with.
 */
export async function getOrCreateProfile(userId: string): Promise<ProfileDTO> {
  const existing = await prisma.userProfile.findUnique({ where: { userId }, select: PROFILE_SELECT });
  if (existing) return toProfileDTO(existing);

  const [resume, user] = await Promise.all([
    findDefaultFullResume(prisma, userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, firstName: true, lastName: true },
    }),
  ]);

  const seed: Partial<ProfileFields> = identityFromPersonalInfo(
    (resume?.data as unknown as ResumeData | undefined)?.personalInfo
  );
  if (!seed.fullName) {
    const name =
      user?.displayName?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    if (name) seed.fullName = name;
  }

  // upsert, not create: two tabs opening the profile for the first time must both
  // succeed rather than one of them tripping the primary key.
  const row = await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...profileColumns({ ...emptyProfileFields(), ...seed }) },
    update: {},
    select: PROFILE_SELECT,
  });
  return toProfileDTO(row);
}

export type ProfileUpdateOutcome =
  | { status: 'updated'; profile: ProfileDTO; resume: ResumeDTO | null }
  | { status: 'conflict'; profile: ProfileDTO };

/** Retries when an autosave commits between our read of the resume and our write. */
const RESUME_WRITE_ATTEMPTS = 3;

/**
 * Profile -> default resume. In one transaction: compare-and-swap the profile on
 * `version`, then merge the same fields into the default resume's `personalInfo`.
 *
 * The resume write is itself version-guarded and retried: it must not overwrite an
 * autosave that landed since the resume was read, because only `personalInfo` is ours
 * to change and the rest of `data` is whatever the user typed last.
 */
export async function updateProfile(
  userId: string,
  expectedVersion: number,
  patch: Partial<ProfileFields>
): Promise<ProfileUpdateOutcome> {
  // Ensures the row (and its seed from the resume) exists before the version check.
  await getOrCreateProfile(userId);

  const outcome = await prisma.$transaction(async (tx) => {
    const swapped = await tx.userProfile.updateMany({
      where: { userId, version: expectedVersion },
      data: { ...profileColumns(patch), version: { increment: 1 } },
    });
    if (swapped.count !== 1) return { applied: false as const, resume: null };
    const saved = profileFieldsFromRow(
      await tx.userProfile.findUniqueOrThrow({ where: { userId }, select: PROFILE_SELECT })
    );

    for (let attempt = 0; attempt < RESUME_WRITE_ATTEMPTS; attempt += 1) {
      const current = await findDefaultFullResume(tx, userId);
      if (!current) return { applied: true as const, resume: null };

      const data = current.data as unknown as ResumeData;
      const merged = {
        ...data,
        personalInfo: mergeProfileIntoPersonalInfo(
          data.personalInfo ?? ({} as ResumeData['personalInfo']),
          saved,
          patch
        ),
      };

      const written = await tx.resume.updateMany({
        where: { id: current.id, userId, kind: 'FULL', deletedAt: null, version: current.version },
        data: { data: merged as unknown as Prisma.InputJsonValue, version: { increment: 1 } },
      });
      if (written.count === 1) {
        const fresh = await tx.resume.findUniqueOrThrow({
          where: { id: current.id },
          select: RESUME_FULL_SELECT,
        });
        return { applied: true as const, resume: toResumeDTO(fresh) };
      }
    }
    // Rolls the profile write back too: better a failed save the user can retry than a
    // profile that says one thing while the resume still says another.
    throw new HttpError(409, 'INTERNAL_ERROR', 'Default resume is changing; try again');
  });

  const row = await prisma.userProfile.findUniqueOrThrow({ where: { userId }, select: PROFILE_SELECT });
  const profile = toProfileDTO(row);
  return outcome.applied
    ? { status: 'updated', profile, resume: outcome.resume }
    : { status: 'conflict', profile };
}
