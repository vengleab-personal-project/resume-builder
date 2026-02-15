import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from '@/config/env';
import { AI_MODELS, AI_PROVIDERS, GEMINI_MODEL_IDS } from '@/config/constants';

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || "");

// Allowed model IDs for validation
const ALLOWED_GEMINI_MODELS = AI_MODELS[AI_PROVIDERS.GOOGLE].map(m => m.id);

// Default configuration for JSON response
const JSON_RESPONSE_CONFIG = {
  responseMimeType: "application/json",
};

export const geminiModel = genAI.getGenerativeModel({ 
  model: GEMINI_MODEL_IDS.FLASH_PREVIEW, 
  generationConfig: JSON_RESPONSE_CONFIG
});

// Helper for single text response (override config)
export const geminiTextModel = genAI.getGenerativeModel({ 
  model: GEMINI_MODEL_IDS.FLASH_PREVIEW
});

// Get model by ID
export const getGeminiModel = (modelId: string) => {
  if (!ALLOWED_GEMINI_MODELS.includes(modelId as any)) {
    throw new Error(`Model ${modelId} is not allowed`);
  }

  return genAI.getGenerativeModel({ 
    model: modelId,
    generationConfig: JSON_RESPONSE_CONFIG
  });
};
