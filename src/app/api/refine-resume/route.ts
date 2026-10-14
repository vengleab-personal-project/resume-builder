import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from '@/server/config/env.server';
import { HTTP_STATUS, API_ERROR_MESSAGES, AI_REQUEST_LIMITS } from "@/shared/config/constants";
import { AiTimeoutError } from "@/server/modules/ai/clients/deadline";
import {
  refineWithGemini,
  refineWithOpenAI,
  buildRefinementPrompt,
  generateMockRefinement,
} from "@/server/modules/ai/workflows/refinementService";
import { assertSameOrigin, requireUser } from "@/server/modules/auth/guards";
import { errorResponse } from "@/server/errors";
import { resolveAiRequest } from "@/server/modules/ai/registry";
import { withCoinDeduction } from "@/server/modules/billing/coinService";
import { tryBillingErrorResponse, withCoinBalanceHeader } from "@/server/modules/billing/http";
import type { PublicUser } from "@/shared/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let user: PublicUser;
  try {
    assertSameOrigin(req);
    user = await requireUser();
  } catch (error) {
    return errorResponse(error);
  }

  try {
    const { instruction, content, schema, config } = await req.json();

    // Validated before it is used as a string: a missing `instruction` used to throw on
    // `.includes` and surface as a 500, and none of these had a size bound.
    if (typeof instruction !== 'string' || !instruction.trim()) {
      return NextResponse.json({ error: 'instruction is required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    const contentSize = typeof content === 'string' ? content.length : JSON.stringify(content ?? '').length;
    if (
      instruction.length > AI_REQUEST_LIMITS.MAX_INSTRUCTION_CHARS ||
      contentSize > AI_REQUEST_LIMITS.MAX_REFINE_CONTENT_CHARS ||
      (schema !== undefined && JSON.stringify(schema).length > AI_REQUEST_LIMITS.MAX_SCHEMA_CHARS)
    ) {
      return NextResponse.json({ error: 'Input is too large' }, { status: HTTP_STATUS.PAYLOAD_TOO_LARGE });
    }
    const isJson = instruction.includes("JSON");

    // The client has always sent `config`; until now it was read by nobody and
    // every refinement silently ran on a hardcoded Flash singleton.
    const { chatModel } = await resolveAiRequest({
      action: "REFINE_RESUME",
      provider: config?.provider,
      modelId: config?.model,
    });

    console.log("Refine API Start", { instruction, isJson, model: chatModel.modelId });
    const startTime = Date.now();
    const systemPrompt = buildRefinementPrompt(instruction, content);

    const isGoogle = chatModel.wireProvider === "google";

    const { data: result, balance } = await withCoinDeduction(
      { userId: user.id, action: "REFINE_RESUME", modelId: chatModel.modelId },
      async () => {
        if (isGoogle && serverEnv.GEMINI_API_KEY) {
          console.log("Calling Gemini...");
          return { data: await refineWithGemini(systemPrompt, isJson, schema, chatModel.modelId) };
        }
        if (!isGoogle && serverEnv.OPENAI_API_KEY) {
          console.log("Calling OpenAI...");
          return { data: await refineWithOpenAI(systemPrompt, isJson, schema, chatModel.modelId) };
        }
        // No API key available: the canned response is not an AI call and the
        // pre-charge is refunded.
        console.log("Using Mock Refinement");
        return { data: generateMockRefinement(instruction), billable: false };
      }
    );

    console.log(`Refine API Success in ${Date.now() - startTime}ms`);
    return withCoinBalanceHeader(NextResponse.json(result), balance);
  } catch (error: unknown) {
    const billingResponse = tryBillingErrorResponse(error);
    if (billingResponse) return billingResponse;

    console.error("Refine API Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof AiTimeoutError || errorMessage.includes("timed out")) {
      return NextResponse.json(
        {
          error:
            "The request timed out. Please try again with a shorter instruction or simpler content.",
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
