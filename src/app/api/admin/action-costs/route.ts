import { NextResponse, type NextRequest } from 'next/server';
import { invalidateAiConfig } from '@/server/modules/ai/registry';
import { requireAdmin, assertSameOrigin } from '@/server/modules/auth/guards';
import { withErrorHandling, HttpError } from '@/server/errors';
import { prisma } from '@/server/db/prisma';
import {
  deleteActionCostSchema,
  upsertActionCostSchema,
} from '@/shared/lib/validation/configSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  await requireAdmin();

  const costs = await prisma.actionCost.findMany({ orderBy: [{ action: 'asc' }] });

  return NextResponse.json({ costs }, { headers: { 'Cache-Control': 'no-store' } });
});

// One idempotent upsert endpoint instead of separate create/update: the matrix
// UI only ever knows (action, model) and a number, never a row id.
export const PUT = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin();
  assertSameOrigin(req);

  const body = await req.json().catch(() => null);
  const parsed = upsertActionCostSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid action cost', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }

  const { action, chatModelId, coinCost } = parsed.data;

  if (chatModelId) {
    const model = await prisma.chatModel.findUnique({ where: { id: chatModelId } });
    if (!model) {
      throw new HttpError(404, 'NOT_FOUND', 'Chat model not found');
    }
  }

  const existing = await prisma.actionCost.findFirst({ where: { action, chatModelId } });

  const cost = existing
    ? await prisma.actionCost.update({ where: { id: existing.id }, data: { coinCost } })
    : await prisma.actionCost.create({ data: { action, chatModelId, coinCost } });

  invalidateAiConfig();
  return NextResponse.json({ cost });
});

// Deleting an override makes the action inherit the default row again. The
// default row itself (chatModelId null) is not deletable — every action must
// always price.
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin();
  assertSameOrigin(req);

  const body = await req.json().catch(() => null);
  const parsed = deleteActionCostSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid action cost override');
  }

  const { action, chatModelId } = parsed.data;
  const removed = await prisma.actionCost.deleteMany({ where: { action, chatModelId } });

  invalidateAiConfig();
  return NextResponse.json({ ok: true, removed: removed.count });
});
