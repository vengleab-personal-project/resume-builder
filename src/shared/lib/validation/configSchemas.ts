import { z } from 'zod';

// Messages are i18n keys resolved client-side, matching authSchemas.ts.
export const CONFIG_VALIDATION_KEYS = {
  MODEL_ID_REQUIRED: 'admin.validation.modelIdRequired',
  MODEL_ID_PATTERN: 'admin.validation.modelIdPattern',
  DISPLAY_NAME_REQUIRED: 'admin.validation.displayNameRequired',
  DEFAULT_MUST_BE_ACTIVE: 'admin.validation.defaultMustBeActive',
  COIN_COST_INVALID: 'admin.validation.coinCostInvalid',
} as const;

export const AI_PROVIDER_VALUES = ['GOOGLE', 'OPENAI'] as const;
export const AI_ACTION_VALUES = ['PARSE_RESUME', 'REFINE_RESUME', 'EVALUATE_RESUME'] as const;

// Vendor wire ids only. This is not a security boundary on its own (the
// allow-list lookup is), but it stops obvious junk from ever reaching the table.
const modelIdSchema = z
  .string({ error: CONFIG_VALIDATION_KEYS.MODEL_ID_REQUIRED })
  .trim()
  .min(1, { error: CONFIG_VALIDATION_KEYS.MODEL_ID_REQUIRED })
  .max(120, { error: CONFIG_VALIDATION_KEYS.MODEL_ID_PATTERN })
  .regex(/^[a-zA-Z0-9._:-]+$/, { error: CONFIG_VALIDATION_KEYS.MODEL_ID_PATTERN });

const displayNameSchema = z
  .string({ error: CONFIG_VALIDATION_KEYS.DISPLAY_NAME_REQUIRED })
  .trim()
  .min(1, { error: CONFIG_VALIDATION_KEYS.DISPLAY_NAME_REQUIRED })
  .max(120);

// Coins are always integers; a fractional price would make ledger sums drift.
const coinCostSchema = z
  .number({ error: CONFIG_VALIDATION_KEYS.COIN_COST_INVALID })
  .int({ error: CONFIG_VALIDATION_KEYS.COIN_COST_INVALID })
  .min(0, { error: CONFIG_VALIDATION_KEYS.COIN_COST_INVALID })
  .max(1_000_000, { error: CONFIG_VALIDATION_KEYS.COIN_COST_INVALID });

export const createChatModelSchema = z
  .object({
    provider: z.enum(AI_PROVIDER_VALUES),
    modelId: modelIdSchema,
    displayName: displayNameSchema,
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .refine((value) => !value.isDefault || value.isActive, {
    error: CONFIG_VALIDATION_KEYS.DEFAULT_MUST_BE_ACTIVE,
    path: ['isDefault'],
  });

export const updateChatModelSchema = z
  .object({
    provider: z.enum(AI_PROVIDER_VALUES).optional(),
    modelId: modelIdSchema.optional(),
    displayName: displayNameSchema.optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: CONFIG_VALIDATION_KEYS.MODEL_ID_REQUIRED,
  });

export const upsertActionCostSchema = z.object({
  action: z.enum(AI_ACTION_VALUES),
  // null targets the inherited default row for the action.
  chatModelId: z.string().trim().min(1).nullable().default(null),
  coinCost: coinCostSchema,
});

export const deleteActionCostSchema = z.object({
  action: z.enum(AI_ACTION_VALUES),
  chatModelId: z.string().trim().min(1),
});

export type CreateChatModelInput = z.infer<typeof createChatModelSchema>;
export type UpdateChatModelInput = z.infer<typeof updateChatModelSchema>;
export type UpsertActionCostInput = z.infer<typeof upsertActionCostSchema>;
