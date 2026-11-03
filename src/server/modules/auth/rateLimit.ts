import 'server-only';
import { createHash } from 'node:crypto';
import { prisma } from '@/server/db/prisma';
import { serverEnv } from '@/server/config/env.server';
import {
  LOGIN_RATE_LIMIT_MAX_FAILURES,
  LOGIN_RATE_LIMIT_WINDOW_MS,
  SIGNUP_ATTEMPT_IDENTIFIER,
  SIGNUP_RATE_LIMIT_MAX,
  SIGNUP_RATE_LIMIT_WINDOW_MS,
} from '@/shared/config/auth';
import { SHARE_ATTEMPT_PREFIX } from '@/shared/config/share';
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
        // Share-passcode guesses share this table and this IP column; they must not
        // count towards (or be cleared by) anyone's login.
        NOT: { identifier: { startsWith: SHARE_ATTEMPT_PREFIX } },
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

// A successful login clears that account's own failures, so a user who eventually
// remembers their password isn't still throttled for the rest of the window.
//
// Only by identifier, never by IP: clearing the IP's failures would let anyone with one
// account of their own reset the counters between every few guesses at someone else's
// password (or at a share link's passcode, which counts against the same IP).
export async function clearFailedAttempts(identifier: string): Promise<void> {
  try {
    await prisma.authAttempt.deleteMany({ where: { successful: false, identifier } });
  } catch (error) {
    console.error('Failed to clear auth attempts:', error);
  }
}

export async function assertSignupAllowed(ipHash: string | null): Promise<void> {
  if (!ipHash) return;
  try {
    const recent = await prisma.authAttempt.count({
      where: {
        identifier: SIGNUP_ATTEMPT_IDENTIFIER,
        ipHash,
        createdAt: { gte: new Date(Date.now() - SIGNUP_RATE_LIMIT_WINDOW_MS) },
      },
    });
    if (recent >= SIGNUP_RATE_LIMIT_MAX) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many sign-ups from this network. Try again later.');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Signup rate limit check failed, allowing request:', error);
  }
}

/** Counted whether or not the signup succeeds: the cost (argon2) is paid either way. */
export const recordSignupAttempt = (ipHash: string | null) =>
  recordAuthAttempt(SIGNUP_ATTEMPT_IDENTIFIER, ipHash, true);
