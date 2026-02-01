import { ENV } from '@/config/env';
import { 
  AI_PROVIDERS, 
  DEFAULT_AI_CONFIG, 
  API_ERROR_MESSAGES 
} from '@/config/constants';
import { 
  extractTextFromFile, 
  parseResumeWithOpenAI, 
  parseResumeWithGemini,
  generateMockResponse 
} from '@/services/parsingService';
import { ResumeData } from '@/types';

interface ParseResumeRequest {
  file: File | null;
  text: string | null;
  provider: string;
  model: string;
}

/**
 * Orchestrate the resume parsing process
 */
export const orchestrateResumeParsing = async (
  request: ParseResumeRequest
): Promise<ResumeData> => {
  const { file, text, provider, model } = request;

  let rawText = '';
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    rawText = await extractTextFromFile(buffer, file.type);
  } else if (text) {
    rawText = text;
  } else {
    throw new Error(API_ERROR_MESSAGES.NO_FILE_UPLOADED);
  }

  // Parse with AI
  if (provider === AI_PROVIDERS.GOOGLE) {
    if (!ENV.GEMINI_API_KEY) {
      throw new Error(API_ERROR_MESSAGES.GEMINI_API_KEY_NOT_SET);
    }
    return await parseResumeWithGemini(rawText, model);
  } else {
    if (!ENV.OPENAI_API_KEY) {
      console.warn(API_ERROR_MESSAGES.OPENAI_API_KEY_NOT_SET);
      return generateMockResponse(rawText);
    }
    return await parseResumeWithOpenAI(rawText, model);
  }
};
