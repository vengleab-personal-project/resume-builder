import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from '@/server/config/env.server';
import { HTTP_STATUS, API_ERROR_MESSAGES } from "@/shared/config/constants";
import {
  refineWithGemini,
  refineWithOpenAI,
  buildRefinementPrompt,
  generateMockRefinement,
} from "@/server/services/refinementService";
import { errorResponse, requireUser } from "@/server/auth/guards";
import { resolveAiRequest } from "@/server/ai/registry";
import { withCoinDeduction } from "@/server/services/coinService";
import { tryBillingErrorResponse, withCoinBalanceHeader } from "@/server/services/billingHttp";
import type { PublicUser } from "@/shared/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let user: PublicUser;
  try {
    user = await requireUser();
  } catch (error) {
    return errorResponse(error);
  }

  try {
    const { instruction, content, schema, config } = await req.json();
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
    if (errorMessage.includes("timed out")) {
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
