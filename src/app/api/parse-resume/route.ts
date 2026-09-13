import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS, API_ERROR_MESSAGES } from '@/shared/config/constants';
import { orchestrateResumeParsing } from '@/server/modules/ai/workflows/parseResumeOrchestrator';
import { requireUser } from '@/server/modules/auth/guards';
import { errorResponse } from '@/server/errors';
import { resolveAiRequest } from '@/server/modules/ai/registry';
import { serverEnv } from '@/server/config/env.server';
import { withCoinDeduction } from '@/server/modules/billing/coinService';
import { tryBillingErrorResponse, withCoinBalanceHeader } from '@/server/modules/billing/http';
import type { PublicUser } from '@/shared/types/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let user: PublicUser;
  try {
    user = await requireUser();
  } catch (error) {
    return errorResponse(error);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;

    if (!file && !text) {
      return NextResponse.json(
        { error: API_ERROR_MESSAGES.NO_FILE_UPLOADED },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { chatModel } = await resolveAiRequest({
      action: 'PARSE_RESUME',
      provider: formData.get('provider') as string | null,
      modelId: formData.get('model') as string | null,
    });

    const { data: parsedData, balance } = await withCoinDeduction(
      { userId: user.id, action: 'PARSE_RESUME', modelId: chatModel.modelId },
      async () => ({
        data: await orchestrateResumeParsing({
          file,
          text,
          provider: chatModel.wireProvider,
          model: chatModel.modelId,
        }),
        // Same condition the orchestrator branches on: with no OpenAI key it
        // returns generateMockResponse(), which must never be charged for.
        billable: chatModel.wireProvider !== 'openai' || Boolean(serverEnv.OPENAI_API_KEY),
      })
    );

    return withCoinBalanceHeader(NextResponse.json(parsedData), balance);
  } catch (error: unknown) {
    const billingResponse = tryBillingErrorResponse(error);
    if (billingResponse) return billingResponse;

    console.error("Parse resume error:", error);
    const message = error instanceof Error ? error.message : API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    return NextResponse.json(
      { error: message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
