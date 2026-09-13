import type { NextRequest } from 'next/server';
import { requireUser } from '@/server/modules/auth/guards';
import { DEFAULT_AI_CONFIG } from '@/shared/config/constants';
import { getActionCosts } from '@/server/modules/billing/coinService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withBillingErrors(async (req: NextRequest) => {
  await requireUser();

  const modelId = req.nextUrl.searchParams.get('modelId') || DEFAULT_AI_CONFIG.MODEL;
  return jsonNoStore({ modelId, costs: await getActionCosts(modelId) });
});
