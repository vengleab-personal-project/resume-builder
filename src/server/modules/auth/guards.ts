import 'server-only';
import type { PublicUser } from '@/shared/types/auth';
import { ENV } from '@/shared/config/env';
import { HttpError } from '@/server/errors';
import { getCurrentUser } from './getCurrentUser';

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');
  }
  return user;
}

// The role is read from Postgres by getCurrentUser on every call, never from
// the JWT's `rol` claim — a user demoted from ADMIN must lose access without
// waiting for their cookie to expire. The middleware's role check is only a
// UX redirect; this is the real gate.
export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'FORBIDDEN', 'Administrator access required');
  }
  return user;
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// Cookie-authenticated state-changing routes need CSRF protection. sameSite=lax
// already blocks cross-site POSTs from forms, but this closes the gap for
// requests that slip through (and is cheap).
//
// Fails closed: browsers always send Origin on POST/PUT/PATCH/DELETE, so a
// request with neither Origin nor a same-origin Sec-Fetch-Site is not a browser
// acting on the user's behalf.
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get('origin');

  if (!origin) {
    const fetchSite = req.headers.get('sec-fetch-site');
    if (fetchSite === 'same-origin' || fetchSite === 'none') return;
    throw new HttpError(403, 'CROSS_ORIGIN', 'Cross-origin request rejected');
  }

  const allowed = new Set<string>();
  // Normalised so a trailing slash in NEXT_PUBLIC_APP_URL still matches.
  const appOrigin = ENV.APP_URL ? normalizeOrigin(ENV.APP_URL) : null;
  if (appOrigin) allowed.add(appOrigin);

  const host = req.headers.get('host');
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  if (!allowed.has(origin)) {
    throw new HttpError(403, 'CROSS_ORIGIN', 'Cross-origin request rejected');
  }
}
