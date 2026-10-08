import 'server-only';
import { cache } from 'react';
import { prisma } from '@/server/db/prisma';
import type { PublicUser, Role } from '@/shared/types/auth';
import { readSessionToken } from './cookies';
import { verifySession } from './session';

type UserRecord = {
  id: string;
  username: string;
  role: Role;
  passwordHash: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramPhotoUrl: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredAiProvider: string | null;
  preferredAiModel: string | null;
  locale: string;
  tokenVersion: number;
  disabledAt: Date | null;
  createdAt: Date;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    telegramUsername: user.telegramUsername,
    telegramPhotoUrl: user.telegramPhotoUrl,
    hasPassword: user.passwordHash !== null,
    hasTelegram: user.telegramId !== null,
    preferredAiProvider: user.preferredAiProvider,
    preferredAiModel: user.preferredAiModel,
    locale: user.locale,
    createdAt: user.createdAt.toISOString(),
  };
}

export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  role: true,
  passwordHash: true,
  telegramId: true,
  telegramUsername: true,
  telegramPhotoUrl: true,
  displayName: true,
  firstName: true,
  lastName: true,
  preferredAiProvider: true,
  preferredAiModel: true,
  locale: true,
  tokenVersion: true,
  disabledAt: true,
  createdAt: true,
} as const;

// React cache() dedupes this per request, so a layout, a page and a route
// handler in the same render all share one DB read.
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const claims = await verifySession(await readSessionToken());
  if (!claims) return null;

  let user: UserRecord | null;
  try {
    user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    console.error('getCurrentUser: database read failed:', error);
    return null;
  }

  if (!user || user.disabledAt) return null;

  // The revocation check. A password change or "sign out everywhere" bumps
  // tokenVersion, which strands every JWT already in the wild without needing
  // a session table to delete rows from.
  if (user.tokenVersion !== claims.tv) return null;

  return toPublicUser(user);
});
