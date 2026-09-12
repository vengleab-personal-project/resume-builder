import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { serverEnv } from '@/server/config/env.server';
import { issueSessionCookie } from '@/server/auth/cookies';
import { assertSameOrigin, withAuthErrors } from '@/server/auth/guards';
import { loginOrCreateTelegramUser } from '@/server/auth/telegramAccount';
import type { VerifiedTelegramUser } from '@/server/auth/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Telegram's login widget only renders on a domain registered with BotFather,
// so localhost can never exercise the real flow. This mints a session for a
// fake Telegram identity to unblock local development.
//
// It bypasses HMAC verification entirely, so it must be unreachable in
// production. The 404 (rather than 403) keeps its existence unadvertised.

const devLoginSchema = z.object({
  telegramId: z.string().regex(/^\d+$/).optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const DEFAULT_DEV_TELEGRAM_ID = '900000000001';

export const POST = withAuthErrors(async (req: NextRequest) => {
  if (serverEnv.isProduction) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  assertSameOrigin(req);

  const body = await req.json().catch(() => ({}));
  const parsed = devLoginSchema.safeParse(body ?? {});
  const input = parsed.success ? parsed.data : {};

  const telegram: VerifiedTelegramUser = {
    telegramId: input.telegramId ?? DEFAULT_DEV_TELEGRAM_ID,
    telegramUsername: input.username ?? 'dev_tester',
    telegramPhotoUrl: null,
    firstName: input.firstName ?? 'Dev',
    lastName: input.lastName ?? 'Tester',
    authDate: new Date(),
  };

  const { user, tokenVersion, created } = await loginOrCreateTelegramUser(telegram);

  await issueSessionCookie({
    id: user.id,
    username: user.username,
    role: user.role,
    tokenVersion,
  });

  return NextResponse.json({ user, created });
});
