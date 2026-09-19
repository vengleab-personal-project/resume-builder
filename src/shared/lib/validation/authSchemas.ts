import { z } from 'zod';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  RESERVED_USERNAMES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@/shared/config/auth';

// Messages are i18n keys, not prose. The client resolves them against
// src/shared/messages/*; baking English in here would make the same schema
// unusable for the Khmer UI.
export const AUTH_VALIDATION_KEYS = {
  USERNAME_REQUIRED: 'auth.validation.usernameRequired',
  USERNAME_TOO_SHORT: 'auth.validation.usernameTooShort',
  USERNAME_TOO_LONG: 'auth.validation.usernameTooLong',
  USERNAME_PATTERN: 'auth.validation.usernamePattern',
  USERNAME_RESERVED: 'auth.validation.usernameReserved',
  PASSWORD_TOO_SHORT: 'auth.validation.passwordTooShort',
  PASSWORD_TOO_LONG: 'auth.validation.passwordTooLong',
  PASSWORD_NEEDS_LETTER_AND_DIGIT: 'auth.validation.passwordNeedsLetterAndDigit',
  PASSWORD_SAME_AS_USERNAME: 'auth.validation.passwordSameAsUsername',
  DISPLAY_NAME_TOO_LONG: 'auth.validation.displayNameTooLong',
} as const;

export const usernameSchema = z
  .string({ error: AUTH_VALIDATION_KEYS.USERNAME_REQUIRED })
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH, { error: AUTH_VALIDATION_KEYS.USERNAME_TOO_SHORT })
  .max(USERNAME_MAX_LENGTH, { error: AUTH_VALIDATION_KEYS.USERNAME_TOO_LONG })
  .regex(USERNAME_PATTERN, { error: AUTH_VALIDATION_KEYS.USERNAME_PATTERN })
  .refine((value) => !RESERVED_USERNAMES.includes(value), {
    error: AUTH_VALIDATION_KEYS.USERNAME_RESERVED,
  });

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: AUTH_VALIDATION_KEYS.PASSWORD_TOO_SHORT })
  .max(PASSWORD_MAX_LENGTH, { error: AUTH_VALIDATION_KEYS.PASSWORD_TOO_LONG })
  .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), {
    error: AUTH_VALIDATION_KEYS.PASSWORD_NEEDS_LETTER_AND_DIGIT,
  });

export const displayNameSchema = z
  .string()
  .trim()
  .max(80, { error: AUTH_VALIDATION_KEYS.DISPLAY_NAME_TOO_LONG })
  .optional();

function assertPasswordDiffersFromUsername(
  { username, password }: { username: string; password: string },
  ctx: z.RefinementCtx
): void {
  if (password.toLowerCase().includes(username)) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: AUTH_VALIDATION_KEYS.PASSWORD_SAME_AS_USERNAME,
    });
  }
}

export const signupSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
  })
  .superRefine(assertPasswordDiffersFromUsername);

// Login deliberately does NOT reuse usernameSchema/passwordSchema: tightening
// validation here would let an attacker distinguish "not a valid username" from
// "no such user", which is exactly the enumeration signal login must not leak.
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(USERNAME_MAX_LENGTH),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const setPasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH).optional(),
    newPassword: passwordSchema,
  })
  .transform((value) => value);

export const logoutSchema = z.object({
  everywhere: z.boolean().optional(),
});

export const telegramAuthPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.union([z.string(), z.number()]),
  hash: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
