import 'server-only';
import { getGenAiClient } from '@/server/modules/ai/clients/gemini-voice';
import { openaiClient, OPENAI_CONFIG } from '@/server/modules/ai/clients/openai';
import { isChatModelAllowed } from '@/server/modules/ai/registry';
import type { ResolvedChatModel } from '@/server/modules/ai/registry/types';
import {
  isListField,
  type BasicFieldPath,
  type BasicListPath,
  type InterviewField,
} from '@/shared/lib/basic-interview-script';
import { FIELD_TOPICS, FREE_FORM_QUESTION } from '@/shared/lib/basic-interview-topics';
import { sanitizePromptInput, validatePromptSafety } from '@/shared/lib/promptGuard';
import { AI_CONFIG } from '@/shared/config/constants';

/**
 * Turns a whole conversation into a structured CV, once, after the call.
 *
 * The live model runs the conversation and writes nothing. Everything it learned
 * is read back out of the transcript here, in one pass, with the full context a
 * per-answer extraction never has: a name corrected later, a list given in
 * pieces, a hobby mentioned while talking about school. The model is held to a
 * response schema rather than asked nicely for JSON, so every call returns the
 * same keys with the same types, and the merge (`applyExtractedValue`) is still
 * the only thing that writes -- it drops any key the schema did not declare.
 */

export interface DialogueEntry {
  role: 'interviewer' | 'person';
  text: string;
}

/** `ok: false` is "the model could not be reached"; `value: null` is "nothing usable was said". */
export type ConsolidationResult =
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false };

// Schema property names are not paths. Providers restrict the characters in a
// property name (OpenAI's strict mode in particular), and a dot is not safe, so
// the wire keys are flattened and mapped back to paths afterwards.
const toKey = (path: BasicFieldPath): string => path.replace('.', '__');

const text = (description: string) => ({ type: 'string', description });

const LIST_ITEMS: Record<BasicListPath, Record<string, unknown>> = {
  education: {
    type: 'object',
    additionalProperties: false,
    properties: {
      year: text('The year or range as spoken, e.g. "2015" or "2016 - present". Empty if not said.'),
      detail: text('One short line, e.g. "Finished high school".'),
    },
    required: ['year', 'detail'],
  },
  experience: {
    type: 'object',
    additionalProperties: false,
    properties: {
      year: text('The year or range as spoken. Empty if not said.'),
      detail: text('One short line, e.g. "Cleaner at a hotel in Siem Reap".'),
    },
    required: ['year', 'detail'],
  },
  languages: {
    type: 'object',
    additionalProperties: false,
    properties: {
      name: text('The language.'),
      skills: text('What they said they can do with it (speak, listen, read, translate), in their own words.'),
    },
    required: ['name', 'skills'],
  },
  interests: { type: 'string', description: 'One interest or hobby.' },
};

function propertyFor(field: InterviewField): Record<string, unknown> {
  const topic = FIELD_TOPICS[field.path].ask;
  if (isListField(field)) {
    return { type: 'array', description: `A list: ${topic}. Empty if not said.`, items: LIST_ITEMS[field.path] };
  }
  return text(`${topic}. Empty string if the Person did not say it.`);
}

// Every field is `required` so the answer is always complete and shaped the
// same; "not said" is an empty string or empty list, never a missing key.
const CONSOLIDATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(FREE_FORM_QUESTION.fields.map((field) => [toKey(field.path), propertyFor(field)])),
  required: FREE_FORM_QUESTION.fields.map((field) => toKey(field.path)),
} as const;

function buildPrompt(dialogue: DialogueEntry[], locale: 'en' | 'km'): string {
  const transcript = dialogue
    .filter((entry) => entry.text.trim())
    .map((entry) => `${entry.role === 'interviewer' ? 'Interviewer' : 'Person'}: ${sanitizePromptInput(entry.text)}`)
    .join('\n');

  return [
    'You are filling in a short CV from a recorded interview.',
    `The Person is speaking ${locale === 'km' ? 'Khmer' : 'English'}.`,
    '',
    'The conversation, transcribed automatically (it may contain mishearings of names):',
    `"""${transcript}"""`,
    '',
    'Rules, in order of importance:',
    '1. Use ONLY what the Person said. The Interviewer\'s words are context, not facts about the Person. A CV is a real job application and a fabricated detail is a serious harm.',
    '2. If the Person did not say something, leave it empty (an empty string or an empty list). Never guess, infer or fill in a likely value.',
    '3. If the Person corrected themselves, the latest version wins.',
    '4. Put each fact under the field it belongs to, even if it came up while talking about something else.',
    '5. Keep the Person\'s own wording and language. Do not translate. Tidy filler words and false starts only.',
    '6. Date of birth: write DD/MM/YYYY only if the day, month and year were all said; otherwise keep exactly what was said.',
    '7. Personal details (gender, nationality, place of birth, marital status, health) only if the Person actually said them.',
  ].join('\n');
}

/** Wire keys back to field paths, so the result is exactly what the merge expects. */
function fromWire(parsed: unknown): Record<string, unknown> | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const wire = parsed as Record<string, unknown>;
  return Object.fromEntries(FREE_FORM_QUESTION.fields.map((field) => [field.path, wire[toKey(field.path)]]));
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
  } catch {
    return null;
  }
}

// Overload and rate-limit errors are momentary, and this call happens once, at
// the end of a conversation the person has just finished: failing the whole
// interview on a transient spike would be the worst possible moment. One quick
// retry covers the common case; anything else still surfaces as `ok: false` and
// the client offers a retry with the transcript intact.
const TRANSIENT_RETRY_DELAY_MS = 1500;

function isTransient(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) return true;
  const message = error instanceof Error ? error.message : '';
  return /\b(429|503|UNAVAILABLE|high demand|overloaded)\b/i.test(message);
}

async function withOneRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isTransient(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, TRANSIENT_RETRY_DELAY_MS));
    return run();
  }
}

export async function consolidateConversation(
  chatModel: ResolvedChatModel,
  dialogue: DialogueEntry[],
  locale: 'en' | 'km'
): Promise<ConsolidationResult> {
  const spoken = dialogue.filter((entry) => entry.role === 'person' && entry.text.trim());
  if (spoken.length === 0) return { ok: true, value: null };

  // The person's own words reach a model, so they pass the same injection guard
  // as pasted resume text.
  const safety = validatePromptSafety(spoken.map((entry) => entry.text).join('\n'));
  if (!safety.safe) return { ok: true, value: null };

  const prompt = buildPrompt(dialogue, locale);

  try {
    if (chatModel.provider === 'OPENAI') {
      const completion = await withOneRetry(() =>
        openaiClient.chat.completions.create({
          model: chatModel.modelId,
          messages: [{ role: 'user', content: prompt }],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'basic_cv', strict: true, schema: CONSOLIDATION_SCHEMA as unknown as Record<string, unknown> },
          },
          max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        })
      );
      return { ok: true, value: fromWire(parseJson(completion.choices[0]?.message?.content ?? '')) };
    }

    // Same allow-list the other Gemini calls pass through: an admin-managed model
    // table, not a constant, decides what may run.
    if (!(await isChatModelAllowed(chatModel.modelId, 'GOOGLE'))) {
      throw new Error(`Model ${chatModel.modelId} is not allowed`);
    }
    const response = await withOneRetry(() =>
      getGenAiClient().models.generateContent({
        model: chatModel.modelId,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: CONSOLIDATION_SCHEMA,
          // Extraction, not writing: the same transcript should give the same CV.
          temperature: 0,
          maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
        },
      })
    );
    return { ok: true, value: fromWire(parseJson(response.text ?? '')) };
  } catch (error) {
    // The message only, never the prompt: the prompt carries the transcript.
    console.error(
      'Interview consolidation unavailable:',
      error instanceof Error ? error.message : 'unknown'
    );
    return { ok: false };
  }
}
