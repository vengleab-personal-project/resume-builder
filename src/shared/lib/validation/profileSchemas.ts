import { z } from 'zod';
import {
  PROFILE_FIELD_MAX_LENGTH,
  PROFILE_PHOTO_MAX_LENGTH,
  type ProfileField,
} from '@/shared/lib/profile';

// Messages are i18n keys, like authSchemas: the client resolves them against
// src/shared/messages/*.
export const PROFILE_VALIDATION_KEYS = {
  EMAIL_INVALID: 'profile.validation.emailInvalid',
  TOO_LONG: 'profile.validation.tooLong',
  PHOTO_TOO_LARGE: 'profile.validation.photoTooLarge',
  PHOTO_INVALID: 'profile.validation.photoInvalid',
} as const;

const text = (field: Exclude<ProfileField, 'photoUrl'>) =>
  z
    .string()
    .trim()
    .max(PROFILE_FIELD_MAX_LENGTH[field], { error: PROFILE_VALIDATION_KEYS.TOO_LONG });

// '' is a valid value: on the profile page it clears the field (and the default
// resume's matching field). The resume's own email is free text, so only the
// profile's is held to the shape of an address.
const email = z
  .string()
  .trim()
  .max(PROFILE_FIELD_MAX_LENGTH.email, { error: PROFILE_VALIDATION_KEYS.TOO_LONG })
  // A refine rather than a union with z.email(): a union reports the inner schema's own
  // English message, and the client resolves these messages as i18n keys.
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    error: PROFILE_VALIDATION_KEYS.EMAIL_INVALID,
  });

// A downscaled data URL or '' (remove). Anything else - a remote URL, a script URL -
// would be written into resume JSON and rendered by the templates, so it is refused.
const photo = z
  .string()
  .max(PROFILE_PHOTO_MAX_LENGTH, { error: PROFILE_VALIDATION_KEYS.PHOTO_TOO_LARGE })
  .refine((value) => value === '' || /^data:image\/(png|jpe?g|webp);base64,/.test(value), {
    error: PROFILE_VALIDATION_KEYS.PHOTO_INVALID,
  });

export const updateProfileSchema = z
  .object({
    // The profile version the form was loaded from, as with PATCH /api/resumes/[id].
    version: z.number().int().nonnegative(),
    fullName: text('fullName').optional(),
    title: text('title').optional(),
    email: email.optional(),
    phone: text('phone').optional(),
    address: text('address').optional(),
    linkedin: text('linkedin').optional(),
    website: text('website').optional(),
    photoUrl: photo.optional(),
  })
  .refine(
    (value) =>
      value.fullName !== undefined ||
      value.title !== undefined ||
      value.email !== undefined ||
      value.phone !== undefined ||
      value.address !== undefined ||
      value.linkedin !== undefined ||
      value.website !== undefined ||
      value.photoUrl !== undefined,
    { error: 'NOTHING_TO_UPDATE' }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
