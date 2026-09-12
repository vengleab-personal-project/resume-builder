import { NextResponse, type NextRequest } from 'next/server';
import { HttpError, assertSameOrigin, requireUser, withAuthErrors } from '@/server/auth/guards';
import { findOwnedResume, softDeleteResume } from '@/server/services/resumePersistenceService';
import { applyResumePatch } from './applyResumePatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuthErrors(async (_req: NextRequest, context: RouteContext) => {
  const user = await requireUser();
  const { id } = await context.params;

  const resume = await findOwnedResume(user.id, id);
  if (!resume) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  return NextResponse.json({ resume }, { headers: { 'Cache-Control': 'no-store' } });
});

export const PATCH = withAuthErrors(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  return applyResumePatch(user.id, id, await req.json().catch(() => null));
});

export const DELETE = withAuthErrors(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  const deleted = await softDeleteResume(user.id, id);
  if (!deleted) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  return NextResponse.json({ ok: true });
});
