import { NextResponse, type NextRequest } from 'next/server';
import { HttpError, withErrorHandling } from '@/server/errors';
import {
  isUnlocked,
  readSharedResume,
  recordShareView,
  resolveShareLink,
} from '@/server/modules/share/publicShare';
import { SHARE_CLIENT_HEADER, SHARE_UNLOCK_COOKIE } from '@/shared/config/share';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ code: string }> };

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * The shared CV itself. It is never in the page's HTML: the viewer page fetches it
 * from here after its script runs, so a crawler or a plain fetcher holding the URL
 * gets an empty shell. On top of the link checks, this route answers only requests
 * that look like that script:
 * - the page's own header (a fetcher would have to read our JS to know to send it),
 * - and, from browsers that send Fetch Metadata, a same-origin request.
 * Every refusal is the same 404, so nothing here reveals which check failed.
 */
export const GET = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  const notFound = () => new HttpError(404, 'NOT_FOUND', 'Not found');

  if (req.headers.get(SHARE_CLIENT_HEADER) !== '1') throw notFound();
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') throw notFound();

  const { code } = await context.params;
  const link = await resolveShareLink(code);
  if (!link) throw notFound();

  if (!(await isUnlocked(link, req.cookies.get(SHARE_UNLOCK_COOKIE)?.value))) {
    // 401, not 404: the page already knows this link wants a passcode, and needs to
    // tell "ask for it again" (expired, or the owner changed it) from "gone".
    throw new HttpError(401, 'UNAUTHENTICATED', 'Passcode required');
  }

  const content = readSharedResume(link);
  await recordShareView(link.id);
  return NextResponse.json(content, { headers: NO_STORE });
});
