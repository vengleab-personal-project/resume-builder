import type {
  BasicEducationEntry,
  BasicExperienceEntry,
  BasicLanguageEntry,
  BasicResumeData,
} from '@/shared/types/basic-resume';

export const BASIC_RESUME_SCHEMA_VERSION = 1;

/**
 * The basic CV's section order is canonical — the format is a convention and
 * reordering it is not a feature. It is written to `Resume.sectionOrder` only so
 * that column is never empty for a BASIC row; the template renders this order
 * unconditionally and does not read it back.
 */
export const BASIC_SECTION_ORDER = [
  'personal',
  'interests',
  'education',
  'experience',
  'languages',
  'personalStatement',
] as const;

export type BasicSectionId = (typeof BASIC_SECTION_ORDER)[number];

/**
 * An interview that has not started yet, and the shape every partial save is a
 * fill-in of. Empty strings rather than `undefined` so a field that was asked
 * and refused is indistinguishable from one not yet reached — which is correct:
 * both render as absent, and neither is worth prompting about again.
 */
export function createEmptyBasicResumeData(): BasicResumeData {
  return {
    schemaVersion: BASIC_RESUME_SCHEMA_VERSION,
    fullName: '',
    positionSought: '',
    contact: { address: '', phone: '' },
    personal: {
      nationality: '',
      gender: '',
      dateOfBirth: '',
      placeOfBirth: '',
      health: '',
      maritalStatus: '',
    },
    education: [],
    experience: [],
    languages: [],
    interests: [],
    personalStatement: '',
  };
}

const hasText = (value: string | undefined): boolean => Boolean(value && value.trim());

const entryHasText = (entry: { year?: string; detail?: string }): boolean =>
  hasText(entry.year) || hasText(entry.detail);

/**
 * Whether a section has anything worth printing. The basic CV omits an empty
 * section entirely rather than rendering a bare heading, so both the preview and
 * the DOCX export gate on this — one definition, so the two can't disagree about
 * what "empty" means.
 */
export const basicSectionHasContent = (
  data: BasicResumeData,
  section: BasicSectionId
): boolean => {
  switch (section) {
    case 'personal':
      return Object.values(data.personal).some(hasText);
    case 'interests':
      return data.interests.some(hasText);
    case 'education':
      return data.education.some(entryHasText);
    case 'experience':
      return data.experience.some(entryHasText);
    case 'languages':
      return data.languages.some((entry) => hasText(entry.name) || hasText(entry.skills));
    case 'personalStatement':
      return hasText(data.personalStatement);
    default:
      return false;
  }
};

/** Drops list rows the user never actually filled in, so they never reach print. */
export const visibleBasicEducation = (data: BasicResumeData): BasicEducationEntry[] =>
  data.education.filter(entryHasText);

export const visibleBasicExperience = (data: BasicResumeData): BasicExperienceEntry[] =>
  data.experience.filter(entryHasText);

export const visibleBasicLanguages = (data: BasicResumeData): BasicLanguageEntry[] =>
  data.languages.filter((entry) => hasText(entry.name) || hasText(entry.skills));

export const visibleBasicInterests = (data: BasicResumeData): string[] =>
  data.interests.filter(hasText);
