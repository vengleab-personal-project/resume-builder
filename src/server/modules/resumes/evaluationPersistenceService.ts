import 'server-only';
import type { Prisma } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import type { EvaluationDTO, EvaluationSummary } from '@/shared/types/persistence';

export const EVALUATION_SUMMARY_SELECT = {
  id: true,
  resumeId: true,
  jobDescription: true,
  result: true,
  modelId: true,
  isFallback: true,
  createdAt: true,
} as const;

type EvaluationSummaryRow = Prisma.EvaluationResultGetPayload<{
  select: typeof EVALUATION_SUMMARY_SELECT;
}>;

// The list view needs a score and a headline but the stored result is the full
// multi-kilobyte evaluation, so the headline fields are projected out of the
// JSON here rather than shipping the whole blob to render a row.
function headline(result: unknown) {
  const value = (result ?? {}) as Record<string, unknown>;
  return {
    overallScore: typeof value.overallScore === 'number' ? value.overallScore : null,
    recommendation: typeof value.recommendation === 'string' ? value.recommendation : null,
    candidateName: typeof value.candidateName === 'string' ? value.candidateName : null,
  };
}

// The stored job description can be an entire posting; the list only ever shows
// a preview line.
const JD_PREVIEW_LENGTH = 240;

export function toEvaluationSummary(row: EvaluationSummaryRow): EvaluationSummary {
  return {
    id: row.id,
    resumeId: row.resumeId,
    jobDescription: row.jobDescription.slice(0, JD_PREVIEW_LENGTH),
    modelId: row.modelId,
    isFallback: row.isFallback,
    createdAt: row.createdAt.toISOString(),
    ...headline(row.result),
  };
}

export function toEvaluationDTO(
  row: EvaluationSummaryRow & { resumeSnapshot: Prisma.JsonValue | null }
): EvaluationDTO {
  return {
    ...toEvaluationSummary(row),
    jobDescription: row.jobDescription,
    result: row.result,
    resumeSnapshot: row.resumeSnapshot,
  };
}

export interface RecordEvaluationInput {
  userId: string;
  resumeId?: string | null;
  jobDescription: string;
  result: Prisma.InputJsonValue;
  resumeSnapshot?: Prisma.InputJsonValue;
  modelId?: string | null;
  isFallback: boolean;
}

// Persisting history must never be able to fail the evaluation the user just
// paid for, so every error here is swallowed after logging.
export async function recordEvaluation(input: RecordEvaluationInput): Promise<string | null> {
  try {
    // resumeId arrives from the request body, so it is only honoured when it
    // actually belongs to the caller. An unknown id would otherwise either
    // attach the row to a stranger's resume or trip the foreign key.
    let resumeId: string | null = null;
    if (input.resumeId) {
      const owned = await prisma.resume.findFirst({
        where: { id: input.resumeId, userId: input.userId },
        select: { id: true },
      });
      resumeId = owned?.id ?? null;
    }

    const row = await prisma.evaluationResult.create({
      data: {
        userId: input.userId,
        resumeId,
        jobDescription: input.jobDescription,
        result: input.result,
        resumeSnapshot: input.resumeSnapshot,
        modelId: input.modelId ?? null,
        isFallback: input.isFallback,
      },
      select: { id: true },
    });
    return row.id;
  } catch (error) {
    console.error('recordEvaluation: failed to persist evaluation history:', error);
    return null;
  }
}
