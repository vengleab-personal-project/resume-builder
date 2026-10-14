import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS, API_ERROR_MESSAGES, AI_REQUEST_LIMITS } from '@/shared/config/constants';
import { AiTimeoutError } from '@/server/modules/ai/clients/deadline';
import { orchestrateResumeParsing } from '@/server/modules/ai/workflows/parseResumeOrchestrator';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
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
    assertSameOrigin(req);
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

    // Before the model is resolved or anything is charged. `file.size` is what the client
    // declared in the multipart part, which the runtime has already read in full.
    if (
      (file && file.size > AI_REQUEST_LIMITS.MAX_UPLOAD_BYTES) ||
      (text && text.length > AI_REQUEST_LIMITS.MAX_TEXT_CHARS)
    ) {
      return NextResponse.json({ error: 'Input is too large' }, { status: HTTP_STATUS.PAYLOAD_TOO_LARGE });
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
    if (error instanceof AiTimeoutError) {
      return NextResponse.json({ error: 'The request timed out. Please try again.' }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    return NextResponse.json(
      { error: message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
