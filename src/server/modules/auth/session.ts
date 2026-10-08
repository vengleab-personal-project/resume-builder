import { SignJWT, jwtVerify } from 'jose';
import {
  DEFAULT_SESSION_TTL_SECONDS,
  SESSION_REFRESH_AFTER_RATIO,
} from '@/shared/config/auth';
import type { Role, SessionClaims } from '@/shared/types/auth';

// EDGE RUNTIME PURITY: this module is imported by src/middleware.ts, which runs
// on the Edge runtime. It may only import `jose`, plain constants and types —
// no Prisma, no `node:crypto`, no `server-only`. Reading process.env directly
// (rather than via env.server.ts) is deliberate for the same reason.

const JWT_ALGORITHM = 'HS256';

let cachedSecret: string | null = null;
let cachedKey: Uint8Array | null = null;

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: AUTH_JWT_SECRET');
  }
  if (secret.length < 32) {
    throw new Error('AUTH_JWT_SECRET must be at least 32 characters long');
  }
  if (cachedKey && cachedSecret === secret) {
    return cachedKey;
  }
  cachedSecret = secret;
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export function getSessionTtlSeconds(): number {
  const raw = process.env.AUTH_SESSION_TTL_SECONDS;
  if (!raw) return DEFAULT_SESSION_TTL_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_SECONDS;
}

export interface SessionSubject {
  id: string;
  username: string;
  role: Role;
  tokenVersion: number;
}

export async function signSession(subject: SessionSubject): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + getSessionTtlSeconds();

  return new SignJWT({
    usr: subject.username,
    rol: subject.role,
    tv: subject.tokenVersion,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(subject.id)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(getSigningKey());
}

export async function verifySession(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: [JWT_ALGORITHM],
    });

    const { sub, usr, rol, tv, iat, exp } = payload as Record<string, unknown>;

    if (
      typeof sub !== 'string' ||
      typeof usr !== 'string' ||
      (rol !== 'USER' && rol !== 'ADMIN') ||
      typeof tv !== 'number' ||
      typeof iat !== 'number' ||
      typeof exp !== 'number'
    ) {
      return null;
    }

    return { sub, usr, rol, tv, iat, exp };
  } catch {
    return null;
  }
}

export function shouldRefreshSession(claims: SessionClaims): boolean {
  const lifetime = claims.exp - claims.iat;
  if (lifetime <= 0) return false;
  const elapsed = Math.floor(Date.now() / 1000) - claims.iat;
  return elapsed > lifetime * SESSION_REFRESH_AFTER_RATIO;
}

export function claimsToSubject(claims: SessionClaims): SessionSubject {
  return {
    id: claims.sub,
    username: claims.usr,
    role: claims.rol,
    tokenVersion: claims.tv,
  };
}
