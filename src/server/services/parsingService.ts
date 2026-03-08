import mammoth from 'mammoth';
import { SYSTEM_PROMPT } from '@/shared/lib/ai-config';
import { AI_CONFIG, FILE_PARSING, API_ERROR_MESSAGES } from '@/shared/config/constants';
import { ResumeData } from '@/shared/types';
import { openaiClient, OPENAI_CONFIG } from '@/server/integrations/openai';
import { getGeminiModel } from '@/server/integrations/gemini';
import { validateTokenLimit, truncateToTokenLimit } from '@/shared/lib/tokenCounter';
import { validatePromptSafety, sanitizePromptInput } from '@/shared/lib/promptGuard';
import { ENV } from '@/shared/config/env';

/**
 * Extract text from uploaded file based on file type
 */
export const extractTextFromFile = async (
  buffer: Buffer, 
  fileType: string
): Promise<string> => {
  if (fileType === FILE_PARSING.SUPPORTED_MIME_TYPES.PDF) {
    try {
      // unpdf is serverless-compatible (no native canvas/DOM dependencies)
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    } catch (e: unknown) {
      console.error("PDF Parse Error:", e);
      throw new Error(API_ERROR_MESSAGES.PDF_PARSING_NOT_SUPPORTED);
    }
  } else if (fileType === FILE_PARSING.SUPPORTED_MIME_TYPES.DOCX) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (fileType === FILE_PARSING.SUPPORTED_MIME_TYPES.TXT) {
    return buffer.toString(FILE_PARSING.ENCODING);
  } else {
    throw new Error(API_ERROR_MESSAGES.UNSUPPORTED_FILE_FORMAT);
  }
};

/**
 * Parse resume text using OpenAI
 */
export const parseResumeWithOpenAI = async (
  rawText: string,
  model: string
): Promise<ResumeData> => {
  const safetyCheck = validatePromptSafety(rawText);
  if (!safetyCheck.safe) {
    throw new Error(`Security validation failed: ${safetyCheck.reason}`);
  }

  const tokenValidation = validateTokenLimit(rawText, ENV.MAX_AI_TOKENS);
  const processedText = tokenValidation.valid 
    ? rawText 
    : truncateToTokenLimit(rawText, ENV.MAX_AI_TOKENS);

  const sanitizedText = sanitizePromptInput(processedText);

  const completion = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Here is the resume text:\n\n${sanitizedText}` }
    ],
    temperature: AI_CONFIG.TEMPERATURE_PARSING,
    response_format: { type: AI_CONFIG.RESPONSE_FORMAT_JSON },
    max_tokens: OPENAI_CONFIG.MAX_TOKENS,
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error(API_ERROR_MESSAGES.NO_CONTENT_FROM_AI);

  return JSON.parse(content);
};

/**
 * Parse resume text using Gemini
 */
export const parseResumeWithGemini = async (
  rawText: string,
  model: string
): Promise<ResumeData> => {
  const safetyCheck = validatePromptSafety(rawText);
  if (!safetyCheck.safe) {
    throw new Error(`Security validation failed: ${safetyCheck.reason}`);
  }

  const tokenValidation = validateTokenLimit(rawText, ENV.MAX_AI_TOKENS);
  const processedText = tokenValidation.valid 
    ? rawText 
    : truncateToTokenLimit(rawText, ENV.MAX_AI_TOKENS);

  const sanitizedText = sanitizePromptInput(processedText);

  const geminiModel = getGeminiModel(model);
  const prompt = `${SYSTEM_PROMPT}\n\nHere is the resume text:\n\n${sanitizedText}`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: AI_CONFIG.TEMPERATURE_PARSING,
      responseMimeType: "application/json",
      maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
    },
  });

  const response = await result.response;
  let text = response.text();
  
  // Clean up potential markdown blocks if they exist even with application/json mime type
  if (text.includes('```json')) {
    text = text.split('```json')[1].split('```')[0].trim();
  } else if (text.includes('```')) {
    text = text.split('```')[1].split('```')[0].trim();
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed.error) {
      throw new Error(`AI processing error: ${parsed.error}`);
    }
    return parsed;
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes('AI processing error')) throw e;
    console.error("Failed to parse Gemini JSON response. Text received:", text);
    console.error("Parse error:", error.message);
    throw new Error("Failed to parse the resume data. The content might be truncated or invalid.");
  }
};

/**
 * Generate mock response when no API key is available
 */
export const generateMockResponse = (text: string): ResumeData => {
  return {
    personalInfo: {
      name: "Mock User (AI Key Missing)",
      title: "Software Engineer",
      email: "mock@example.com",
      phone: "123-456-7890",
      address: "Mock City, MK",
    },
    summary: "This is a mock summary because API key was not found. " + text.slice(0, 50) + "...",
    education: [],
    experience: [],
    skills: ["Mock Skill 1", "Mock Skill 2"],
    certifications: [],
    publications: [],
    volunteering: [],
    languages: [],
    otherTraining: [],
    references: [],
  };
};
