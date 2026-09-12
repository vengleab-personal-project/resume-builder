import { NextResponse } from 'next/server';
import { issueSessionCookie, readSessionToken } from '@/server/auth/cookies';
import { getCurrentUser } from '@/server/auth/getCurrentUser';
import { withAuthErrors } from '@/server/auth/guards';
import { shouldRefreshSession, verifySession } from '@/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuthErrors(async () => {
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
