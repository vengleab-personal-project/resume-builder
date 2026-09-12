import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { serverEnv } from '@/server/config/env.server';
import { isChatModelAllowed } from '@/server/ai/registry';
import { AI_CONFIG } from '@/shared/config/constants';

const genAI = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY || "");

// Default configuration for JSON response
const JSON_RESPONSE_CONFIG = {
  responseMimeType: "application/json",
  maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
};

const TEXT_RESPONSE_CONFIG = {
  maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
};

// Safety settings (Guardrails)
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Async because the allow-list is the ChatModel table, not a compile-time
// constant. The check is unconditional on purpose: AIModel is now `string`, so
// this is the only thing standing between a request body and the Gemini SDK.
export const getGeminiModel = async (modelId: string, options?: { json?: boolean }) => {
  if (!(await isChatModelAllowed(modelId, 'GOOGLE'))) {
    throw new Error(`Model ${modelId} is not allowed`);
  }

  return genAI.getGenerativeModel({
    model: modelId,
    generationConfig: options?.json === false ? TEXT_RESPONSE_CONFIG : JSON_RESPONSE_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });
};
