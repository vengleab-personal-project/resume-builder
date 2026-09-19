import { NextResponse, type NextRequest } from 'next/server';
import { issueSessionCookie } from '@/server/modules/auth/cookies';
import { assertSameOrigin } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { verifyTelegramAuth } from '@/server/modules/auth/telegram';
import { loginOrCreateTelegramUser } from '@/server/modules/auth/telegramAccount';
import { telegramAuthPayloadSchema } from '@/shared/lib/validation/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const body = await req.json().catch(() => null);
  const parsed = telegramAuthPayloadSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid Telegram payload');
  }

  const telegram = verifyTelegramAuth(parsed.data);
  const { user, tokenVersion, created } = await loginOrCreateTelegramUser(telegram);

  await issueSessionCookie({
    id: user.id,
    username: user.username,
    role: user.role,
    tokenVersion,
  });

  return NextResponse.json({ user, created }, { status: created ? 201 : 200 });
});
