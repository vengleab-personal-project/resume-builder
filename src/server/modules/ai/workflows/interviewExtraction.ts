import 'server-only';
import { getGeminiModel } from '@/server/modules/ai/clients/gemini';
import { openaiClient, OPENAI_CONFIG } from '@/server/modules/ai/clients/openai';
import {
  isListField,
  type BasicListPath,
  type BasicScalarPath,
  type InterviewField,
  type InterviewQuestion,
} from '@/shared/lib/basic-interview-script';
import { sanitizePromptInput, validatePromptSafety } from '@/shared/lib/promptGuard';
import type { ResolvedChatModel } from '@/server/modules/ai/registry/types';

/**
 * Turns one spoken answer into structured values for one section.
 *
 * Scoped to a single section on purpose. The model is never shown the rest of
 * the CV and is only asked about the fields that section declares, which is what
 * makes a turn independently testable and stops a late answer corrupting an
 * early one. The caller merges the result through `applyExtractedValue`, which
 * enforces the same boundary structurally: a key the section did not declare is
 * dropped there, whatever the model returned.
 */

// What each field means, in plain words for the model. Exhaustive on purpose: a
// field added to the CV type and the script without a hint here is a compile
// error rather than a field the model has to guess at.
const SCALAR_HINTS: Record<BasicScalarPath, string> = {
  fullName: 'their full name',
  positionSought: 'the job or kind of work they are applying for',
  'contact.phone': 'their phone number, digits as spoken',
  'contact.address': 'where they live (village, commune, district, province) as spoken',
  'personal.dateOfBirth': 'their date of birth as spoken; normalise to DD/MM/YYYY only if day, month and year were all said',
  'personal.gender': 'their gender, only if they said it',
  'personal.nationality': 'their nationality, only if they said it',
  'personal.placeOfBirth': 'where they were born, only if they said it',
  'personal.maritalStatus': 'whether they are single or married, only if they said it',
  'personal.health': 'their health, only if they said it',
  personalStatement: 'how they describe themselves as a worker, in their own words',
};

const LIST_SHAPES: Record<BasicListPath, string> = {
  education:
    'an array of {"year": "...", "detail": "..."}, one per school or course mentioned. "year" is the year or range as spoken, "detail" is one short line',
  experience:
    'an array of {"year": "...", "detail": "..."}, one per job mentioned. "year" is the year or range as spoken, "detail" is one short line',
  languages:
    'an array of {"name": "...", "skills": "..."}, one per language. "skills" is what they said they can do with it, in their own words',
  interests: 'an array of short strings, one per interest or hobby mentioned',
};

function describeField(field: InterviewField): string {
  return isListField(field)
    ? `  "${field.path}": ${LIST_SHAPES[field.path]}`
    : `  "${field.path}": ${SCALAR_HINTS[field.path]} (a plain string)`;
}

function buildPrompt(question: InterviewQuestion, transcript: string, locale: 'en' | 'km'): string {
  return [
    'You are extracting fields of a short CV from one spoken answer.',
    '',
    `The person was asked about: ${question.id}`,
    `They are speaking ${locale === 'km' ? 'Khmer' : 'English'}.`,
    '',
    'Their answer, transcribed:',
    `"""${sanitizePromptInput(transcript)}"""`,
    '',
    'Return {"value": {...}} where the object has exactly these keys, and no others:',
    ...question.fields.map(describeField),
    '',
    'Rules, in order of importance:',
    '1. Never invent anything. If they did not say it, it does not go in. A CV is a real job application and a fabricated detail is a serious harm.',
    '2. For any key they did not mention, use null. Do not guess it from another key and do not leave a default.',
    '3. If the answer is silence, refusal, "skip", "I do not know", or is not about what was asked, return {"value": null}.',
    '4. Keep their wording. Tidy filler words and false starts only.',
    '5. Do not translate. Keep each answer in the language it was spoken in.',
    '6. Return only the JSON object, nothing else.',
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

/**
 * `ok: false` means the model could not be reached at all -- no key, an outage,
 * a depleted quota. It is reported rather than collapsed into "no answer",
 * because the two need opposite handling: no answer means move on, unreachable
 * means fall back to the user's own words. Silently treating an outage as a
 * non-answer would charge a user for an interview and hand them an empty CV.
 */
export type ExtractionResult = { ok: true; value: unknown } | { ok: false };

export async function extractAnswer(
  chatModel: ResolvedChatModel,
  question: InterviewQuestion,
  transcript: string,
  locale: 'en' | 'km'
): Promise<ExtractionResult> {
  if (!transcript.trim()) return { ok: true, value: null };

  // A transcript is user speech reaching a model, so it goes through the same
  // injection guard as pasted resume text.
  const safety = validatePromptSafety(transcript);
  if (!safety.safe) return { ok: true, value: null };

  const prompt = buildPrompt(question, transcript, locale);

  try {
    if (chatModel.provider === 'OPENAI') {
      const completion = await openaiClient.chat.completions.create({
        model: chatModel.modelId,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      });
      return { ok: true, value: parseEnvelope(completion.choices[0]?.message?.content ?? '') };
    }

    const model = await getGeminiModel(chatModel.modelId, { json: true });
    const result = await model.generateContent(prompt);
    return { ok: true, value: parseEnvelope(result.response.text()) };
  } catch (error) {
    // The message only, never the prompt: the prompt carries the transcript.
    console.error(
      'Interview extraction unavailable:',
      error instanceof Error ? error.message : 'unknown'
    );
    return { ok: false };
  }
}

/**
 * What to record when the model is unreachable.
 *
 * Deterministic parsing of what the user actually said -- never a guess, never
 * an addition. A CV is a real job application, so the rule is that an outage may
 * cost structure but must never put words in their mouth.
 *
 * A section holds many fields and one run of speech cannot be split between them
 * without understanding it, so only what is mechanically recognisable is filled:
 * a phone number, a full date, a year, a comma-separated list. Names, addresses
 * and job titles are left for the user, who is told the answer was not tidied and
 * can type them. Filling them by guesswork would be the fabrication this rule
 * forbids.
 */
export function fallbackExtraction(question: InterviewQuestion, transcript: string): unknown {
  const text = transcript.trim();
  if (!text) return null;

  const result: Record<string, unknown> = {};

  for (const field of question.fields) {
    switch (field.path) {
      case 'contact.phone': {
        const phone = /\+?\d[\d\s-]{6,}\d/.exec(text)?.[0]?.trim();
        if (phone) result[field.path] = phone;
        break;
      }
      case 'personal.dateOfBirth': {
        const date = /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/.exec(text)?.[0];
        if (date) result[field.path] = date;
        break;
      }
      case 'education':
      case 'experience': {
        // A four-digit year, if one was said, becomes the year column; everything
        // else stays as the line. Splitting on a literal year is parsing, not
        // interpretation. Experience shares a section with languages, which cannot
        // be told apart from it, so the whole answer is kept as the one entry.
        const year = /\b(19|20)\d{2}\b/.exec(text)?.[0] ?? '';
        const detail = year ? text.replace(year, '').replace(/^[\s,:.-]+/, '').trim() : text;
        result[field.path] = [{ year, detail: detail || text }];
        break;
      }
      case 'interests': {
        // Only when the section is not also asking for a free-text statement,
        // otherwise the whole answer would be filed as a list of hobbies.
        if (question.fields.some((f) => f.path === 'personalStatement')) break;
        result[field.path] = text
          .split(/[,;]|\band\b/i)
          .map((item) => item.trim())
          .filter(Boolean);
        break;
      }
      default:
        break;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}
