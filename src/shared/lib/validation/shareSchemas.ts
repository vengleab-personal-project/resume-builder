import { z } from 'zod';
import {
  SHARE_LABEL_MAX_LENGTH,
  SHARE_PASSCODE_MAX_LENGTH,
  SHARE_PASSCODE_MIN_LENGTH,
} from '@/shared/config/share';

// Messages are i18n keys (share.validation.*), resolved by the share dialog.
export const SHARE_VALIDATION_KEYS = {
  LABEL_REQUIRED: 'share.validation.labelRequired',
  LABEL_TOO_LONG: 'share.validation.labelTooLong',
  PASSCODE_TOO_SHORT: 'share.validation.passcodeTooShort',
  PASSCODE_TOO_LONG: 'share.validation.passcodeTooLong',
  PASSCODE_REQUIRED: 'share.validation.passcodeRequired',
} as const;

const label = z
  .string()
  .trim()
  .min(1, { error: SHARE_VALIDATION_KEYS.LABEL_REQUIRED })
  .max(SHARE_LABEL_MAX_LENGTH, { error: SHARE_VALIDATION_KEYS.LABEL_TOO_LONG });

// Not trimmed: a passcode is compared byte for byte, spaces included.
const passcode = z
  .string()
  .min(SHARE_PASSCODE_MIN_LENGTH, { error: SHARE_VALIDATION_KEYS.PASSCODE_TOO_SHORT })
  .max(SHARE_PASSCODE_MAX_LENGTH, { error: SHARE_VALIDATION_KEYS.PASSCODE_TOO_LONG });

export const createShareLinkSchema = z
  .object({
    label,
    access: z.enum(['CODE', 'PASSCODE']),
    passcode: passcode.optional(),
    content: z.enum(['LIVE', 'SNAPSHOT']),
    locale: z.enum(['en', 'km']).default('en'),
  })
  .superRefine((value, ctx) => {
    if (value.access === 'PASSCODE' && !value.passcode) {
      ctx.addIssue({ code: 'custom', path: ['passcode'], message: SHARE_VALIDATION_KEYS.PASSCODE_REQUIRED });
    }
  });

export const updateShareLinkSchema = z
  .object({
    label: label.optional(),
    isActive: z.boolean().optional(),
    passcode: passcode.optional(),
    // Re-copies the resume into a SNAPSHOT link.
    refreshSnapshot: z.literal(true).optional(),
  })
  .refine(
    (value) =>
      value.label !== undefined ||
      value.isActive !== undefined ||
      value.passcode !== undefined ||
      value.refreshSnapshot !== undefined,
    { error: 'NOTHING_TO_UPDATE' }
  );

// No min length here: a short guess must still count as a failed attempt, not a 400.
export const unlockShareSchema = z.object({
  passcode: z.string().max(SHARE_PASSCODE_MAX_LENGTH),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type UpdateShareLinkInput = z.infer<typeof updateShareLinkSchema>;
