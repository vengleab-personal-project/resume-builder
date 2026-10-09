import type { ResumeData, ThemeConfig } from './index';
import type { BasicResumeData, ResumeKindKey } from './basic-resume';
import type { ProfileFields } from '@/shared/lib/profile';

// Wire shape of a resume row. `data`/`sectionOrder`/`theme` come back exactly
// as the editor stored them, so a hydrated store can be fed them verbatim.
export interface ResumeDTO {
  id: string;
  title: string;
  kind: ResumeKindKey;
  data: ResumeData;
  sectionOrder: string[];
  theme: ThemeConfig;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// The basic CV's wire shape. It is a separate interface rather than a generic
// over ResumeDTO because the two are read by different screens and a `data`
// field that could be either shape would push a discriminated-union check into
// every consumer -- including the ones that only ever see one kind.
// `sectionOrder` is absent: the basic CV's order is canonical (BASIC_SECTION_ORDER).
export interface BasicResumeDTO {
  id: string;
  title: string;
  kind: ResumeKindKey;
  data: BasicResumeData;
  theme: ThemeConfig;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// The list endpoint omits the JSON payloads: a resume list is rendered from
// titles alone and the blobs are the expensive part of the row. `kind` is here
// so the list screen can route each row to the editor that understands it
// without fetching the blob to find out.
export interface ResumeSummary {
  id: string;
  title: string;
  kind: ResumeKindKey;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationSummary {
  id: string;
  resumeId: string | null;
  jobDescription: string;
  overallScore: number | null;
  recommendation: string | null;
  candidateName: string | null;
  modelId: string | null;
  isFallback: boolean;
  createdAt: string;
}

export interface EvaluationDTO extends EvaluationSummary {
  result: unknown;
  resumeSnapshot: unknown;
}

export interface EvaluationListResponse {
  evaluations: EvaluationSummary[];
  nextCursor: string | null;
}

// Returned with a 409 from PATCH /api/resumes/[id] so the client can resolve
// the conflict against the record that actually won, without a second GET.
export interface VersionConflictResponse {
  error: 'VERSION_CONFLICT';
  resume: ResumeDTO;
}

// The same contract for PATCH /api/basic-resume/[id]. Kept as its own type so
// the basic editor's conflict handler is typed against BasicResumeData and
// cannot accidentally adopt a full resume it has no way to render.
export interface BasicVersionConflictResponse {
  error: 'VERSION_CONFLICT';
  resume: BasicResumeDTO;
}

// The user's general profile: identity fields shared by every resume, synchronised
// with the default FULL resume (see server/modules/profile/profileService.ts).
// `ProfileFields` are strings with '' meaning unset.
export interface ProfileDTO extends ProfileFields {
  version: number;
  createdAt: string;
  updatedAt: string;
}

// PATCH /api/profile. `resume` is the default resume after the profile's fields were
// written into it, or null when the user has none. The builder adopts it so its next
// autosave carries the new version instead of losing a 409.
export interface ProfileUpdateResponse {
  profile: ProfileDTO;
  resume: ResumeDTO | null;
}

// 409 from PATCH /api/profile: the profile that won, as with VersionConflictResponse.
export interface ProfileConflictResponse {
  error: 'VERSION_CONFLICT';
  profile: ProfileDTO;
}

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'conflict';
