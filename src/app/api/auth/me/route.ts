import { NextResponse } from 'next/server';
import { issueSessionCookie, readSessionToken } from '@/server/modules/auth/cookies';
import { getCurrentUser } from '@/server/modules/auth/getCurrentUser';
import { withErrorHandling } from '@/server/errors';
import { shouldRefreshSession, verifySession } from '@/server/modules/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const claims = await verifySession(await readSessionToken());
  if (claims && shouldRefreshSession(claims)) {
    await issueSessionCookie({
      id: user.id,
      username: user.username,
      role: user.role,
      tokenVersion: claims.tv,
    });
  }

  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
});
