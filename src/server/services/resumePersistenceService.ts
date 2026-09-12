import 'server-only';
import type { Prisma } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import type { ResumeDTO, ResumeSummary } from '@/shared/types/persistence';
import type { ResumeData, ThemeConfig } from '@/shared/types';

export const RESUME_SUMMARY_SELECT = {
  id: true,
  title: true,
  isDefault: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const RESUME_FULL_SELECT = {
  ...RESUME_SUMMARY_SELECT,
  data: true,
  sectionOrder: true,
  theme: true,
} as const;

type ResumeSummaryRow = Prisma.ResumeGetPayload<{ select: typeof RESUME_SUMMARY_SELECT }>;
type ResumeFullRow = Prisma.ResumeGetPayload<{ select: typeof RESUME_FULL_SELECT }>;

export function toResumeSummary(row: ResumeSummaryRow): ResumeSummary {
  return {
    id: row.id,
    title: row.title,
    isDefault: row.isDefault,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toResumeDTO(row: ResumeFullRow): ResumeDTO {
  return {
    ...toResumeSummary(row),
    data: row.data as unknown as ResumeData,
    sectionOrder: (row.sectionOrder ?? []) as unknown as string[],
    theme: row.theme as unknown as ThemeConfig,
  };
}

export async function findOwnedResume(userId: string, id: string): Promise<ResumeDTO | null> {
  const row = await prisma.resume.findFirst({
    where: { id, userId, deletedAt: null },
    select: RESUME_FULL_SELECT,
  });
  return row ? toResumeDTO(row) : null;
}

export interface ResumePatch {
  title?: string;
  data?: Prisma.InputJsonValue;
  sectionOrder?: Prisma.InputJsonValue;
  theme?: Prisma.InputJsonValue;
}

export type ResumeUpdateOutcome =
  | { status: 'updated'; resume: ResumeDTO }
  | { status: 'conflict'; resume: ResumeDTO }
  | { status: 'not-found' };

// Optimistic concurrency: the `version` in the WHERE clause is the compare, the
// `increment` is the swap. updateMany (not update) is what makes this a single
// atomic statement -- a read-then-write would let two tabs interleave and the
// later write would silently discard the earlier one.
export async function updateResumeWithVersionCheck(
  userId: string,
  id: string,
  expectedVersion: number,
  patch: ResumePatch
): Promise<ResumeUpdateOutcome> {
  const { count } = await prisma.resume.updateMany({
    where: { id, userId, deletedAt: null, version: expectedVersion },
    data: { ...patch, version: { increment: 1 } },
  });

  const current = await findOwnedResume(userId, id);
  if (!current) return { status: 'not-found' };

  return count === 1 ? { status: 'updated', resume: current } : { status: 'conflict', resume: current };
}

export async function softDeleteResume(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.resume.updateMany({
    where: { id, userId, deletedAt: null },
    // isDefault is cleared alongside the tombstone so the partial unique index
    // does not block the user from making another resume their default.
    data: { deletedAt: new Date(), isDefault: false },
  });
  return count === 1;
}
