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

// Cookie-authenticated state-changing routes need CSRF protection. sameSite=lax
// already blocks cross-site POSTs from forms, but this closes the gap for
// requests that slip through (and is cheap).
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  if (!origin) return;

  const allowed = new Set<string>();
  if (ENV.APP_URL) allowed.add(ENV.APP_URL);

  const host = req.headers.get('host');
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  if (!allowed.has(origin)) {
    throw new HttpError(403, 'CROSS_ORIGIN', 'Cross-origin request rejected');
  }
}
