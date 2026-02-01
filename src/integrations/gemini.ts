import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from '@/config/env';

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
  }
});

// Helper for single text response (override config)
export const geminiTextModel = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview"
});

// Get model by ID
export const getGeminiModel = (modelId: string) => {
  return genAI.getGenerativeModel({ 
    model: modelId === 'gemini-3-flash' ? 'gemini-3-flash-preview' : modelId,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
};

// Get text model by ID
export const getGeminiTextModel = (modelId: string) => {
  return genAI.getGenerativeModel({ 
    model: modelId === 'gemini-3-flash' ? 'gemini-3-flash-preview' : modelId
  });
};
