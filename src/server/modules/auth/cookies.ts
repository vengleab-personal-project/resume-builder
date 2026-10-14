import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/shared/config/auth';
import { getSessionTtlSeconds, signSession, verifySession, type SessionSubject } from './session';

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

/** Unix seconds of this session's real sign-in; 0 when unknown (an older cookie). */
export async function readSessionAuthenticatedAt(): Promise<number> {
  const claims = await verifySession(await readSessionToken());
  return claims?.aat ?? 0;
}

export async function issueSessionCookie(subject: SessionSubject): Promise<void> {
  const token = await signSession(subject);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: getSessionTtlSeconds(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, '', {
    ...baseCookieOptions(),
    maxAge: 0,
  });
}
