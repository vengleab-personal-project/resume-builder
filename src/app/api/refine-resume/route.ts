import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/config/env';
import { HTTP_STATUS, API_ERROR_MESSAGES } from '@/config/constants';
import { 
  refineWithGemini, 
  refineWithOpenAI, 
  buildRefinementPrompt,
  generateMockRefinement 
} from '@/services/refinementService';

export async function POST(req: NextRequest) {
  try {
    const { instruction, content, schema } = await req.json();
    const systemPrompt = buildRefinementPrompt(instruction, content);
    const isJson = instruction.includes("JSON");

    // Prefer Gemini if key is available
    if (ENV.GEMINI_API_KEY) {
      const result = await refineWithGemini(systemPrompt, isJson, schema);
      return NextResponse.json(result);
    }

    // Fallback to OpenAI
    if (ENV.OPENAI_API_KEY) {
      const result = await refineWithOpenAI(systemPrompt, isJson, schema);
      return NextResponse.json(result);
    }

    // No API key available
    return NextResponse.json(generateMockRefinement(instruction));

  } catch (error) {
    console.error("Refine API Error:", error);
    return NextResponse.json(
      { error: API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, 
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
