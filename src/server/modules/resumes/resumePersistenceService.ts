import 'server-only';
import type { Prisma, ResumeKind } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import type { BasicResumeDTO, ResumeDTO, ResumeSummary } from '@/shared/types/persistence';
import type { ResumeData, ThemeConfig } from '@/shared/types';
import type { BasicResumeData } from '@/shared/types/basic-resume';

export const RESUME_SUMMARY_SELECT = {
  id: true,
  title: true,
  kind: true,
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
    kind: row.kind,
    isDefault: row.isDefault,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toResumeDTO(row: ResumeFullRow): ResumeDTO {
  return {
    ...toResumeSummary(row),
    // Cast, not parse: the column is opaque JSON and `kind` is what says which
    // shape is in it. A caller that did not pin the kind has no business here.
    data: row.data as unknown as ResumeData,
    sectionOrder: (row.sectionOrder ?? []) as unknown as string[],
    theme: row.theme as unknown as ThemeConfig,
  };
}

export function toBasicResumeDTO(row: ResumeFullRow): BasicResumeDTO {
  return {
    ...toResumeSummary(row),
    data: row.data as unknown as BasicResumeData,
    theme: row.theme as unknown as ThemeConfig,
  };
}

/**
 * Every read is kind-pinned. `kind` is required rather than optional-defaulting
 * because the failure it prevents is silent: a BASIC row handed to the full
 * editor does not throw at the boundary, it throws deep inside `ResumePreview`
 * on a field that does not exist. Making callers name the kind means a new call
 * site cannot forget it -- it will not compile.
 */
export async function findOwnedResume(
  userId: string,
  id: string,
  kind: ResumeKind
): Promise<ResumeDTO | null> {
  const row = await prisma.resume.findFirst({
    where: { id, userId, kind, deletedAt: null },
    select: RESUME_FULL_SELECT,
  });
  return row ? toResumeDTO(row) : null;
}

export async function findOwnedBasicResume(
  userId: string,
  id: string
): Promise<BasicResumeDTO | null> {
  const row = await prisma.resume.findFirst({
    where: { id, userId, kind: 'BASIC', deletedAt: null },
    select: RESUME_FULL_SELECT,
  });
  return row ? toBasicResumeDTO(row) : null;
}

/**
 * Kind-agnostic on purpose, and the only read that is. Soft-deleting a row does
 * not interpret its `data`, and the resume list screen manages both kinds, so
 * making the caller know the kind first would mean an extra round trip for no
 * safety gain.
 */
export async function findOwnedResumeKind(
  userId: string,
  id: string
): Promise<ResumeKind | null> {
  const row = await prisma.resume.findFirst({
    where: { id, userId, deletedAt: null },
    select: { kind: true },
  });
  return row?.kind ?? null;
}

export async function listOwnedResumes(
  userId: string,
  kind: ResumeKind
): Promise<ResumeSummary[]> {
  const rows = await prisma.resume.findMany({
    where: { userId, kind, deletedAt: null },
    select: RESUME_SUMMARY_SELECT,
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
  return rows.map(toResumeSummary);
}

export interface ResumeCreateInput {
  title: string;
  kind: ResumeKind;
  data: Prisma.InputJsonValue;
  sectionOrder: Prisma.InputJsonValue;
  theme: Prisma.InputJsonValue;
  isDefault?: boolean;
}

/**
 * Creates a resume of either kind, demoting the previous default of *that kind*
 * in the same transaction when this one is being promoted.
 *
 * Shared by both product lines because the default-promotion race is identical
 * for both and a second copy of it would be a second place to get it wrong.
 */
export async function createResume(
  userId: string,
  input: ResumeCreateInput
): Promise<ResumeFullRow> {
  const { title, kind, data, sectionOrder, theme, isDefault } = input;

  // The first resume of a kind a user ever creates is that kind's default, so
  // the sync hook always has something to hydrate from without a separate
  // "set default" call.
  const existingCount = await prisma.resume.count({
    where: { userId, kind, deletedAt: null },
  });
  const shouldBeDefault = isDefault ?? existingCount === 0;

  return prisma.$transaction(async (tx) => {
    // A partial unique index enforces one default per user per kind, so the
    // previous default has to be demoted in the same transaction as the
    // promotion.
    if (shouldBeDefault && existingCount > 0) {
      await tx.resume.updateMany({
        where: { userId, kind, deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.resume.create({
      data: { userId, title, kind, data, sectionOrder, theme, isDefault: shouldBeDefault },
      select: RESUME_FULL_SELECT,
    });
  });
}

export interface ResumePatch {
  title?: string;
  data?: Prisma.InputJsonValue;
  sectionOrder?: Prisma.InputJsonValue;
  theme?: Prisma.InputJsonValue;
  isDefault?: boolean;
}

export type ResumeUpdateOutcome =
  | { status: 'updated'; resume: ResumeDTO }
  | { status: 'conflict'; resume: ResumeDTO }
  | { status: 'not-found' };

export type BasicResumeUpdateOutcome =
  | { status: 'updated'; resume: BasicResumeDTO }
  | { status: 'conflict'; resume: BasicResumeDTO }
  | { status: 'not-found' };

// Optimistic concurrency: the `version` in the WHERE clause is the compare, the
// `increment` is the swap. updateMany (not update) is what makes this a single
// atomic statement -- a read-then-write would let two tabs interleave and the
// later write would silently discard the earlier one.
//
// `kind` joins the WHERE clause as a guard, not a filter: a PATCH aimed at the
// wrong product line has to read as "no such resume", never as a write that
// lands and corrupts the other kind's JSON.
async function runVersionedUpdate(
  userId: string,
  id: string,
  kind: ResumeKind,
  expectedVersion: number,
  patch: ResumePatch
): Promise<number> {
  const { isDefault, ...rest } = patch;

  return prisma.$transaction(async (tx) => {
    // Promoting to default has to demote the previous one in the same
    // transaction as the version-checked update, same as resume creation --
    // otherwise two defaults could briefly (or, on a race, permanently) exist.
    // Scoped by kind, matching the partial unique index: each product line has
    // its own default, so making a basic CV the default must not leave the full
    // editor with nothing to hydrate from.
    if (isDefault) {
      await tx.resume.updateMany({
        where: { userId, kind, deletedAt: null, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const result = await tx.resume.updateMany({
      where: { id, userId, kind, deletedAt: null, version: expectedVersion },
      data: { ...rest, ...(isDefault !== undefined ? { isDefault } : {}), version: { increment: 1 } },
    });
    return result.count;
  });
}

export async function updateResumeWithVersionCheck(
  userId: string,
  id: string,
  expectedVersion: number,
  patch: ResumePatch
): Promise<ResumeUpdateOutcome> {
  const count = await runVersionedUpdate(userId, id, 'FULL', expectedVersion, patch);

  const current = await findOwnedResume(userId, id, 'FULL');
  if (!current) return { status: 'not-found' };

  return count === 1 ? { status: 'updated', resume: current } : { status: 'conflict', resume: current };
}

export async function updateBasicResumeWithVersionCheck(
  userId: string,
  id: string,
  expectedVersion: number,
  patch: ResumePatch
): Promise<BasicResumeUpdateOutcome> {
  const count = await runVersionedUpdate(userId, id, 'BASIC', expectedVersion, patch);

  const current = await findOwnedBasicResume(userId, id);
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
