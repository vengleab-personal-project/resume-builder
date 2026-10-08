import { z } from 'zod';
import { BASIC_RESUME_SCHEMA_VERSION } from '@/shared/lib/basic-resume';
import { resumeTitleSchema } from '@/shared/lib/validation/resumeSchemas';

// Unlike ResumeData -- which is deliberately not re-declared in zod because it is
// a deep, client-owned structure that would drift on the first section added --
// BasicResumeData is small, fixed by the CV format it mirrors, and written by a
// model rather than by the editor. That is exactly the case where a real schema
// earns its keep: it is what stops an extraction hallucinating a field.
//
// It validates SHAPE, never COMPLETENESS. No `.min(1)` appears on user content
// anywhere below: a half-finished CV is a legitimate state (see
// shared/types/basic-resume.ts), and rejecting one would make an interrupted
// interview unsaveable.

const text = z.string();

const basicEducationEntrySchema = z.object({
  id: z.string().min(1),
  year: text,
  detail: text,
});

const basicExperienceEntrySchema = z.object({
  id: z.string().min(1),
  year: text,
  detail: text,
});

const basicLanguageEntrySchema = z.object({
  id: z.string().min(1),
  name: text,
  skills: text,
});

export const basicPersonalDataSchema = z.object({
  nationality: text,
  gender: text,
  dateOfBirth: text,
  placeOfBirth: text,
  health: text,
  maritalStatus: text,
});

export const basicResumeSchema = z.object({
  schemaVersion: z.literal(BASIC_RESUME_SCHEMA_VERSION),
  fullName: text,
  positionSought: text,
  contact: z.object({
    address: text,
    phone: text,
    email: text.optional(),
  }),
  photoUrl: text.optional(),
  personal: basicPersonalDataSchema,
  education: z.array(basicEducationEntrySchema),
  experience: z.array(basicExperienceEntrySchema),
  languages: z.array(basicLanguageEntrySchema),
  interests: z.array(text),
  personalStatement: text,
});

// `sectionOrder` is absent on purpose: the basic CV's order is canonical (see
// BASIC_SECTION_ORDER) and there is no path by which a client should change it.
export const updateBasicResumeSchema = z
  .object({
    version: z.number().int().nonnegative(),
    title: resumeTitleSchema.optional(),
    data: basicResumeSchema.optional(),
    theme: z.record(z.string(), z.unknown()).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.data !== undefined ||
      value.theme !== undefined ||
      value.isDefault !== undefined,
    { error: 'NOTHING_TO_UPDATE' }
  );

export type UpdateBasicResumeInput = z.infer<typeof updateBasicResumeSchema>;
