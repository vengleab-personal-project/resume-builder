export const SESSION_COOKIE_NAME = 'rb_session';

export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// Re-sign the cookie once a session is past this fraction of its lifetime, so
// an active user is never logged out mid-session.
export const SESSION_REFRESH_AFTER_RATIO = 0.5;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Names that would collide with a route segment, impersonate the product, or
// read as an official account.
export const RESERVED_USERNAMES: readonly string[] = [
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'billing',
  'payments',
  'security',
  'moderator',
  'staff',
  'official',
  'api',
  'auth',
  'login',
  'logout',
  'signup',
  'signin',
  'register',
  'account',
  'settings',
  'builder',
  'evaluation',
  'resume',
  'resumes',
  'me',
  'user',
  'users',
  'null',
  'undefined',
  'anonymous',
  'guest',
  'cvbuilder',
  'resumebuilder',
];

// Free login attempts before a username or ip is throttled.
export const LOGIN_RATE_LIMIT_MAX_FAILURES = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

// Telegram's auth_date replay window.
export const TELEGRAM_AUTH_MAX_AGE_SECONDS = 300;

export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  AFTER_LOGIN: '/builder',
} as const;

export const PROTECTED_PATH_PREFIXES: readonly string[] = [
  '/builder',
  '/evaluation',
  '/account',
  '/billing',
];

export const ADMIN_PATH_PREFIX = '/admin';
