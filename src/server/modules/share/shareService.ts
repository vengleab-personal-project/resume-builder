import 'server-only';
import { Prisma, type ResumeShareLink } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import { HttpError } from '@/server/errors';
import { hashPassword } from '@/server/modules/auth/password';
import { SHARE_LINKS_PER_RESUME_MAX } from '@/shared/config/share';
import type {
  CreateShareLinkInput,
  UpdateShareLinkInput,
} from '@/shared/lib/validation/shareSchemas';
import type { ShareLinkDTO } from '@/shared/types/persistence';
import type { SupportedLocale } from '@/shared/types';
import { generateShareCode } from './shareCodes';

/**
 * Owner-side share links. Every function is scoped by `userId`, and a link is only
 * ever reached through a FULL, non-deleted resume the user owns - the same rule
 * findOwnedResume applies - so one user can never list, change or delete another's.
 */

export function toShareLinkDTO(row: ResumeShareLink): ShareLinkDTO {
  return {
    id: row.id,
    resumeId: row.resumeId,
    code: row.code,
    label: row.label,
    access: row.access,
    content: row.content,
    locale: (row.locale === 'km' ? 'km' : 'en') as SupportedLocale,
    isActive: row.isActive,
    viewCount: row.viewCount,
    lastViewedAt: row.lastViewedAt?.toISOString() ?? null,
    snapshotAt: row.snapshotAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const ownedResumeWhere = (userId: string, resumeId: string) => ({
  id: resumeId,
  userId,
  kind: 'FULL' as const,
  deletedAt: null,
});

async function requireOwnedResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({
    where: ownedResumeWhere(userId, resumeId),
    select: { id: true, data: true, sectionOrder: true, theme: true },
  });
  if (!resume) throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  return resume;
}

async function requireOwnedLink(userId: string, linkId: string) {
  const link = await prisma.resumeShareLink.findFirst({
    where: { id: linkId, userId, resume: { userId, kind: 'FULL', deletedAt: null } },
  });
  if (!link) throw new HttpError(404, 'NOT_FOUND', 'Share link not found');
  return link;
}

export async function listShareLinks(userId: string, resumeId: string): Promise<ShareLinkDTO[]> {
  await requireOwnedResume(userId, resumeId);
  const rows = await prisma.resumeShareLink.findMany({
    where: { resumeId, userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toShareLinkDTO);
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export async function createShareLink(
  userId: string,
  resumeId: string,
  input: CreateShareLinkInput
): Promise<ShareLinkDTO> {
  const resume = await requireOwnedResume(userId, resumeId);

  const existing = await prisma.resumeShareLink.count({ where: { resumeId, userId } });
  if (existing >= SHARE_LINKS_PER_RESUME_MAX) {
    throw new HttpError(409, 'LIMIT_REACHED', 'Too many share links for this resume');
  }

  const passcodeHash =
    input.access === 'PASSCODE' && input.passcode ? await hashPassword(input.passcode) : null;
  const snapshot =
    input.content === 'SNAPSHOT'
      ? {
          snapshotData: resume.data as Prisma.InputJsonValue,
          snapshotSectionOrder: resume.sectionOrder as Prisma.InputJsonValue,
          snapshotTheme: resume.theme as Prisma.InputJsonValue,
          snapshotAt: new Date(),
        }
      : {};

  // A collision is astronomically unlikely for CODE links and merely unlikely for the
  // shorter PASSCODE codes; a few retries make it a non-event either way.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const row = await prisma.resumeShareLink.create({
        data: {
          resumeId,
          userId,
          code: generateShareCode(input.access),
          label: input.label,
          access: input.access,
          passcodeHash,
          content: input.content,
          locale: input.locale,
          ...snapshot,
        },
      });
      return toShareLinkDTO(row);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new HttpError(503, 'INTERNAL_ERROR', 'Could not allocate a share code');
}

export async function updateShareLink(
  userId: string,
  linkId: string,
  input: UpdateShareLinkInput
): Promise<ShareLinkDTO> {
  const link = await requireOwnedLink(userId, linkId);
  const data: Prisma.ResumeShareLinkUpdateInput = {};

  if (input.label !== undefined) data.label = input.label;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  if (input.passcode !== undefined) {
    if (link.access !== 'PASSCODE') {
      throw new HttpError(400, 'INVALID_INPUT', 'This link has no passcode');
    }
    data.passcodeHash = await hashPassword(input.passcode);
    // Everyone who unlocked with the old passcode has to enter the new one.
    data.passcodeVersion = { increment: 1 };
  }

  if (input.refreshSnapshot) {
    if (link.content !== 'SNAPSHOT') {
      throw new HttpError(400, 'INVALID_INPUT', 'This link shows the live resume');
    }
    const resume = await requireOwnedResume(userId, link.resumeId);
    data.snapshotData = resume.data as Prisma.InputJsonValue;
    data.snapshotSectionOrder = resume.sectionOrder as Prisma.InputJsonValue;
    data.snapshotTheme = resume.theme as Prisma.InputJsonValue;
    data.snapshotAt = new Date();
  }

  const row = await prisma.resumeShareLink.update({ where: { id: link.id }, data });
  return toShareLinkDTO(row);
}

export async function deleteShareLink(userId: string, linkId: string): Promise<void> {
  const link = await requireOwnedLink(userId, linkId);
  await prisma.resumeShareLink.delete({ where: { id: link.id } });
}
