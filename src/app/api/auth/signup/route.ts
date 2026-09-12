import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { issueSessionCookie } from '@/server/auth/cookies';
import { PUBLIC_USER_SELECT, toPublicUser } from '@/server/auth/getCurrentUser';
import { HttpError, assertSameOrigin, withAuthErrors } from '@/server/auth/guards';
import { hashPassword } from '@/server/auth/password';
import { isUniqueViolation } from '@/server/auth/telegramAccount';
import { signupSchema } from '@/shared/lib/validation/authSchemas';
import { grantSignupBonus } from '@/server/services/coinService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAuthErrors(async (req: NextRequest) => {
  assertSameOrigin(req);

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid signup details', {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  }

  const { username, password, displayName } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        displayName: displayName || null,
        lastLoginAt: new Date(),
      },
      select: PUBLIC_USER_SELECT,
    });

    await issueSessionCookie({
      id: user.id,
      username: user.username,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    // Swallows its own failures: a missing welcome bonus must not fail signup.
    await grantSignupBonus(user.id);

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    // Uniqueness is only ever decided by the DB index; checking first and
    // inserting second would let two concurrent signups claim the same name.
    if (isUniqueViolation(error)) {
      throw new HttpError(409, 'USERNAME_TAKEN', 'That username is already taken');
    }
    throw error;
  }
});
