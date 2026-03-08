import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ENV } from '@/shared/config/env';
import { AI_MODELS, AI_PROVIDERS, GEMINI_MODEL_IDS, AI_CONFIG } from '@/shared/config/constants';

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || "");

// Allowed model IDs for validation
const ALLOWED_GEMINI_MODELS = AI_MODELS[AI_PROVIDERS.GOOGLE].map(m => m.id);

// Default configuration for JSON response
const JSON_RESPONSE_CONFIG = {
  responseMimeType: "application/json",
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

export const geminiModel = genAI.getGenerativeModel({ 
  model: GEMINI_MODEL_IDS.FLASH_PREVIEW, 
  generationConfig: JSON_RESPONSE_CONFIG,
  safetySettings: SAFETY_SETTINGS,
});

// Helper for single text response (override config)
export const geminiTextModel = genAI.getGenerativeModel({ 
  model: GEMINI_MODEL_IDS.FLASH_PREVIEW,
  safetySettings: SAFETY_SETTINGS,
  generationConfig: {
    maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
  },
});

// Get model by ID
export const getGeminiModel = (modelId: string) => {
  if (!(ALLOWED_GEMINI_MODELS as any).includes(modelId)) {
    throw new Error(`Model ${modelId} is not allowed`);
  }

  return genAI.getGenerativeModel({ 
    model: modelId,
    generationConfig: JSON_RESPONSE_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });
};
