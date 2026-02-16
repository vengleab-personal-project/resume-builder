import { NextRequest, NextResponse } from "next/server";
import { ENV } from "@/config/env";
import { HTTP_STATUS, API_ERROR_MESSAGES } from "@/config/constants";
import {
  refineWithGemini,
  refineWithOpenAI,
  buildRefinementPrompt,
  generateMockRefinement,
} from "@/services/refinementService";

export async function POST(req: NextRequest) {
  try {
    const { instruction, content, schema } = await req.json();
    const isJson = instruction.includes("JSON");
    console.log("Refine API Start", { instruction, isJson });
    const startTime = Date.now();
    const systemPrompt = buildRefinementPrompt(instruction, content);

    let result;
    // Prefer Gemini if key is available
    if (ENV.GEMINI_API_KEY) {
      console.log("Calling Gemini...");
      result = await refineWithGemini(systemPrompt, isJson, schema);
    } else if (ENV.OPENAI_API_KEY) {
      // Fallback to OpenAI
      console.log("Calling OpenAI...");
      result = await refineWithOpenAI(systemPrompt, isJson, schema);
    } else {
      // No API key available
      console.log("Using Mock Refinement");
      result = generateMockRefinement(instruction);
    }

    console.log(`Refine API Success in ${Date.now() - startTime}ms`);
    return NextResponse.json(result);
  } catch (error: unknown) {
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
