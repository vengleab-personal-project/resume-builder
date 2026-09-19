import { z } from 'zod';

export const RESUME_TITLE_MAX_LENGTH = 120;
export const JOB_DESCRIPTION_MAX_LENGTH = 40000;

// The editor's ResumeData shape is deliberately NOT re-declared here. It is a
// deep, frequently-edited structure owned by the client, and a second copy in
// zod would drift on the first section added. The column is JSON, so the only
// invariant the server actually needs is "an object, not a scalar or array".
const jsonObject = z.record(z.string(), z.unknown());

export const resumeTitleSchema = z.string().trim().min(1).max(RESUME_TITLE_MAX_LENGTH);

export const createResumeSchema = z.object({
  title: resumeTitleSchema.optional(),
  data: jsonObject,
  sectionOrder: z.array(z.string()),
  theme: jsonObject,
  isDefault: z.boolean().optional(),
});

export const updateResumeSchema = z
  .object({
    version: z.number().int().nonnegative(),
    title: resumeTitleSchema.optional(),
    data: jsonObject.optional(),
    sectionOrder: z.array(z.string()).optional(),
    theme: jsonObject.optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.data !== undefined ||
      value.sectionOrder !== undefined ||
      value.theme !== undefined ||
      value.isDefault !== undefined,
    { error: 'NOTHING_TO_UPDATE' }
  );

// Lowercase on the wire, uppercase in the database, mapped here so a query
// string never reaches Prisma unchecked. The default is what keeps every caller
// written before the basic CV existed pointed at the rows it has always read.
const WIRE_TO_DB_RESUME_KIND = { full: 'FULL', basic: 'BASIC' } as const;

export const resumeKindQuerySchema = z.object({
  kind: z
    .enum(['full', 'basic'])
    .default('full')
    .transform((value) => WIRE_TO_DB_RESUME_KIND[value]),
});

export const evaluationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
