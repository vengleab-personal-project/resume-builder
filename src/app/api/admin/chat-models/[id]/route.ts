import { NextResponse, type NextRequest } from 'next/server';
import { invalidateAiConfig } from '@/server/ai/registry';
import { requireAdmin, assertSameOrigin, withAuthErrors, HttpError } from '@/server/auth/guards';
import { isUniqueViolation } from '@/server/auth/telegramAccount';
import { prisma } from '@/server/db/prisma';
import { updateChatModelSchema } from '@/shared/lib/validation/configSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withAuthErrors(async (req: NextRequest, context: RouteContext) => {
  await requireAdmin();
  assertSameOrigin(req);

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = updateChatModelSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid chat model update', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }

  const existing = await prisma.chatModel.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Chat model not found');
  }

  const data = parsed.data;
  const willBeDefault = data.isDefault ?? existing.isDefault;
  const willBeActive = data.isActive ?? existing.isActive;

  // A default that is not offered to anyone is how a registry ends up resolving
  // to nothing; refuse the combination rather than silently repairing it.
  if (willBeDefault && !willBeActive) {
    throw new HttpError(400, 'INVALID_INPUT', 'The default model must stay active');
  }

  try {
    const model = await prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.chatModel.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.chatModel.update({ where: { id }, data });
    });

    invalidateAiConfig();
    return NextResponse.json({ model });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, 'INVALID_INPUT', 'That provider/model pair already exists');
    }
    throw error;
  }
});

export const DELETE = withAuthErrors(async (req: NextRequest, context: RouteContext) => {
  await requireAdmin();
  assertSameOrigin(req);

  const { id } = await context.params;
  const existing = await prisma.chatModel.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Chat model not found');
  }

  if (existing.isDefault) {
    throw new HttpError(409, 'INVALID_INPUT', 'Promote another model to default before deleting');
  }

  // Its ActionCost overrides go with it via onDelete: Cascade.
  await prisma.chatModel.delete({ where: { id } });
  invalidateAiConfig();

  return NextResponse.json({ ok: true });
});
