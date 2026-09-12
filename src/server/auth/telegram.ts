import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { serverEnv } from '@/server/config/env.server';
import { TELEGRAM_AUTH_MAX_AGE_SECONDS } from '@/shared/config/auth';
import { HttpError } from '@/server/auth/guards';
import type { TelegramAuthPayload } from '@/shared/types/auth';

export interface VerifiedTelegramUser {
  telegramId: string;
  telegramUsername: string | null;
  telegramPhotoUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  authDate: Date;
}

// Every field except `hash`, sorted by key, rendered as `key=value` and joined
// with newlines. Values must be the exact strings Telegram sent.
function buildDataCheckString(payload: TelegramAuthPayload): string {
  const entries = Object.entries(payload)
    .filter(([key, value]) => key !== 'hash' && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`)
    .sort();

  return entries.join('\n');
}

function isTelegramConfigured(): boolean {
  return serverEnv.TELEGRAM_BOT_TOKEN.length > 0;
}

export function assertTelegramConfigured(): void {
  if (!isTelegramConfigured()) {
    throw new HttpError(
      503,
      'TELEGRAM_NOT_CONFIGURED',
      'Telegram login is not configured on this server'
    );
  }
}

export function verifyTelegramAuth(payload: TelegramAuthPayload): VerifiedTelegramUser {
  assertTelegramConfigured();

  // Telegram's spec: the HMAC key is the RAW SHA256 digest of the bot token,
  // not its hex encoding. Hex here silently produces a key that never matches,
  // and (worse) a naive "just compare strings" fix would disable the check
  // entirely. This is the whole security boundary for Telegram login.
  const secretKey = createHash('sha256').update(serverEnv.TELEGRAM_BOT_TOKEN).digest();

  const expectedHex = createHmac('sha256', secretKey)
    .update(buildDataCheckString(payload))
    .digest('hex');

  const receivedHex = String(payload.hash).toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(receivedHex)) {
    throw new HttpError(401, 'TELEGRAM_INVALID_SIGNATURE', 'Invalid Telegram signature');
  }

  const expectedBuffer = Buffer.from(expectedHex, 'hex');
  const receivedBuffer = Buffer.from(receivedHex, 'hex');

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new HttpError(401, 'TELEGRAM_INVALID_SIGNATURE', 'Invalid Telegram signature');
  }

  const authDateSeconds = Number(payload.auth_date);
  if (!Number.isFinite(authDateSeconds)) {
    throw new HttpError(401, 'TELEGRAM_INVALID_SIGNATURE', 'Invalid Telegram auth_date');
  }

  // A valid payload is replayable forever without this window, since Telegram
  // signs it once and never revokes it.
  const ageSeconds = Math.floor(Date.now() / 1000) - authDateSeconds;
  if (ageSeconds > TELEGRAM_AUTH_MAX_AGE_SECONDS || ageSeconds < -TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    throw new HttpError(401, 'TELEGRAM_EXPIRED', 'Telegram login data has expired');
  }

  const telegramId = String(payload.id).trim();
  if (!/^\d+$/.test(telegramId)) {
    throw new HttpError(401, 'TELEGRAM_INVALID_SIGNATURE', 'Invalid Telegram id');
  }

  return {
    telegramId,
    telegramUsername: payload.username ?? null,
    telegramPhotoUrl: payload.photo_url ?? null,
    firstName: payload.first_name ?? null,
    lastName: payload.last_name ?? null,
    authDate: new Date(authDateSeconds * 1000),
  };
}
