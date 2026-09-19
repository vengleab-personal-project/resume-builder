import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_PATH_PREFIX,
  AUTH_ROUTES,
  PROTECTED_PATH_PREFIXES,
  SESSION_COOKIE_NAME,
} from '@/shared/config/auth';
import {
  claimsToSubject,
  getSessionTtlSeconds,
  shouldRefreshSession,
  signSession,
  verifySession,
} from '@/server/modules/auth/session';

// EDGE RUNTIME: this file and everything it imports run on the Edge runtime.
// Only `next/server`, plain constants and the jose-only session module are
// importable here — pulling in Prisma or any `server-only` module breaks the
// build with an opaque bundling error.

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = AUTH_ROUTES.LOGIN;
  url.search = '';
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
  const isAdminPath = matchesPrefix(pathname, ADMIN_PATH_PREFIX);

  if (!isProtected && !isAdminPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = await verifySession(token);

  if (!claims) {
    return redirectToLogin(req);
  }

  // UX fast path only. The `rol` claim can be up to a full session lifetime
  // stale, so this must never be the only thing standing between a user and an
  // admin capability — requireAdmin() re-reads the role from Postgres and is
  // the real gate on every /api/admin/* handler.
  if (isAdminPath && claims.rol !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = AUTH_ROUTES.AFTER_LOGIN;
    url.search = '';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (shouldRefreshSession(claims)) {
    const refreshed = await signSession(claimsToSubject(claims));
    response.cookies.set(SESSION_COOKIE_NAME, refreshed, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getSessionTtlSeconds(),
    });
  }

  return response;
}

export const config = {
  matcher: [
    // /api/auth/* is deliberately absent: those routes must be reachable while
    // logged out, and a redirect response would break their JSON contract.
    '/builder/:path*',
    '/evaluation/:path*',
    '/account/:path*',
    '/billing/:path*',
    '/admin/:path*',
  ],
};
