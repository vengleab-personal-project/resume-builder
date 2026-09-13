import { type NextRequest } from 'next/server';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { withErrorHandling } from '@/server/errors';
import { applyResumePatch } from '../applyResumePatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// navigator.sendBeacon is the only way to get a write out of a page that is
// being closed, and it can only issue a POST -- hence this endpoint instead of
// reusing PATCH. The body arrives as a Blob whose type the browser may rewrite,
// so it is read as text and parsed rather than trusting req.json().
export const POST = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  const raw = await req.text();
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }

  return applyResumePatch(user.id, id, body);
});
