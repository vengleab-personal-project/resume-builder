import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
