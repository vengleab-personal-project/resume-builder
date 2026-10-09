import type {
  Certification,
  Education,
  Experience,
  Language,
  Publication,
  Reference,
  ResumeData,
  Training,
  Volunteering,
} from '@/shared/types';

/**
 * The one definition of *what* a full resume shows: which sections appear, in which
 * order, under which title, with which entries, and how each entry's labels read.
 *
 * The preview templates, the print (which is the preview) and every DOCX renderer
 * consume this instead of reading `ResumeData` themselves. Before it existed each of
 * them re-derived these decisions - `hasData`, the sidebar/main split, normalising
 * legacy string certifications - and they drifted. A renderer now decides only *how*
 * a section looks, never whether it is there or what it says.
 */

export const RESUME_SECTION_IDS = [
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'publications',
  'volunteering',
  'languages',
  'otherTraining',
  'references',
] as const;

export type ResumeSectionId = (typeof RESUME_SECTION_IDS)[number];

/** The two-column (Modern) layout's split; single-column templates ignore it. */
export const SIDEBAR_SECTION_IDS: readonly ResumeSectionId[] = [
  'skills',
  'certifications',
  'volunteering',
  'languages',
  'otherTraining',
  'references',
  'publications',
];
export const MAIN_SECTION_IDS: readonly ResumeSectionId[] = ['summary', 'experience', 'education'];

/** What each section carries once empty entries are dropped and legacy shapes normalised. */
export type ResumeSectionContent = {
  /** Rich-text HTML from the editor. */
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  publications: Publication[];
  volunteering: Volunteering[];
  languages: Language[];
  /** `name` is rich-text HTML. */
  otherTraining: Training[];
  references: Reference[];
};

export type ResumeViewSection = {
  [K in ResumeSectionId]: { id: K; title: string; content: ResumeSectionContent[K] };
}[ResumeSectionId];

/**
 * Every user-visible string a renderer needs. `t.preview` (both locales) satisfies
 * this, so a label added here without a translation is a compile error at the call site.
 */
export type ResumeViewLabels = {
  profile: string;
  experience: string;
  education: string;
  contact: string;
  skills: string;
  certifications: string;
  publications: string;
  volunteering: string;
  languages: string;
  otherTraining: string;
  references: string;
  view: string;
  yourName: string;
  expire: string;
  year: string;
  topic: string;
  phone: string;
  email: string;
  photoPlaceholder: string;
};

export type ResumeView = {
  personalInfo: ResumeData['personalInfo'];
  /** The name, or the localised placeholder when the user has not typed one yet. */
  displayName: string;
  /** Present, non-empty sections in the user's order. */
  sections: ResumeViewSection[];
  labels: ResumeViewLabels;
};

const SECTION_TITLE_KEY: Record<ResumeSectionId, keyof ResumeViewLabels> = {
  summary: 'profile',
  experience: 'experience',
  education: 'education',
  skills: 'skills',
  certifications: 'certifications',
  publications: 'publications',
  volunteering: 'volunteering',
  languages: 'languages',
  otherTraining: 'otherTraining',
  references: 'references',
};

const isSectionId = (id: string): id is ResumeSectionId =>
  (RESUME_SECTION_IDS as readonly string[]).includes(id);

/** Drops the null/empty slots an older or half-edited resume can carry. */
const present = <T>(items: readonly (T | null | undefined)[] | undefined): T[] =>
  Array.isArray(items) ? items.filter((item): item is T => Boolean(item)) : [];

/** Older saved resumes store certifications and trainings as bare strings. */
const toCertification = (cert: Certification | string): Certification =>
  typeof cert === 'string' ? { name: cert } : cert;
const toTraining = (training: Training | string): Training =>
  typeof training === 'string' ? { name: training } : training;

/** Rich text with no visible characters - Quill leaves `<p><br></p>` behind when cleared. */
const isBlankHtml = (html?: string) =>
  !html ||
  !html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|\u00A0/g, ' ')
    .trim();

const sectionContent = (data: ResumeData): ResumeSectionContent => ({
  summary: isBlankHtml(data.summary) ? '' : data.summary,
  experience: present(data.experience),
  education: present(data.education),
  skills: present(data.skills),
  certifications: present<Certification | string>(data.certifications).map(toCertification),
  publications: present(data.publications),
  volunteering: present(data.volunteering),
  languages: present(data.languages),
  otherTraining: present<Training | string>(data.otherTraining).map(toTraining),
  references: present(data.references),
});

const hasContent = (value: string | readonly unknown[]) => value.length > 0;

/**
 * Whether a section has anything worth printing. An empty section is omitted
 * entirely, never rendered as a bare heading.
 */
export const resumeSectionHasContent = (data: ResumeData, id: ResumeSectionId): boolean =>
  hasContent(sectionContent(data)[id]);

export const buildResumeView = (
  data: ResumeData,
  sectionOrder: readonly string[],
  labels: ResumeViewLabels
): ResumeView => {
  const content = sectionContent(data);
  const order = [...new Set(sectionOrder)].filter(isSectionId);

  const sections = order
    .filter((id) => hasContent(content[id]))
    .map(
      (id) =>
        ({ id, title: labels[SECTION_TITLE_KEY[id]], content: content[id] }) as ResumeViewSection
    );

  return {
    personalInfo: data.personalInfo,
    displayName: data.personalInfo.name || labels.yourName,
    sections,
    labels,
  };
};

/** The sections of `view` that belong to one column of the two-column layout. */
export const sectionsIn = (view: ResumeView, ids: readonly ResumeSectionId[]) =>
  view.sections.filter((section) => ids.includes(section.id));

/** "Expire: 2027" / "Year: 2021" / "", the detail line under a certification. */
export const certificationDetail = (cert: Certification, labels: ResumeViewLabels): string =>
  cert.expireDate
    ? `${labels.expire}: ${cert.expireDate}`
    : cert.year
      ? `${labels.year}: ${cert.year}`
      : '';

/** The short date shown beside a certification in the single-column templates. */
export const certificationDate = (cert: Certification): string => cert.year || cert.expireDate || '';

/** Khmer is never upper-cased or letter-spaced: it has no case and spacing breaks clusters. */
export const isKhmerText = (text?: string): boolean =>
  Boolean(text && /[ក-៿᧠-᧿]/.test(text));
