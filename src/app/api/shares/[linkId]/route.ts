import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { deleteShareLink, updateShareLink } from '@/server/modules/share/shareService';
import { updateShareLinkSchema } from '@/shared/lib/validation/shareSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ linkId: string }> };

export const PATCH = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { linkId } = await context.params;

  const parsed = updateShareLinkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid share link update', {
      issues: parsed.error.issues.map((issue) => ({ field: issue.path[0], message: issue.message })),
    });
  }

  const link = await updateShareLink(user.id, linkId, parsed.data);
  return NextResponse.json({ link });
});

export const DELETE = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { linkId } = await context.params;

  await deleteShareLink(user.id, linkId);
  return NextResponse.json({ ok: true });
});
