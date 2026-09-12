import 'server-only';
import { NextResponse } from 'next/server';
import type { AuthErrorCode, PublicUser } from '@/shared/types/auth';
import { ENV } from '@/shared/config/env';
import { getCurrentUser } from './getCurrentUser';

export class HttpError extends Error {
  readonly status: number;
  readonly code: AuthErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: AuthErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

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

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status }
    );
  }

  console.error('Unhandled auth route error:', error);
  return NextResponse.json({ error: 'INTERNAL_ERROR' as AuthErrorCode }, { status: 500 });
}

export function withAuthErrors<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
