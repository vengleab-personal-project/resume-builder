// The Cambodian short-form CV (ប្រវត្តិរូបសង្ខេប) — a different document from the
// professional resume in `./index.ts`, not a subset of it. It carries fields the
// professional resume deliberately omits (date of birth, nationality, gender,
// marital status, health, place of birth) and omits the ones that resume centres
// on (summary, skills, certifications, publications, volunteering, references).
//
// Every scalar is a string and every list may be empty, on purpose. This shape is
// filled by a voice interview that is interruptible and whose answers are often
// vague or refused outright; being able to represent a half-finished CV is a hard
// requirement, not a convenience. Rendering handles emptiness by omitting the
// section — see `BasicResumePreview`.

export interface BasicPersonalData {
  nationality: string;
  gender: string;
  // Free-form as spoken, normalised to DD/MM/YYYY when it parses. Kept as a
  // string rather than a Date because "around 1997" is a real answer.
  dateOfBirth: string;
  placeOfBirth: string;
  health: string;
  maritalStatus: string;
}

export interface BasicEducationEntry {
  id: string;
  /** "2017", "2016 - present" — as spoken, not a parsed range. */
  year: string;
  /** One spoken line, e.g. "Studying Chinese at Preah Vihear". */
  detail: string;
}

export interface BasicExperienceEntry {
  id: string;
  year: string;
  detail: string;
}

export interface BasicLanguageEntry {
  id: string;
  name: string;
  /** "speak, listen, read, translate" — as spoken, not a proficiency enum. */
  skills: string;
}

export interface BasicResumeData {
  // Stored inside the JSON column rather than as a table column, so a future
  // shape change can migrate rows without a migration. Bump it together with a
  // migration function, the same discipline `useResumeStore` uses for its
  // persisted shape.
  schemaVersion: 1;
  fullName: string;
  positionSought: string;
  contact: {
    address: string;
    phone: string;
    email?: string;
  };
  // Filled by the existing photo upload path, never by voice.
  photoUrl?: string;
  personal: BasicPersonalData;
  education: BasicEducationEntry[];
  experience: BasicExperienceEntry[];
  languages: BasicLanguageEntry[];
  interests: string[];
  /** The closing "personal qualities" paragraph. */
  personalStatement: string;
}

/** The kinds a `Resume` row can be, mirroring the Prisma `ResumeKind` enum. */
export type ResumeKindKey = 'FULL' | 'BASIC';
