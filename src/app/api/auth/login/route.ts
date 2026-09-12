import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { issueSessionCookie } from '@/server/auth/cookies';
import { PUBLIC_USER_SELECT, toPublicUser } from '@/server/auth/getCurrentUser';
import { HttpError, assertSameOrigin, withAuthErrors } from '@/server/auth/guards';
import { fakeVerify, verifyPassword } from '@/server/auth/password';
import {
  assertLoginAllowed,
  clearFailedAttempts,
  getClientIp,
  hashIp,
  recordAuthAttempt,
} from '@/server/auth/rateLimit';
import { loginSchema } from '@/shared/lib/validation/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INVALID_CREDENTIALS = () =>
  new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');

export const POST = withAuthErrors(async (req: NextRequest) => {
  assertSameOrigin(req);

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  // A malformed body gets the same 401 as a wrong password: reporting "that
  // isn't a valid username" would confirm which strings are not accounts.
  if (!parsed.success) {
    throw INVALID_CREDENTIALS();
  }

  const { username, password } = parsed.data;
  const ipHash = hashIp(getClientIp(req));

  await assertLoginAllowed(username, ipHash);

  const user = await prisma.user.findUnique({
    where: { username },
    select: PUBLIC_USER_SELECT,
  });

  // No user means no hash to verify, which would return far faster than a real
  // argon2 comparison. fakeVerify burns the same CPU so the two paths are
  // indistinguishable by timing.
  if (!user) {
    await fakeVerify(password);
    await recordAuthAttempt(username, ipHash, false);
    throw INVALID_CREDENTIALS();
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    await recordAuthAttempt(username, ipHash, false);
    throw INVALID_CREDENTIALS();
  }

  if (user.disabledAt) {
    await recordAuthAttempt(username, ipHash, false);
    throw new HttpError(403, 'ACCOUNT_DISABLED', 'This account has been disabled');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await issueSessionCookie({
    id: user.id,
    username: user.username,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  await recordAuthAttempt(username, ipHash, true);
  await clearFailedAttempts(username, ipHash);

  return NextResponse.json({ user: toPublicUser(user) });
});
