import OpenAI from 'openai';
import { serverEnv } from '@/server/config/env.server';
import { AI_CONFIG } from '@/shared/config/constants';

export const openaiClient = new OpenAI({
  apiKey: serverEnv.OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: false,
});

export const OPENAI_CONFIG = {
  MAX_TOKENS: AI_CONFIG.MAX_OUTPUT_TOKENS,
} as const;
