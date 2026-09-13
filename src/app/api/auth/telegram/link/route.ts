import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { PUBLIC_USER_SELECT, toPublicUser } from '@/server/modules/auth/getCurrentUser';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { verifyTelegramAuth } from '@/server/modules/auth/telegram';
import { isUniqueViolation } from '@/server/modules/auth/telegramAccount';
import { telegramAuthPayloadSchema } from '@/shared/lib/validation/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const body = await req.json().catch(() => null);
  const parsed = telegramAuthPayloadSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid Telegram payload');
  }

  const telegram = verifyTelegramAuth(parsed.data);

  const owner = await prisma.user.findUnique({
    where: { telegramId: telegram.telegramId },
    select: { id: true },
  });

  if (owner && owner.id !== user.id) {
    throw new HttpError(
      409,
      'TELEGRAM_ALREADY_LINKED',
      'That Telegram account is already linked to another user'
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramId: telegram.telegramId,
        telegramUsername: telegram.telegramUsername,
        telegramPhotoUrl: telegram.telegramPhotoUrl,
        firstName: user.firstName ?? telegram.firstName,
        lastName: user.lastName ?? telegram.lastName,
      },
      select: PUBLIC_USER_SELECT,
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(
        409,
        'TELEGRAM_ALREADY_LINKED',
        'That Telegram account is already linked to another user'
      );
    }
    throw error;
  }
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  if (!user.hasTelegram) {
    throw new HttpError(409, 'TELEGRAM_NOT_LINKED', 'No Telegram account is linked');
  }

  // Unlinking the only credential would leave an account nobody can sign into.
  // The DB CHECK constraint would reject it anyway; this turns that into a
  // meaningful error instead of a 500.
  if (!user.hasPassword) {
    throw new HttpError(
      409,
      'LAST_CREDENTIAL',
      'Set a password before unlinking your Telegram account'
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramId: null,
      telegramUsername: null,
      telegramPhotoUrl: null,
    },
    select: PUBLIC_USER_SELECT,
  });

  return NextResponse.json({ user: toPublicUser(updated) });
});
