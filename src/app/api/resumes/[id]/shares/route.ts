import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { createShareLink, listShareLinks } from '@/server/modules/share/shareService';
import { createShareLinkSchema } from '@/shared/lib/validation/shareSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireUser();
  const { id } = await context.params;

  const links = await listShareLinks(user.id, id);
  return NextResponse.json({ links }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  const parsed = createShareLinkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid share link', {
      issues: parsed.error.issues.map((issue) => ({ field: issue.path[0], message: issue.message })),
    });
  }

  const link = await createShareLink(user.id, id, parsed.data);
  return NextResponse.json({ link }, { status: 201 });
});
