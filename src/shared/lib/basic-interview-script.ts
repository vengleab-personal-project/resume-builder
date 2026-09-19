import { z } from 'zod';
import type enMessages from '@/shared/messages/en';
import type { BasicResumeData } from '@/shared/types/basic-resume';

// The fixed question script the voice interview follows. Pure data: no I/O, no
// model call, importable from both client and server.
//
// A hardcoded ordered list -- rather than letting the model decide what to ask
// next -- is what guarantees coverage. The model's only freedom is one
// clarifying follow-up per question (§5.3), so there is no path on which a
// section of the CV is simply never asked about.

// ---------------------------------------------------------------------------
// Target paths, proved at compile time
// ---------------------------------------------------------------------------

/**
 * Resolves a dot path against a type, or `never` if it does not exist.
 *
 * This is the load-bearing part of this file. A typo'd `targetPath` is the worst
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

// ---------------------------------------------------------------------------
// Answer schemas
// ---------------------------------------------------------------------------

// What a single question's extraction is allowed to return -- and the whole of
// what it is allowed to return. Extraction is scoped to one question at a time
// and never sees the rest of the CV, which is what stops question 12 rewriting
// question 3's answer.
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
// Questions
// ---------------------------------------------------------------------------

/** The i18n keys under the `basicInterview.questions` namespace. */
type InterviewPromptKey = keyof (typeof enMessages)['basicInterview']['questions'];

interface InterviewQuestionBase {
  /** Stable key, used as the session's cursor. Never renumber these. */
  id: string;
  /** i18n key, never literal copy -- so EN and KM cannot drift apart. */
  promptKey: InterviewPromptKey;
  /** Which answer shape extraction must return for this question. */
  answerSchema: BasicAnswerSchemaKey;
  /**
   * A skippable question. Silence, "skip" or an unparseable answer records
   * empty and moves on -- no follow-up, no second ask.
   */
  optional: boolean;
  /** At most one rephrased re-ask, then advance regardless (§5.3). */
  followUpAllowed: boolean;
}

export interface ScalarInterviewQuestion extends InterviewQuestionBase {
  kind: 'scalar';
  targetPath: BasicScalarPath;
  answerSchema: 'scalar';
}

export interface ListInterviewQuestion extends InterviewQuestionBase {
  kind: 'list';
  targetPath: BasicListPath;
  answerSchema: Exclude<BasicAnswerSchemaKey, 'scalar'>;
}

export type InterviewQuestion = ScalarInterviewQuestion | ListInterviewQuestion;

/**
 * The 15 questions, in the order they are asked.
 *
 * Gender, marital status, health, nationality and place of birth are marked
 * optional and are never followed up on. They are conventional in this CV
 * format and they are sensitive personal data; a user's silence is a complete
 * answer and the app must not push for one.
 */
export const BASIC_INTERVIEW_SCRIPT: readonly InterviewQuestion[] = [
  {
    id: 'fullName',
    targetPath: 'fullName',
    kind: 'scalar',
    promptKey: 'fullName',
    answerSchema: 'scalar',
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'positionSought',
    targetPath: 'positionSought',
    kind: 'scalar',
    promptKey: 'positionSought',
    answerSchema: 'scalar',
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'contact.phone',
    targetPath: 'contact.phone',
    kind: 'scalar',
    promptKey: 'phone',
    answerSchema: 'scalar',
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'contact.address',
    targetPath: 'contact.address',
    kind: 'scalar',
    promptKey: 'address',
    answerSchema: 'scalar',
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'personal.dateOfBirth',
    targetPath: 'personal.dateOfBirth',
    kind: 'scalar',
    promptKey: 'dateOfBirth',
    answerSchema: 'scalar',
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'personal.gender',
    targetPath: 'personal.gender',
    kind: 'scalar',
    promptKey: 'gender',
    answerSchema: 'scalar',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'personal.nationality',
    targetPath: 'personal.nationality',
    kind: 'scalar',
    promptKey: 'nationality',
    answerSchema: 'scalar',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'personal.placeOfBirth',
    targetPath: 'personal.placeOfBirth',
    kind: 'scalar',
    promptKey: 'placeOfBirth',
    answerSchema: 'scalar',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'personal.maritalStatus',
    targetPath: 'personal.maritalStatus',
    kind: 'scalar',
    promptKey: 'maritalStatus',
    answerSchema: 'scalar',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'personal.health',
    targetPath: 'personal.health',
    kind: 'scalar',
    promptKey: 'health',
    answerSchema: 'scalar',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'education',
    targetPath: 'education',
    kind: 'list',
    promptKey: 'education',
    answerSchema: 'education',
    optional: false,
    followUpAllowed: true,
  },
  {
    id: 'experience',
    targetPath: 'experience',
    kind: 'list',
    promptKey: 'experience',
    answerSchema: 'experience',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'languages',
    targetPath: 'languages',
    kind: 'list',
    promptKey: 'languages',
    answerSchema: 'languages',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'interests',
    targetPath: 'interests',
    kind: 'list',
    promptKey: 'interests',
    answerSchema: 'interests',
    optional: true,
    followUpAllowed: false,
  },
  {
    id: 'personalStatement',
    targetPath: 'personalStatement',
    kind: 'scalar',
    promptKey: 'personalStatement',
    answerSchema: 'scalar',
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

/** 1-based position, for "step N of 15". */
export function interviewQuestionPosition(id: string): number {
  return BASIC_INTERVIEW_SCRIPT.findIndex((question) => question.id === id) + 1;
}
