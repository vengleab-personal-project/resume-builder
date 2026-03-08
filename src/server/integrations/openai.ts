import OpenAI from 'openai';
import { ENV } from '@/shared/config/env';
import { AI_CONFIG } from '@/shared/config/constants';

export const openaiClient = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: false,
});

export const OPENAI_CONFIG = {
  MAX_TOKENS: AI_CONFIG.MAX_OUTPUT_TOKENS,
} as const;
