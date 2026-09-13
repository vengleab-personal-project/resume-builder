import 'server-only';
import { prisma } from '@/server/db/prisma';
import {
  RESERVED_USERNAMES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@/shared/config/auth';
import type { PublicUser } from '@/shared/types/auth';
import { PUBLIC_USER_SELECT, toPublicUser } from './getCurrentUser';
import { HttpError } from '@/server/errors';
import type { VerifiedTelegramUser } from './telegram';

// Telegram usernames allow characters our username rule forbids, so the handle
// is normalised rather than rejected — a Telegram user must always get an
// account, even if their handle can't be used verbatim.
function deriveBaseUsername(telegram: VerifiedTelegramUser): string {
  const candidate = (telegram.telegramUsername ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^[^a-z]+/, '');

  if (
    candidate.length >= USERNAME_MIN_LENGTH &&
    !RESERVED_USERNAMES.includes(candidate)
  ) {
    return candidate.slice(0, USERNAME_MAX_LENGTH);
  }

  return `tg${telegram.telegramId}`.slice(0, USERNAME_MAX_LENGTH);
}

function withSuffix(base: string, suffix: string): string {
  return `${base.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`;
}

const PRISMA_UNIQUE_VIOLATION = 'P2002';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION
  );
}

export { isUniqueViolation, PRISMA_UNIQUE_VIOLATION };

export interface TelegramLoginResult {
  user: PublicUser;
  tokenVersion: number;
  created: boolean;
}

// Known telegramId logs in; unknown telegramId creates a fresh account. Matching
// on username similarity is deliberately NOT done — it would let anyone who
// registers a Telegram handle take over the password account of the same name.
export async function loginOrCreateTelegramUser(
  telegram: VerifiedTelegramUser
): Promise<TelegramLoginResult> {
  const existing = await prisma.user.findUnique({
    where: { telegramId: telegram.telegramId },
    select: PUBLIC_USER_SELECT,
  });

  if (existing) {
    if (existing.disabledAt) {
      throw new HttpError(403, 'ACCOUNT_DISABLED', 'This account has been disabled');
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        telegramUsername: telegram.telegramUsername,
        telegramPhotoUrl: telegram.telegramPhotoUrl,
        firstName: telegram.firstName ?? existing.firstName,
        lastName: telegram.lastName ?? existing.lastName,
        lastLoginAt: new Date(),
      },
      select: PUBLIC_USER_SELECT,
    });

    return { user: toPublicUser(updated), tokenVersion: updated.tokenVersion, created: false };
  }

  const base = deriveBaseUsername(telegram);
  const displayName =
    [telegram.firstName, telegram.lastName].filter(Boolean).join(' ').trim() || null;

  // Uniqueness is enforced by the DB, not by a pre-check, so two concurrent
  // first-logins can't both pass a "is this name free?" query and then collide.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const username =
      attempt === 0
        ? base
        : withSuffix(base, String(Math.floor(1000 + Math.random() * 9000)));

    try {
      const created = await prisma.user.create({
        data: {
          username,
          telegramId: telegram.telegramId,
          telegramUsername: telegram.telegramUsername,
          telegramPhotoUrl: telegram.telegramPhotoUrl,
          firstName: telegram.firstName,
          lastName: telegram.lastName,
          displayName,
          lastLoginAt: new Date(),
        },
        select: PUBLIC_USER_SELECT,
      });

      return { user: toPublicUser(created), tokenVersion: created.tokenVersion, created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      // A racing request may have created the row for this same telegramId.
      const raced = await prisma.user.findUnique({
        where: { telegramId: telegram.telegramId },
        select: PUBLIC_USER_SELECT,
      });
      if (raced) {
        return { user: toPublicUser(raced), tokenVersion: raced.tokenVersion, created: false };
      }
    }
  }

  throw new Error('Could not allocate a unique username for the Telegram account');
}
