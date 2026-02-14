import mammoth from 'mammoth';
import { SYSTEM_PROMPT } from '@/lib/ai-config';
import { AI_PROVIDERS, AI_CONFIG, FILE_PARSING, API_ERROR_MESSAGES } from '@/config/constants';
import { AIConfig, ResumeData } from '@/types';
import { openaiClient } from '@/integrations/openai';
import { getGeminiModel } from '@/integrations/gemini';

/**
 * Extract text from uploaded file based on file type
 */
export const extractTextFromFile = async (
  buffer: Buffer, 
  fileType: string
): Promise<string> => {
  if (fileType === FILE_PARSING.SUPPORTED_MIME_TYPES.PDF) {
    try {
      // Dynamic import of pdf-parse for Next.js compatibility
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text;
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
  const completion = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Here is the resume text:\n\n${rawText}` }
    ],
    temperature: AI_CONFIG.TEMPERATURE_PARSING,
    response_format: { type: AI_CONFIG.RESPONSE_FORMAT_JSON }
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
  const geminiModel = getGeminiModel(model);
  const prompt = `${SYSTEM_PROMPT}\n\nHere is the resume text:\n\n${rawText}`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: AI_CONFIG.TEMPERATURE_PARSING,
      responseMimeType: "application/json",
    },
  });

  const response = await result.response;
  const text = response.text();
  return JSON.parse(text);
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
