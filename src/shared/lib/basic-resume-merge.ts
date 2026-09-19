import type {
  BasicEducationEntry,
  BasicExperienceEntry,
  BasicLanguageEntry,
  BasicResumeData,
} from '@/shared/types/basic-resume';
import { ANSWER_SCHEMAS, type InterviewQuestion } from '@/shared/lib/basic-interview-script';

/**
 * Writes one question's answer into the CV, and nothing else.
 *
 * This is the only function in the voice flow that can destroy an answer the
 * user already gave, which is why it is pure, takes exactly one question, and
 * returns a new object rather than mutating. The extraction model never sees
 * the whole CV; this function is what keeps question 12 from overwriting
 * question 3, and the guarantee is structural rather than a matter of prompting.
 *
 * An unparseable value returns the CV unchanged. That is the correct outcome for
 * both silence and a refusal: on this format an unanswered field renders as
 * absent, and the app must never invent content the user did not say.
 */
export function applyExtractedValue(
  data: BasicResumeData,
  question: InterviewQuestion,
  value: unknown,
  makeId: () => string = () => crypto.randomUUID()
): BasicResumeData {
  if (question.kind === 'scalar') {
    const parsed = ANSWER_SCHEMAS.scalar.safeParse(value);
    if (!parsed.success) return data;
    return setScalarPath(data, question.targetPath, parsed.data.trim());
  }

  switch (question.answerSchema) {
    case 'education': {
      const parsed = ANSWER_SCHEMAS.education.safeParse(value);
      if (!parsed.success) return data;
      const education: BasicEducationEntry[] = parsed.data.map((entry) => ({
        id: makeId(),
        year: entry.year.trim(),
        detail: entry.detail.trim(),
      }));
      return { ...data, education };
    }
    case 'experience': {
      const parsed = ANSWER_SCHEMAS.experience.safeParse(value);
      if (!parsed.success) return data;
      const experience: BasicExperienceEntry[] = parsed.data.map((entry) => ({
        id: makeId(),
        year: entry.year.trim(),
        detail: entry.detail.trim(),
      }));
      return { ...data, experience };
    }
    case 'languages': {
      const parsed = ANSWER_SCHEMAS.languages.safeParse(value);
      if (!parsed.success) return data;
      const languages: BasicLanguageEntry[] = parsed.data.map((entry) => ({
        id: makeId(),
        name: entry.name.trim(),
        skills: entry.skills.trim(),
      }));
      return { ...data, languages };
    }
    case 'interests': {
      const parsed = ANSWER_SCHEMAS.interests.safeParse(value);
      if (!parsed.success) return data;
      return { ...data, interests: parsed.data.map((item) => item.trim()).filter(Boolean) };
    }
    default:
      return data;
  }
}

/**
 * Sets one dot path, at most two levels deep, which is the whole depth of
 * BasicResumeData. A generic deep-setter would be more code and would accept
 * paths the type system has already ruled out.
 */
function setScalarPath(data: BasicResumeData, path: string, value: string): BasicResumeData {
  const [head, tail] = path.split('.');

  if (head === 'contact' && tail) {
    return { ...data, contact: { ...data.contact, [tail]: value } };
  }
  if (head === 'personal' && tail) {
    return { ...data, personal: { ...data.personal, [tail]: value } };
  }
  if (head === 'fullName' || head === 'positionSought' || head === 'personalStatement') {
    return { ...data, [head]: value };
  }
  // Unreachable from BASIC_INTERVIEW_SCRIPT, whose paths are compile-checked.
  // Returning the CV untouched is the only safe response to a path that somehow
  // got past that.
  return data;
}

/** Whether a question's target now holds anything, used to decide follow-ups. */
export function isQuestionAnswered(data: BasicResumeData, question: InterviewQuestion): boolean {
  if (question.kind === 'list') {
    const list = data[question.targetPath];
    return Array.isArray(list) && list.length > 0;
  }

  const [head, tail] = question.targetPath.split('.');
  if (head === 'contact' && tail) {
    return Boolean((data.contact as unknown as Record<string, string | undefined>)[tail]?.trim());
  }
  if (head === 'personal' && tail) {
    return Boolean((data.personal as unknown as Record<string, string>)[tail]?.trim());
  }
  const scalar = data[head as 'fullName' | 'positionSought' | 'personalStatement'];
  return typeof scalar === 'string' && scalar.trim().length > 0;
}
