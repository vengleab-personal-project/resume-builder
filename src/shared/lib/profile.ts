import { INITIAL_RESUME_DATA } from '@/shared/config/constants';
import type { ResumeData } from '@/shared/types';

/**
 * The one definition of what a user profile is and how it maps onto a resume's
 * `personalInfo`. The server (`profileService`, which keeps the two in step inside
 * the resume write transactions) and the client (seeding new resumes, the profile
 * page) both read it, so "which fields are identity" and "what counts as unset"
 * cannot drift between them.
 *
 * Every field is a plain string and '' means unset. The database stores NULL for
 * that; the DTO mapper turns it back, so no form ever deals with `null`.
 */

export const PROFILE_FIELDS = [
  'fullName',
  'title',
  'email',
  'phone',
  'address',
  'linkedin',
  'website',
  'photoUrl',
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type ProfileFields = Record<ProfileField, string>;

type PersonalInfo = ResumeData['personalInfo'];
type PersonalInfoKey = keyof PersonalInfo;

/** The profile's `fullName` is the resume's `name`; every other field keeps its name. */
const PERSONAL_INFO_KEY: Record<ProfileField, PersonalInfoKey> = {
  fullName: 'name',
  title: 'title',
  email: 'email',
  phone: 'phone',
  address: 'address',
  linkedin: 'linkedin',
  website: 'website',
  photoUrl: 'photoUrl',
};

/**
 * Longest `photoUrl` the profile stores or syncs. The client downsizes photos to a few
 * tens of KB (`client/lib/image.ts`), so this only turns away legacy multi-MB uploads;
 * the sync skips an oversize photo rather than failing the resume save that carried it.
 */
export const PROFILE_PHOTO_MAX_LENGTH = 300_000;

export const PROFILE_FIELD_MAX_LENGTH: Record<Exclude<ProfileField, 'photoUrl'>, number> = {
  fullName: 120,
  title: 120,
  email: 254,
  phone: 40,
  address: 300,
  linkedin: 300,
  website: 300,
};

export const emptyProfileFields = (): ProfileFields => ({
  fullName: '',
  title: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
  photoUrl: '',
});

/**
 * "Unset" for the purpose of syncing: blank, or still the placeholder a brand-new
 * resume shows ("Your Name", "email@example.com"). Placeholders must never reach the
 * profile - they would then be seeded into every new resume as if they were real.
 */
export const isUnsetIdentity = (field: ProfileField, value: string | undefined | null): boolean => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return true;
  const placeholder = (INITIAL_RESUME_DATA.personalInfo as Partial<Record<PersonalInfoKey, string>>)[
    PERSONAL_INFO_KEY[field]
  ];
  return trimmed === placeholder;
};

/**
 * What a resume's `personalInfo` contributes to the profile: only fields that carry a
 * real value. A blank or placeholder field says nothing, so it can never erase a
 * profile value (clearing a field is done on the profile page, where it is explicit).
 */
export const identityFromPersonalInfo = (
  personalInfo: Partial<PersonalInfo> | null | undefined
): Partial<ProfileFields> => {
  const out: Partial<ProfileFields> = {};
  if (!personalInfo) return out;

  for (const field of PROFILE_FIELDS) {
    const raw = personalInfo[PERSONAL_INFO_KEY[field]];
    if (typeof raw !== 'string' || isUnsetIdentity(field, raw)) continue;
    if (field === 'photoUrl' && raw.length > PROFILE_PHOTO_MAX_LENGTH) continue;
    out[field] = field === 'photoUrl' ? raw : raw.trim();
  }
  return out;
};

/** The fields in `incoming` whose value differs from `current` - the minimal write. */
export const changedFields = (
  current: ProfileFields,
  incoming: Partial<ProfileFields>
): Partial<ProfileFields> => {
  const out: Partial<ProfileFields> = {};
  for (const field of PROFILE_FIELDS) {
    const value = incoming[field];
    if (value !== undefined && value !== current[field]) out[field] = value;
  }
  return out;
};

/**
 * Writes `fields` into a resume's `personalInfo`, leaving every other key alone. A
 * profile field set to '' blanks the resume's field too: on the profile page that is
 * an explicit clear.
 */
export const applyProfileToPersonalInfo = (
  personalInfo: PersonalInfo,
  fields: Partial<ProfileFields>
): PersonalInfo => {
  const next: Record<string, unknown> = { ...personalInfo };
  for (const field of PROFILE_FIELDS) {
    const value = fields[field];
    if (value !== undefined) next[PERSONAL_INFO_KEY[field]] = value;
  }
  return next as PersonalInfo;
};

/**
 * Profile -> default resume. Writes the fields the user just changed (`patch`, '' being
 * an explicit clear), and also fills any field the resume has *never set* - still the
 * placeholder, or missing - from the profile, so a value saved on the profile before the
 * resume existed (the photo, say) reaches it on the next save.
 *
 * A field the user blanked on the resume ('') is deliberately left alone: refilling it
 * would resurrect a phone number they removed from that CV.
 */
export const mergeProfileIntoPersonalInfo = (
  personalInfo: PersonalInfo,
  profile: ProfileFields,
  patch: Partial<ProfileFields>
): PersonalInfo => {
  const writes: Partial<ProfileFields> = { ...patch };
  for (const field of PROFILE_FIELDS) {
    if (writes[field] !== undefined) continue;
    const value = profile[field];
    if (!value || isUnsetIdentity(field, value)) continue;

    const current = personalInfo[PERSONAL_INFO_KEY[field]];
    const neverSet =
      current === undefined ||
      current === null ||
      (typeof current === 'string' && current.trim() !== '' && isUnsetIdentity(field, current));
    if (neverSet) writes[field] = value;
  }
  return applyProfileToPersonalInfo(personalInfo, writes);
};

/**
 * A new resume's starting data: the placeholder document with the profile's identity
 * filled in. A field the profile has not set keeps its placeholder, exactly as a new
 * resume looked before profiles existed.
 */
export const seedResumeData = (profile: Partial<ProfileFields> | null | undefined): ResumeData => {
  const base = structuredClone(INITIAL_RESUME_DATA) as unknown as ResumeData;
  if (!profile) return base;

  const filled: Partial<ProfileFields> = {};
  for (const field of PROFILE_FIELDS) {
    const value = profile[field];
    if (value && !isUnsetIdentity(field, value)) filled[field] = value;
  }
  return { ...base, personalInfo: applyProfileToPersonalInfo(base.personalInfo, filled) };
};

/**
 * Fills the gaps of a freshly parsed/imported resume from the profile: a field the
 * source left blank takes the profile's value, a field it has keeps its own. This is
 * what stops an AI import (which replaces the whole document) from dropping the photo.
 */
export const fillPersonalInfoFromProfile = (
  personalInfo: PersonalInfo,
  profile: Partial<ProfileFields> | null | undefined
): PersonalInfo => {
  if (!profile) return personalInfo;
  const gaps: Partial<ProfileFields> = {};
  for (const field of PROFILE_FIELDS) {
    const value = profile[field];
    const current = personalInfo[PERSONAL_INFO_KEY[field]];
    const hasValue = typeof current === 'string' && !isUnsetIdentity(field, current);
    if (!hasValue && value && !isUnsetIdentity(field, value)) gaps[field] = value;
  }
  return applyProfileToPersonalInfo(personalInfo, gaps);
};

/** Whether anything in the profile is worth showing or syncing. */
export const profileHasContent = (profile: Partial<ProfileFields> | null | undefined): boolean =>
  Boolean(profile) && PROFILE_FIELDS.some((field) => Boolean(profile?.[field]?.trim()));
