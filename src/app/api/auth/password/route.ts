import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { issueSessionCookie, readSessionAuthenticatedAt } from '@/server/modules/auth/cookies';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { hashPassword, verifyPassword } from '@/server/modules/auth/password';
import { FIRST_PASSWORD_MAX_SESSION_AGE_SECONDS } from '@/shared/config/auth';
import { setPasswordSchema } from '@/shared/lib/validation/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const body = await req.json().catch(() => null);
  const parsed = setPasswordSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid password', {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  }

  const { currentPassword, newPassword } = parsed.data;

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!record) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  const authenticatedAt = await readSessionAuthenticatedAt();

  // A Telegram-only account has no password to prove, so setting the first one cannot ask
  // for currentPassword. What it asks for instead is a recent sign-in: a cookie alone (an
  // old session, or one a script on some page is riding) is not enough to attach a
  // password, and with it a way in that never needs Telegram again.
  // Changing an existing password always needs the current one.
  if (!record.passwordHash) {
    const age = Math.floor(Date.now() / 1000) - authenticatedAt;
    if (age > FIRST_PASSWORD_MAX_SESSION_AGE_SECONDS) {
      throw new HttpError(401, 'REAUTH_REQUIRED', 'Please sign in again before setting a password');
    }
  } else {
    if (!currentPassword) {
      throw new HttpError(400, 'INVALID_INPUT', 'Current password is required');
    }
    const matches = await verifyPassword(currentPassword, record.passwordHash);
    if (!matches) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
    }
  }

  const passwordHash = await hashPassword(newPassword);

  // Bumping tokenVersion signs out every other device, then the fresh cookie
  // below keeps the device that made the change signed in.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
    select: { id: true, username: true, role: true, tokenVersion: true },
  });

  await issueSessionCookie({
    id: updated.id,
    username: updated.username,
    role: updated.role,
    tokenVersion: updated.tokenVersion,
    // Still the same sign-in, not a new one.
    authenticatedAt,
  });

  return NextResponse.json({ ok: true });
});
