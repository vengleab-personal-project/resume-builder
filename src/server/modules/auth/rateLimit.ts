import 'server-only';
import { createHash } from 'node:crypto';
import { prisma } from '@/server/db/prisma';
import { serverEnv } from '@/server/config/env.server';
import {
  LOGIN_RATE_LIMIT_MAX_FAILURES,
  LOGIN_RATE_LIMIT_WINDOW_MS,
} from '@/shared/config/auth';
import { HttpError } from '@/server/errors';

// Raw IPs are personal data and this table is long-lived, so only a salted
// digest is stored. The salt makes the hashes useless outside this deployment.
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`${serverEnv.AUTH_IP_HASH_SALT}:${ip}`).digest('hex');
}

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip');
}

export async function recordAuthAttempt(
  identifier: string,
  ipHash: string | null,
  successful: boolean
): Promise<void> {
  try {
    await prisma.authAttempt.create({
      data: { identifier, ipHash, successful },
    });
  } catch (error) {
    // Never fail a login because the audit write failed.
    console.error('Failed to record auth attempt:', error);
  }
}

export async function assertLoginAllowed(
  identifier: string,
  ipHash: string | null
): Promise<void> {
  const since = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS);

  let failures: number;
  try {
    failures = await prisma.authAttempt.count({
      where: {
        successful: false,
        createdAt: { gte: since },
        OR: [{ identifier }, ...(ipHash ? [{ ipHash }] : [])],
      },
    });
  } catch (error) {
    // Fail open: a Postgres blip should not lock every user out of the product.
    console.error('Rate limit check failed, allowing request:', error);
    return;
  }

  if (failures >= LOGIN_RATE_LIMIT_MAX_FAILURES) {
    throw new HttpError(429, 'RATE_LIMITED', 'Too many failed attempts. Try again later.');
  }
}

// Successful login clears the counter so a user who eventually remembers their
// password isn't still throttled for the rest of the window.
export async function clearFailedAttempts(
  identifier: string,
  ipHash: string | null
): Promise<void> {
  try {
    await prisma.authAttempt.deleteMany({
      where: {
        successful: false,
        OR: [{ identifier }, ...(ipHash ? [{ ipHash }] : [])],
      },
    });
  } catch (error) {
    console.error('Failed to clear auth attempts:', error);
  }
}
