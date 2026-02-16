import { REFINEMENT_PROMPT } from '@/lib/ai-config';
import { AI_CONFIG } from '@/config/constants';
import { openaiClient, OPENAI_CONFIG } from '@/integrations/openai';
import { geminiModel, geminiTextModel } from '@/integrations/gemini';
import { validateTokenLimit, truncateToTokenLimit } from '@/lib/tokenCounter';
import { validatePromptSafety, sanitizePromptInput } from '@/lib/promptGuard';
import { ENV } from '@/config/env';

interface RefinementRequest {
  instruction: string;
  content: string | object;
  schema?: any;
}

interface RefinementResponse {
  result?: string;
  [key: string]: any;
}

/**
 * Refine content using Gemini
 */
export const refineWithGemini = async (
  systemPrompt: string,
  isJson: boolean,
  schema?: unknown
): Promise<RefinementResponse> => {
  const safetyCheck = validatePromptSafety(systemPrompt);
  if (!safetyCheck.safe) {
    throw new Error(`Security validation failed: ${safetyCheck.reason}`);
  }

  const tokenValidation = validateTokenLimit(systemPrompt, ENV.MAX_AI_TOKENS);
  const processedPrompt = tokenValidation.valid 
    ? systemPrompt 
    : truncateToTokenLimit(systemPrompt, ENV.MAX_AI_TOKENS);

  const sanitizedPrompt = sanitizePromptInput(processedPrompt);

  const model = isJson ? geminiModel : geminiTextModel;
  const prompt = `${sanitizedPrompt}\n\n${
    isJson 
      ? `Refine/Generate and return as JSON matching this schema: ${JSON.stringify(schema)}` 
      : "Refine the content directly."
  }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Guard against unwanted output (refusal or error messages)
  if (text.toLowerCase().includes("cannot assist") || text.toLowerCase().includes("refuse") || text.toLowerCase().includes("unrelated")) {
    throw new Error("The request was declined as it is outside the professional scope of this resume builder.");
  }

  if (isJson) {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI JSON response:", text);
      throw new Error("Failed to process the AI response. Please try again with a different instruction.");
    }
  }
  return { result: text.trim() };
};

/**
 * Refine content using OpenAI
 */
export const refineWithOpenAI = async (
  systemPrompt: string,
  isJson: boolean,
  schema?: unknown
): Promise<RefinementResponse> => {
  const safetyCheck = validatePromptSafety(systemPrompt);
  if (!safetyCheck.safe) {
    throw new Error(`Security validation failed: ${safetyCheck.reason}`);
  }

  const tokenValidation = validateTokenLimit(systemPrompt, ENV.MAX_AI_TOKENS);
  const processedPrompt = tokenValidation.valid 
    ? systemPrompt 
    : truncateToTokenLimit(systemPrompt, ENV.MAX_AI_TOKENS);

  const sanitizedPrompt = sanitizePromptInput(processedPrompt);

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: sanitizedPrompt },
      { 
        role: "user", 
        content: isJson 
          ? `Refine/Generate and return as JSON matching this schema: ${JSON.stringify(schema)}`
          : "Refine the content directly."
      }
    ],
    temperature: AI_CONFIG.TEMPERATURE_REFINEMENT,
    response_format: isJson 
      ? { type: AI_CONFIG.RESPONSE_FORMAT_JSON } 
      : { type: AI_CONFIG.RESPONSE_FORMAT_TEXT },
    max_tokens: OPENAI_CONFIG.MAX_TOKENS,
  });

  const result = completion.choices[0].message.content;
  
  if (isJson) {
    return JSON.parse(result || '{}');
  }
  return { result: result?.trim() };
};

/**
 * Build system prompt for refinement
 */
export const buildRefinementPrompt = (instruction: string, content: string | object): string => {
  return REFINEMENT_PROMPT
    .replace('{instruction}', instruction)
    .replace('{content}', typeof content === 'string' ? content : JSON.stringify(content));
};

/**
 * Generate mock response for refinement when no API key available
 */
export const generateMockRefinement = (instruction: string): RefinementResponse => {
  return { 
    result: "AI Key Missing. This is a mock response to: " + instruction 
  };
};
