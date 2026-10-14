import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// There is no test framework in the app itself; this is the harness for the pure modules
// (sanitizers, URL rules, rate-limit helpers...). `server-only` throws outside a server
// bundle, so tests alias it to an empty module.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
