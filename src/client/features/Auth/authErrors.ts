"use client";

import type { Translations } from '@/client/hooks/useTranslations';
import type { AuthErrorCode } from '@/shared/types/auth';

export type AuthMessages = Translations['auth'];

interface AuthErrorBody {
  error?: string;
  details?: { issues?: { path?: unknown; message?: string }[] };
}

// The zod schemas emit i18n keys ("auth.validation.usernameTooShort") rather
// than prose, so the first validation issue is resolved against the dictionary
// here. An unknown key falls through to the generic message instead of leaking
// the key itself into the UI.
function resolveKey(messages: AuthMessages, key: string): string | null {
  if (!key.startsWith('auth.')) return null;

  let node: unknown = messages;
  for (const segment of key.slice('auth.'.length).split('.')) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as Record<string, unknown>)[segment];
  }

  return typeof node === 'string' ? node : null;
}

export function authErrorMessage(messages: AuthMessages, body: unknown): string {
  const parsed = (body ?? {}) as AuthErrorBody;

  const issue = parsed.details?.issues?.[0]?.message;
  if (issue) {
    const resolved = resolveKey(messages, issue);
    if (resolved) return resolved;
  }

  const code = parsed.error as AuthErrorCode | undefined;
  if (code && code in messages.errors) {
    return messages.errors[code as keyof AuthMessages['errors']];
  }

  return messages.errors.INTERNAL_ERROR;
}

export function networkErrorMessage(messages: AuthMessages): string {
  return messages.errors.NETWORK;
}
