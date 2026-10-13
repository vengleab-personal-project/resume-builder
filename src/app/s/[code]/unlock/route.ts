import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { fakeVerify, verifyPassword } from '@/server/modules/auth/password';
import { getClientIp, hashIp } from '@/server/modules/auth/rateLimit';
import { signShareUnlock } from '@/server/modules/auth/session';
import {
  assertUnlockAllowed,
  recordUnlockAttempt,
  resolveShareLink,
} from '@/server/modules/share/publicShare';
import {
  SHARE_PATH_PREFIX,
  SHARE_UNLOCK_COOKIE,
  SHARE_UNLOCK_TTL_SECONDS,
} from '@/shared/config/share';
import { unlockShareSchema } from '@/shared/lib/validation/shareSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ code: string }> };

// Exchanges a correct passcode for an unlock cookie. The cookie's path is this link's
// own /s/<code>, so it reaches this link's content route and nothing else - not
// another link, not the app.
export const POST = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);
  const { code } = await context.params;

  const parsed = unlockShareSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, 'INVALID_INPUT', 'Invalid passcode');

  const link = await resolveShareLink(code);
  if (!link || link.access !== 'PASSCODE') {
    // Same cost and same answer as a real link, so the endpoint cannot be used to
    // find out which codes exist.
    await fakeVerify(parsed.data.passcode);
    throw new HttpError(404, 'NOT_FOUND', 'Not found');
  }

  const ipHash = hashIp(getClientIp(req));
  await assertUnlockAllowed(link.id, ipHash);

  const ok = await verifyPassword(parsed.data.passcode, link.passcodeHash);
  await recordUnlockAttempt(link.id, ipHash, ok);
  if (!ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Wrong passcode');

  const token = await signShareUnlock(
    { linkId: link.id, passcodeVersion: link.passcodeVersion },
    SHARE_UNLOCK_TTL_SECONDS
  );
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(SHARE_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: `${SHARE_PATH_PREFIX}/${code}`,
    maxAge: SHARE_UNLOCK_TTL_SECONDS,
  });
  return response;
});
