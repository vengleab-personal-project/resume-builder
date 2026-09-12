import { NextResponse, type NextRequest } from 'next/server';
import { issueSessionCookie } from '@/server/auth/cookies';
import { HttpError, assertSameOrigin, withAuthErrors } from '@/server/auth/guards';
import { verifyTelegramAuth } from '@/server/auth/telegram';
import { loginOrCreateTelegramUser } from '@/server/auth/telegramAccount';
import { telegramAuthPayloadSchema } from '@/shared/lib/validation/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAuthErrors(async (req: NextRequest) => {
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
