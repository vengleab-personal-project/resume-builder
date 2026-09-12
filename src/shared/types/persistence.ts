import type { ResumeData, ThemeConfig } from './index';

// Wire shape of a resume row. `data`/`sectionOrder`/`theme` come back exactly
// as the editor stored them, so a hydrated store can be fed them verbatim.
export interface ResumeDTO {
  id: string;
  title: string;
  data: ResumeData;
  sectionOrder: string[];
  theme: ThemeConfig;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// The list endpoint omits the JSON payloads: a resume list is rendered from
// titles alone and the blobs are the expensive part of the row.
export interface ResumeSummary {
  id: string;
  title: string;
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

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'conflict';
