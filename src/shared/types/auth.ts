export type Role = 'USER' | 'ADMIN';

// The only user shape ever sent to a client. Deliberately excludes
// passwordHash, tokenVersion and the raw telegramId.
export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramUsername: string | null;
  telegramPhotoUrl: string | null;
  hasPassword: boolean;
  hasTelegram: boolean;
  preferredAiProvider: string | null;
  preferredAiModel: string | null;
  locale: string;
  createdAt: string;
}

export interface SessionClaims {
  sub: string;
  usr: string;
  rol: Role;
  tv: number;
  iat: number;
  exp: number;
}

export type AuthErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_INPUT'
  | 'USERNAME_TAKEN'
  | 'RATE_LIMITED'
  | 'ACCOUNT_DISABLED'
  | 'PASSWORD_ALREADY_SET'
  | 'TELEGRAM_NOT_CONFIGURED'
  | 'TELEGRAM_INVALID_SIGNATURE'
  | 'TELEGRAM_EXPIRED'
  | 'TELEGRAM_ALREADY_LINKED'
  | 'TELEGRAM_NOT_LINKED'
  | 'LAST_CREDENTIAL'
  | 'CROSS_ORIGIN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface AuthErrorResponse {
  error: AuthErrorCode;
  message?: string;
}

// Exactly the field set Telegram's login widget hands to the onauth callback.
// Numeric fields arrive as JS numbers from the widget but as strings from a
// query-string callback, so both are accepted and normalised on the server.
export interface TelegramAuthPayload {
  id: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string | number;
  hash: string;
}
