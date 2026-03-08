import { REFINEMENT_PROMPT } from '@/shared/lib/ai-config';
import { AI_CONFIG } from '@/shared/config/constants';
import { openaiClient, OPENAI_CONFIG } from '@/server/integrations/openai';
import { geminiModel, geminiTextModel } from '@/server/integrations/gemini';
import { validateTokenLimit, truncateToTokenLimit } from '@/shared/lib/tokenCounter';
import { validatePromptSafety, sanitizePromptInput } from '@/shared/lib/promptGuard';
import { ENV } from '@/shared/config/env';

interface RefinementRequest {
  instruction: string;
  content: string | object;
  schema?: any;
}

interface RefinementResponse {
  result?: string;
  [key: string]: any;
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, providerName: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${providerName} request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

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

  console.log(`Gemini Request: isJson=${isJson}`);
  const model = isJson ? geminiModel : geminiTextModel;
  const prompt = `${sanitizedPrompt}\n\n${
    isJson 
      ? `Refine/Generate and return as JSON matching this schema: ${JSON.stringify(schema)}` 
      : "Refine the content directly."
  }`;

  const startTime = Date.now();
  const result = await withTimeout(model.generateContent(prompt), 60000, "Gemini");
  const response = await result.response;
  const text = response.text();
  console.log(`Gemini Response received in ${Date.now() - startTime}ms`);

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

  console.log(`OpenAI Request: isJson=${isJson}`);
  const startTime = Date.now();
  const completion = await withTimeout(openaiClient.chat.completions.create({
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
  }), 30000, "OpenAI");

  const result = completion.choices[0].message.content;
  console.log(`OpenAI Response received in ${Date.now() - startTime}ms`);
  
  if (isJson) {
    try {
      const parsed = JSON.parse(result || '{}');
      if (schema && typeof schema === 'object') {
        const schemaObj = schema as any;
        if (schemaObj.type === 'array' && !Array.isArray(parsed)) {
          return { items: [parsed] };
        }
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse OpenAI JSON response:", result);
      throw new Error("Failed to process the AI response.");
    }
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
