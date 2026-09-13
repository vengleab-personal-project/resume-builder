import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { clearSessionCookie } from '@/server/modules/auth/cookies';
import { getCurrentUser } from '@/server/modules/auth/getCurrentUser';
import { assertSameOrigin } from '@/server/modules/auth/guards';
import { withErrorHandling } from '@/server/errors';
import { logoutSchema } from '@/shared/lib/validation/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const body = await req.json().catch(() => ({}));
  const parsed = logoutSchema.safeParse(body ?? {});
  const everywhere = parsed.success && parsed.data.everywhere === true;

  if (everywhere) {
    const user = await getCurrentUser();
    if (user) {
      // Bumping tokenVersion invalidates every JWT already issued for this
      // user, including ones on devices we can't reach to clear a cookie on.
      await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
      });
    }
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
});
