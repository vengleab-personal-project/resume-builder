import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { issueSessionCookie } from '@/server/modules/auth/cookies';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { hashPassword, verifyPassword } from '@/server/modules/auth/password';
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

  // A Telegram-only account has no password to prove, so setting the first one
  // needs no currentPassword. Changing an existing one always does.
  if (record.passwordHash) {
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
  });

  return NextResponse.json({ ok: true });
});
