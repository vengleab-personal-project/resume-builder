import 'server-only';
import { prisma } from '@/server/db/prisma';
import { recordAuthAttempt } from '@/server/modules/auth/rateLimit';
import { verifyShareUnlock } from '@/server/modules/auth/session';
import { HttpError } from '@/server/errors';
import {
  SHARE_ATTEMPT_PREFIX,
  SHARE_UNKNOWN_ATTEMPT,
  SHARE_UNLOCK_MAX_FAILURES_PER_IP,
  SHARE_UNLOCK_MAX_FAILURES_PER_IP_ANY_LINK,
  SHARE_UNLOCK_MAX_FAILURES_PER_LINK,
  SHARE_UNLOCK_WINDOW_MS,
} from '@/shared/config/share';
import type { ResumeData, SupportedLocale, ThemeConfig } from '@/shared/types';
import type { SharedResumeContent } from '@/shared/types/persistence';
import { isWellFormedShareCode } from './shareCodes';

/**
 * The viewer side of share links: the only code that reads a resume without a
 * signed-in owner. Everything it can return is decided by `resolveShareLink`, so the
 * rules for "this link works" live in exactly one WHERE clause:
 *
 * - the link is active,
 * - its resume is FULL and not soft-deleted (a delete does not cascade to links),
 * - the owner's account is not disabled.
 *
 * A link that fails any of them is indistinguishable from one that never existed.
 */

const RESOLVE_SELECT = {
  id: true,
  access: true,
  passcodeHash: true,
  passcodeVersion: true,
  content: true,
  snapshotData: true,
  snapshotSectionOrder: true,
  snapshotTheme: true,
  locale: true,
  resume: { select: { data: true, sectionOrder: true, theme: true } },
} as const;

/** The one definition of a link that works (see the comment at the top). */
const liveLinkWhere = (code: string) => ({
  code,
  isActive: true,
  resume: { kind: 'FULL' as const, deletedAt: null, user: { disabledAt: null } },
});

export async function resolveShareLink(code: string) {
  if (!isWellFormedShareCode(code)) return null;
  return prisma.resumeShareLink.findFirst({ where: liveLinkWhere(code), select: RESOLVE_SELECT });
}

export type ResolvedShareLink = NonNullable<Awaited<ReturnType<typeof resolveShareLink>>>;

export function readSharedResume(link: ResolvedShareLink): SharedResumeContent {
  const frozen = link.content === 'SNAPSHOT' && link.snapshotData;
  return {
    data: (frozen ? link.snapshotData : link.resume.data) as unknown as ResumeData,
    sectionOrder: ((frozen ? link.snapshotSectionOrder : link.resume.sectionOrder) ?? []) as unknown as string[],
    theme: (frozen ? link.snapshotTheme : link.resume.theme) as unknown as ThemeConfig,
    locale: (link.locale === 'km' ? 'km' : 'en') as SupportedLocale,
  };
}

/** Best effort: a failed counter write must never stop someone reading the CV. */
export async function recordShareView(linkId: string): Promise<void> {
  try {
    await prisma.resumeShareLink.update({
      where: { id: linkId },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to record share view:', error);
  }
}

const attemptIdentifier = (linkId: string) => `${SHARE_ATTEMPT_PREFIX}${linkId}`;

/**
 * Wrong-passcode throttling, on the login limiter's table. Two limits: one visitor
 * guessing (per IP per link), and many IPs guessing one link's passcode together.
 */
export async function assertUnlockAllowed(linkId: string, ipHash: string | null): Promise<void> {
  const since = new Date(Date.now() - SHARE_UNLOCK_WINDOW_MS);
  const identifier = attemptIdentifier(linkId);
  try {
    const [perLink, perIp] = await Promise.all([
      prisma.authAttempt.count({ where: { identifier, successful: false, createdAt: { gte: since } } }),
      ipHash
        ? prisma.authAttempt.count({
            where: { identifier, ipHash, successful: false, createdAt: { gte: since } },
          })
        : Promise.resolve(0),
    ]);
    if (perLink >= SHARE_UNLOCK_MAX_FAILURES_PER_LINK || perIp >= SHARE_UNLOCK_MAX_FAILURES_PER_IP) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    // Fail open, as the login limiter does: a Postgres blip must not lock out viewers.
    console.error('Share unlock rate limit check failed, allowing request:', error);
  }
}

/**
 * One visitor's wrong guesses across every link, checked before any password hashing so
 * that probing for codes (or hammering a link) cannot be used to burn CPU for free.
 */
export async function assertUnlockProbeAllowed(ipHash: string | null): Promise<void> {
  if (!ipHash) return;
  try {
    const failures = await prisma.authAttempt.count({
      where: {
        ipHash,
        successful: false,
        identifier: { startsWith: SHARE_ATTEMPT_PREFIX },
        createdAt: { gte: new Date(Date.now() - SHARE_UNLOCK_WINDOW_MS) },
      },
    });
    if (failures >= SHARE_UNLOCK_MAX_FAILURES_PER_IP_ANY_LINK) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Share probe rate limit check failed, allowing request:', error);
  }
}

/** An unlock attempt on a code that is not a live passcode link: counts as a failure. */
export const recordUnknownUnlockAttempt = (ipHash: string | null) =>
  recordAuthAttempt(SHARE_UNKNOWN_ATTEMPT, ipHash, false);

export const recordUnlockAttempt = (linkId: string, ipHash: string | null, successful: boolean) =>
  recordAuthAttempt(attemptIdentifier(linkId), ipHash, successful);

/** Whether an unlock cookie opens this link: the right link, and the current passcode. */
export async function isUnlocked(
  link: Pick<ResolvedShareLink, 'id' | 'access' | 'passcodeVersion'>,
  token: string | undefined
): Promise<boolean> {
  if (link.access !== 'PASSCODE') return true;
  const claims = await verifyShareUnlock(token);
  return Boolean(claims && claims.linkId === link.id && claims.passcodeVersion === link.passcodeVersion);
}

/**
 * What the viewer page needs before any content is fetched: whether the link works at
 * all, and whether it has to ask for the passcode first. Never the CV itself.
 */
export async function getShareViewerState(
  code: string,
  unlockToken: string | undefined
): Promise<{ needsPasscode: boolean } | null> {
  // Its own minimal select, not resolveShareLink: the page must not even load the CV or
  // the passcode hash. (Next's dev server embeds server-side query results in the HTML
  // for its debugging tools - with the full select, the CV was in the page source.)
  if (!isWellFormedShareCode(code)) return null;
  const link = await prisma.resumeShareLink.findFirst({
    where: liveLinkWhere(code),
    select: { id: true, access: true, passcodeVersion: true },
  });
  if (!link) return null;
  return { needsPasscode: !(await isUnlocked(link, unlockToken)) };
}
