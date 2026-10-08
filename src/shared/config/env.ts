// Public configuration only. Anything here is inlined into the client bundle,
// so secrets must live in src/server/config/env.server.ts instead.
// NEXT_PUBLIC_* values must be referenced as full literal property accesses on
// `process.env` for Next.js to statically replace them at build time.

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
} as const;
