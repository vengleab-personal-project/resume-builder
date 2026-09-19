import 'server-only';
import { getGeminiModel } from '@/server/modules/ai/clients/gemini';
import { openaiClient, OPENAI_CONFIG } from '@/server/modules/ai/clients/openai';
import type { InterviewQuestion } from '@/shared/lib/basic-interview-script';
import { sanitizePromptInput, validatePromptSafety } from '@/shared/lib/promptGuard';
import type { ResolvedChatModel } from '@/server/modules/ai/registry/types';

/**
 * Turns one spoken answer into one structured value.
 *
 * Scoped to a single question on purpose. The model is never shown the rest of
 * the CV and is never asked to produce more than the one field it was asked
 * about, which is what makes a turn independently testable and stops a late
 * answer corrupting an early one. The caller merges the result through
 * `applyExtractedValue`, which enforces the same boundary structurally.
 */

const SHAPE_INSTRUCTIONS: Record<string, string> = {
  scalar:
    'Return {"value": "<the answer as a plain string>"}. Keep the speaker\'s own words. Do not expand abbreviations, translate, or add detail.',
  education:
    'Return {"value": [{"year": "...", "detail": "..."}]} with one object per school or course mentioned. "year" is the year or range as spoken. "detail" is one short line.',
  experience:
    'Return {"value": [{"year": "...", "detail": "..."}]} with one object per job mentioned. "year" is the year or range as spoken. "detail" is one short line.',
  languages:
    'Return {"value": [{"name": "...", "skills": "..."}]} with one object per language. "skills" is what the speaker said they can do with it, in their own words.',
  interests: 'Return {"value": ["...", "..."]} with one short string per interest mentioned.',
};

function buildPrompt(question: InterviewQuestion, transcript: string, locale: 'en' | 'km'): string {
  return [
    'You are extracting one field of a short CV from a spoken answer.',
    '',
    `The person was asked about: ${question.id}`,
    `They are speaking ${locale === 'km' ? 'Khmer' : 'English'}.`,
    '',
    'Their answer, transcribed:',
    `"""${sanitizePromptInput(transcript)}"""`,
    '',
    SHAPE_INSTRUCTIONS[question.answerSchema] ?? SHAPE_INSTRUCTIONS.scalar,
    '',
    'Rules, in order of importance:',
    '1. Never invent anything. If they did not say it, it does not go in. A CV is a real job application and a fabricated detail is a serious harm.',
    '2. If the answer is silence, refusal, "skip", "I do not know", or is not about what was asked, return {"value": null}.',
    '3. Keep their wording. Tidy filler words and false starts only.',
    '4. Do not translate. Keep the answer in the language it was spoken in.',
    '5. Return only the JSON object, nothing else.',
  ].join('\n');
}

interface ExtractionEnvelope {
  value?: unknown;
}

function parseEnvelope(raw: string): unknown {
  try {
    // Models occasionally fence JSON despite a JSON response mode.
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned) as ExtractionEnvelope;
    return parsed?.value ?? null;
  } catch {
    return null;
  }
}

export async function extractAnswer(
  chatModel: ResolvedChatModel,
  question: InterviewQuestion,
  transcript: string,
  locale: 'en' | 'km'
): Promise<unknown> {
  if (!transcript.trim()) return null;

  // A transcript is user speech reaching a model, so it goes through the same
  // injection guard as pasted resume text.
  const safety = validatePromptSafety(transcript);
  if (!safety.safe) return null;

  const prompt = buildPrompt(question, transcript, locale);

  if (chatModel.provider === 'OPENAI') {
    const completion = await openaiClient.chat.completions.create({
      model: chatModel.modelId,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
    });
    return parseEnvelope(completion.choices[0]?.message?.content ?? '');
  }

  const model = await getGeminiModel(chatModel.modelId, { json: true });
  const result = await model.generateContent(prompt);
  return parseEnvelope(result.response.text());
}
