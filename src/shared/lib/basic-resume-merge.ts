import type {
  BasicEducationEntry,
  BasicExperienceEntry,
  BasicLanguageEntry,
  BasicResumeData,
} from '@/shared/types/basic-resume';
import {
  ANSWER_SCHEMAS,
  isListField,
  type InterviewField,
  type InterviewQuestion,
} from '@/shared/lib/basic-interview-script';

/**
 * Writes one section's answer into the CV, and nothing else.
 *
 * This is the only function in the voice flow that can destroy an answer the
 * user already gave, which is why it is pure, takes exactly one section, and
 * returns a new object rather than mutating. The extraction model never sees
 * the whole CV; this function is what keeps the interests answer from
 * overwriting the education one, and the guarantee is structural rather than a
 * matter of prompting: only the paths the section declares are ever read out of
 * the model's reply, and anything else in it is dropped.
 *
 * `value` is an object keyed by field path. A missing key, a null, an empty
 * string or an empty list leaves that field exactly as it was. That matters on a
 * follow-up: the second answer to a section only re-asks what was missing, so
 * the fields the user already gave must survive a reply that says nothing about
 * them.
 *
 * An unparseable value returns the CV unchanged. That is the correct outcome for
 * both silence and a refusal: on this format an unanswered field renders as
 * absent, and the app must never invent content the user did not say.
 */
export function applyExtractedValue(
  data: BasicResumeData,
  question: InterviewQuestion,
  value: unknown,
  makeId: () => string = () => crypto.randomUUID(),
  options: { appendLists?: boolean } = {}
): BasicResumeData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return data;
  const answer = value as Record<string, unknown>;

  return question.fields.reduce(
    (current, field) => applyField(current, field, answer[field.path], makeId, options.appendLists === true),
    data
  );
}

/** Same entry, ignoring case and spacing -- what "already recorded" means for a list. */
const entryKey = (...parts: string[]) => parts.map((part) => part.trim().toLowerCase()).join('|');

/**
 * Adds `incoming` after `existing`, skipping entries already there.
 *
 * A free conversation gives a list in pieces ("I studied at X in 2015" ... later
 * "I also did a course at Y"), so replacing the list would silently drop the
 * first piece. Entries that repeat what is already recorded are skipped, because
 * people restate things and the model re-reports them.
 */
function appendUnique<T>(existing: T[], incoming: T[], key: (item: T) => string): T[] {
  const seen = new Set(existing.map(key));
  const added = incoming.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return [...existing, ...added];
}

function applyField(
  data: BasicResumeData,
  field: InterviewField,
  value: unknown,
  makeId: () => string,
  append: boolean
): BasicResumeData {
  if (!isListField(field)) {
    const parsed = ANSWER_SCHEMAS.scalar.safeParse(value);
    if (!parsed.success) return data;
    const text = parsed.data.trim();
    return text ? setScalarPath(data, field.path, text) : data;
  }

  switch (field.path) {
    case 'education': {
      const parsed = ANSWER_SCHEMAS.education.safeParse(value);
      if (!parsed.success || parsed.data.length === 0) return data;
      const education: BasicEducationEntry[] = parsed.data.map((entry) => ({
        id: makeId(),
        year: entry.year.trim(),
        detail: entry.detail.trim(),
      }));
      return { ...data, education: append ? appendUnique(data.education, education, (e) => entryKey(e.year, e.detail)) : education };
    }
    case 'experience': {
      const parsed = ANSWER_SCHEMAS.experience.safeParse(value);
      if (!parsed.success || parsed.data.length === 0) return data;
      const experience: BasicExperienceEntry[] = parsed.data.map((entry) => ({
        id: makeId(),
        year: entry.year.trim(),
        detail: entry.detail.trim(),
      }));
      return { ...data, experience: append ? appendUnique(data.experience, experience, (e) => entryKey(e.year, e.detail)) : experience };
    }
    case 'languages': {
      const parsed = ANSWER_SCHEMAS.languages.safeParse(value);
      if (!parsed.success || parsed.data.length === 0) return data;
      const languages: BasicLanguageEntry[] = parsed.data.map((entry) => ({
        id: makeId(),
        name: entry.name.trim(),
        skills: entry.skills.trim(),
      }));
      return { ...data, languages: append ? appendUnique(data.languages, languages, (l) => entryKey(l.name)) : languages };
    }
    case 'interests': {
      const parsed = ANSWER_SCHEMAS.interests.safeParse(value);
      if (!parsed.success) return data;
      const interests = parsed.data.map((item) => item.trim()).filter(Boolean);
      if (interests.length === 0) return data;
      return { ...data, interests: append ? appendUnique(data.interests, interests, (i) => entryKey(i)) : interests };
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

export function isFieldFilled(data: BasicResumeData, field: InterviewField): boolean {
  if (isListField(field)) {
    const list = data[field.path];
    return Array.isArray(list) && list.length > 0;
  }

  const [head, tail] = field.path.split('.');
  if (head === 'contact' && tail) {
    return Boolean((data.contact as unknown as Record<string, string | undefined>)[tail]?.trim());
  }
  if (head === 'personal' && tail) {
    return Boolean((data.personal as unknown as Record<string, string>)[tail]?.trim());
  }
  const scalar = data[head as 'fullName' | 'positionSought' | 'personalStatement'];
  return typeof scalar === 'string' && scalar.trim().length > 0;
}

/**
 * Whether the section holds everything it needs, used to decide follow-ups.
 *
 * Only `required` fields count. The sensitive ones (gender, health, marital
 * status...) are never required, so a section is never re-asked because someone
 * chose not to say them.
 */
export function isQuestionAnswered(data: BasicResumeData, question: InterviewQuestion): boolean {
  return question.fields.filter((field) => field.required).every((field) => isFieldFilled(data, field));
}
