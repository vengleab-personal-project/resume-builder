import { z } from 'zod';
import type enMessages from '@/shared/messages/en';
import type { BasicResumeData } from '@/shared/types/basic-resume';

// The fixed script the voice interview follows. Pure data: no I/O, no model
// call, importable from both client and server.
//
// A hardcoded ordered list -- rather than letting the model decide what to ask
// next -- is what guarantees coverage. The model's only freedom is one
// clarifying follow-up per section (§5.3), so there is no path on which a
// section of the CV is simply never asked about.
//
// Each step is a whole section (about you, school, work and skills, interests)
// rather than one field: a person describes their life in a few breaths, not in
// fifteen separate prompts. The cost of that is that one answer now fills many
// fields, so extraction is scoped to the fields the section declares and the
// merge refuses to write anywhere else.

// ---------------------------------------------------------------------------
// Target paths, proved at compile time
// ---------------------------------------------------------------------------

/**
 * Resolves a dot path against a type, or `never` if it does not exist.
 *
 * This is the load-bearing part of this file. A typo'd field `path` is the worst
 * failure mode the interview has: it does not throw, it silently drops the
 * user's answer into a field nothing reads, and the CV comes out missing a
 * section the user definitely answered. Making the path a checked type rather
 * than a `string` turns that into a compile error -- strictly stronger than the
 * runtime test that would otherwise have to catch it.
 */
type PathValue<T, P extends string> = P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? PathValue<T[Head], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/** Accepts P only if it names a string field of BasicResumeData. */
type ScalarPath<P extends string> = PathValue<BasicResumeData, P> extends string ? P : never;

/** Accepts P only if it names an array field of BasicResumeData. */
type ListPath<P extends string> = PathValue<BasicResumeData, P> extends readonly unknown[]
  ? P
  : never;

export type BasicScalarPath = ScalarPath<
  | 'fullName'
  | 'positionSought'
  | 'contact.phone'
  | 'contact.address'
  | `personal.${keyof BasicResumeData['personal']}`
  | 'personalStatement'
>;

export type BasicListPath = ListPath<'education' | 'experience' | 'languages' | 'interests'>;

export type BasicFieldPath = BasicScalarPath | BasicListPath;

// ---------------------------------------------------------------------------
// Answer schemas
// ---------------------------------------------------------------------------

// What a single field's extraction is allowed to return -- and the whole of
// what it is allowed to return. Extraction is scoped to one section at a time
// and never sees the rest of the CV, which is what stops the interests answer
// rewriting the education one.
//
// Entry `id`s are absent on purpose: they are minted server-side when the
// answer is merged, so a model cannot collide or re-use one.

const yearAndDetail = z.object({
  year: z.string(),
  detail: z.string(),
});

export const ANSWER_SCHEMAS = {
  scalar: z.string(),
  education: z.array(yearAndDetail),
  experience: z.array(yearAndDetail),
  languages: z.array(z.object({ name: z.string(), skills: z.string() })),
  interests: z.array(z.string()),
} as const;

export type BasicAnswerSchemaKey = keyof typeof ANSWER_SCHEMAS;

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/** The i18n keys under the `basicInterview.questions` namespace. */
type InterviewPromptKey = keyof (typeof enMessages)['basicInterview']['questions'];

/**
 * One field a section fills. The path is a checked type. A list field's answer
 * shape is named by its own path -- the list paths and ANSWER_SCHEMAS keys are
 * the same words -- so a field cannot be paired with the wrong shape.
 */
export type InterviewField =
  | { path: BasicScalarPath; required: boolean }
  | { path: BasicListPath; required: boolean };

export interface InterviewQuestion {
  /** Stable key, used as the session's cursor. Never renumber these. */
  id: string;
  /** i18n key, never literal copy -- so EN and KM cannot drift apart. */
  promptKey: InterviewPromptKey;
  /** Everything this one answer is allowed to write. Nothing else is touched. */
  fields: readonly InterviewField[];
  /**
   * A skippable section. Silence, "skip" or an unparseable answer records
   * nothing and moves on -- no follow-up, no second ask.
   */
  optional: boolean;
  /** At most one rephrased re-ask, then advance regardless (§5.3). */
  followUpAllowed: boolean;
}

export function isListField(field: InterviewField): field is { path: BasicListPath; required: boolean } {
  return isListPath(field.path);
}

function isListPath(path: string): path is BasicListPath {
  return path === 'education' || path === 'experience' || path === 'languages' || path === 'interests';
}

/**
 * The four sections, in the order they are asked.
 *
 * Gender, marital status, health, nationality and place of birth are never
 * `required` and are never followed up on. They are conventional in this CV
 * format and they are sensitive personal data; a user's silence is a complete
 * answer and the app must not push for one.
 */
export const BASIC_INTERVIEW_SCRIPT: readonly InterviewQuestion[] = [
  {
    id: 'bio',
    promptKey: 'bio',
    fields: [
      { path: 'fullName', required: true },
      { path: 'positionSought', required: true },
      { path: 'contact.phone', required: true },
      { path: 'contact.address', required: true },
      { path: 'personal.dateOfBirth', required: true },
      { path: 'personal.gender', required: false },
      { path: 'personal.nationality', required: false },
      { path: 'personal.placeOfBirth', required: false },
      { path: 'personal.maritalStatus', required: false },
      { path: 'personal.health', required: false },
    ],
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'education',
    promptKey: 'education',
    fields: [{ path: 'education', required: true }],
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'experience',
    promptKey: 'experience',
    fields: [
      { path: 'experience', required: false },
      { path: 'languages', required: false },
    ],
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'interests',
    promptKey: 'interests',
    fields: [
      { path: 'interests', required: false },
      { path: 'personalStatement', required: false },
    ],
    optional: true,
    followUpAllowed: false,
  },
];

export const BASIC_INTERVIEW_QUESTION_COUNT = BASIC_INTERVIEW_SCRIPT.length;

export function findInterviewQuestion(id: string): InterviewQuestion | undefined {
  return BASIC_INTERVIEW_SCRIPT.find((question) => question.id === id);
}

/**
 * The question after `id`, or null at the end of the script.
 *
 * An unknown id returns the first question rather than throwing: a session row
 * carrying a cursor from an older script version should restart the interview,
 * not make the CV unreachable.
 */
export function nextInterviewQuestion(id: string | null): InterviewQuestion | null {
  if (id === null) return BASIC_INTERVIEW_SCRIPT[0];

  const index = BASIC_INTERVIEW_SCRIPT.findIndex((question) => question.id === id);
  if (index === -1) return BASIC_INTERVIEW_SCRIPT[0];

  return BASIC_INTERVIEW_SCRIPT[index + 1] ?? null;
}

/** 1-based position, for "part N of 4". */
export function interviewQuestionPosition(id: string): number {
  return BASIC_INTERVIEW_SCRIPT.findIndex((question) => question.id === id) + 1;
}
