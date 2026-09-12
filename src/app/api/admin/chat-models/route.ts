import { NextResponse, type NextRequest } from 'next/server';
import { invalidateAiConfig } from '@/server/ai/registry';
import { requireAdmin, assertSameOrigin, withAuthErrors, HttpError } from '@/server/auth/guards';
import { isUniqueViolation } from '@/server/auth/telegramAccount';
import { prisma } from '@/server/db/prisma';
import { createChatModelSchema } from '@/shared/lib/validation/configSchemas';

export const runtime = 'nodejs';
// Admin data must never be prerendered: the loader would run at build time with
// no DATABASE_URL, and a cached response would show stale config.
export const dynamic = 'force-dynamic';

export const GET = withAuthErrors(async () => {
  await requireAdmin();

  const models = await prisma.chatModel.findMany({
    orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
  });

  return NextResponse.json({ models }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = withAuthErrors(async (req: NextRequest) => {
  await requireAdmin();
  assertSameOrigin(req);

  const body = await req.json().catch(() => null);
  const parsed = createChatModelSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid chat model', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }

  const data = parsed.data;

  try {
    const model = await prisma.$transaction(async (tx) => {
      // chat_models_single_default_idx is a partial unique index, not a
      // deferrable constraint, so the old default must be cleared first.
      if (data.isDefault) {
        await tx.chatModel.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }
      return tx.chatModel.create({ data });
    });

    invalidateAiConfig();
    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, 'INVALID_INPUT', 'That provider/model pair already exists');
    }
    throw error;
  }
});
