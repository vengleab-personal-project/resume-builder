import {
  BASIC_INTERVIEW_SCRIPT,
  type BasicFieldPath,
  type InterviewField,
  type InterviewQuestion,
} from '@/shared/lib/basic-interview-script';
import { isFieldFilled } from '@/shared/lib/basic-resume-merge';
import type { BasicResumeData } from '@/shared/types/basic-resume';

// The free-conversation view of the same script. Pure data and pure functions,
// importable from both client and server.
//
// The structured interview asks section by section and so guarantees coverage by
// order. A live conversation has no order, so coverage is guaranteed the other
// way round: after every answer the SERVER works out which fields are still
// empty, and the model is told. The model chooses how and when to ask; it cannot
// decide the CV is complete -- `missingTopics` can.

/**
 * What each field is, in plain words for the model to ask about. Exhaustive on
 * purpose: a field added to the CV type without a topic here is a compile error,
 * rather than something the conversation silently never asks.
 *
 * `sensitive` marks the details this CV format conventionally carries but which
 * are personal. They are never required and the model is told to ask once,
 * gently, and never press.
 */
export const FIELD_TOPICS: Record<BasicFieldPath, { ask: string; sensitive?: boolean }> = {
  fullName: { ask: 'their full name' },
  positionSought: { ask: 'the job or kind of work they are applying for' },
  'contact.phone': { ask: 'their phone number' },
  'contact.address': { ask: 'where they live (village, commune, district, province)' },
  'personal.dateOfBirth': { ask: 'their date of birth' },
  'personal.gender': { ask: 'their gender', sensitive: true },
  'personal.nationality': { ask: 'their nationality', sensitive: true },
  'personal.placeOfBirth': { ask: 'where they were born', sensitive: true },
  'personal.maritalStatus': { ask: 'whether they are single or married', sensitive: true },
  'personal.health': { ask: 'how their health is', sensitive: true },
  education: { ask: 'their education: each school or course, with the year' },
  experience: { ask: 'their work experience: each job, with the year' },
  languages: { ask: 'the languages they speak, and what they can do in each (speak, listen, read, translate)' },
  interests: { ask: 'what they like to do in their free time' },
  personalStatement: { ask: 'how they would describe themselves as a worker' },
};

export const FREE_FORM_QUESTION_ID = 'free';

const ALL_FIELDS: readonly InterviewField[] = BASIC_INTERVIEW_SCRIPT.flatMap((question) => question.fields);

/**
 * One pseudo-question covering every field, so a single answer in a free
 * conversation can fill whatever it happens to mention and nothing else.
 * `promptKey` is never used to speak -- nothing prompts from this -- it only
 * satisfies the type.
 */
export const FREE_FORM_QUESTION: InterviewQuestion = {
  id: FREE_FORM_QUESTION_ID,
  promptKey: 'bio',
  fields: ALL_FIELDS,
  optional: true,
  followUpAllowed: false,
};

export const BASIC_TOPIC_COUNT = ALL_FIELDS.length;

export interface MissingTopic {
  path: BasicFieldPath;
  ask: string;
  sensitive: boolean;
}

function topicFor(field: InterviewField): MissingTopic {
  const topic = FIELD_TOPICS[field.path];
  return { path: field.path, ask: topic.ask, sensitive: topic.sensitive === true };
}

/** What the CV still lacks: `required` blocks finishing, `optional` is offered once. */
export function missingTopics(data: BasicResumeData): { required: MissingTopic[]; optional: MissingTopic[] } {
  const empty = ALL_FIELDS.filter((field) => !isFieldFilled(data, field));
  return {
    required: empty.filter((field) => field.required).map(topicFor),
    optional: empty.filter((field) => !field.required).map(topicFor),
  };
}

export function countFilledTopics(data: BasicResumeData): number {
  return ALL_FIELDS.filter((field) => isFieldFilled(data, field)).length;
}
