import 'server-only';

// Every accessor is a lazy getter rather than a value read at module load.
// Module-load validation would break `next build`, which imports route modules
// to collect metadata in environments that legitimately have no secrets set —
// a missing variable should fail the one request that needs it, not the build.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string {
  return process.env[name] ?? '';
}

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const serverEnv = {
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },

  get DATABASE_URL(): string {
    return required('DATABASE_URL');
  },
  get DIRECT_URL(): string {
    return required('DIRECT_URL');
  },

  get AUTH_JWT_SECRET(): string {
    const secret = required('AUTH_JWT_SECRET');
    if (secret.length < 32) {
      throw new Error('AUTH_JWT_SECRET must be at least 32 characters long');
    }
    return secret;
  },
  get AUTH_SESSION_TTL_SECONDS(): number {
    return integer('AUTH_SESSION_TTL_SECONDS', DEFAULT_SESSION_TTL_SECONDS);
  },
  get AUTH_IP_HASH_SALT(): string {
    return process.env.AUTH_IP_HASH_SALT || required('AUTH_JWT_SECRET');
  },

  get TELEGRAM_BOT_TOKEN(): string {
    return optional('TELEGRAM_BOT_TOKEN');
  },

  get SEED_ADMIN_USERNAME(): string {
    return optional('SEED_ADMIN_USERNAME');
  },
  get SEED_ADMIN_PASSWORD(): string {
    return optional('SEED_ADMIN_PASSWORD');
  },

  get OPENAI_API_KEY(): string {
    return optional('OPENAI_API_KEY');
  },
  get GEMINI_API_KEY(): string {
    return optional('GEMINI_API_KEY');
  },
  get MAX_AI_TOKENS(): number {
    return integer('MAX_AI_TOKENS', 5000);
  },

  // --- Payments -------------------------------------------------------------

  // Guards /api/cron/payments-reconcile. Unset means the route refuses to run
  // rather than running unauthenticated.
  get CRON_SECRET(): string {
    return optional('CRON_SECRET');
  },

  // The mock provider is a real PaymentProvider, not a branch inside Bakong's
  // code. Registry registration additionally asserts NODE_ENV !== 'production';
  // this flag alone must never be enough to mint free coins.
  get PAYMENTS_MOCK_ENABLED(): boolean {
    return process.env.PAYMENTS_MOCK_ENABLED === 'true';
  },
  get PAYMENTS_MOCK_AUTOPAY_SECONDS(): number {
    return integer('PAYMENTS_MOCK_AUTOPAY_SECONDS', 0);
  },

  get PAYMENT_ORDER_TTL_SECONDS(): number {
    return integer('PAYMENT_ORDER_TTL_SECONDS', 600);
  },
  // Server-side poll debounce, held in PaymentOrder.lastCheckedAt so it is
  // correct across independent serverless invocations.
  get PAYMENT_SYNC_DEBOUNCE_MS(): number {
    return integer('PAYMENT_SYNC_DEBOUNCE_MS', 2500);
  },

  // Bakong Open API. Tokens expire (~90 days) and cannot be auto-rotated from a
  // stateless function; on an auth failure the order stays PENDING and the
  // reconcile cron recovers it once the token is manually replaced.
  get BAKONG_API_BASE_URL(): string {
    return process.env.BAKONG_API_BASE_URL || 'https://api-bakong.nbc.gov.kh';
  },
  get BAKONG_ACCESS_TOKEN(): string {
    return optional('BAKONG_ACCESS_TOKEN');
  },
  get BAKONG_ACCOUNT_ID(): string {
    return optional('BAKONG_ACCOUNT_ID');
  },
  get BAKONG_MERCHANT_NAME(): string {
    return process.env.BAKONG_MERCHANT_NAME || 'Resume Builder';
  },
  get BAKONG_MERCHANT_CITY(): string {
    return process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh';
  },
  // Both must be set together to issue a merchant-type KHQR; otherwise an
  // individual-type KHQR is generated from BAKONG_ACCOUNT_ID alone.
  get BAKONG_MERCHANT_ID(): string {
    return optional('BAKONG_MERCHANT_ID');
  },
  get BAKONG_ACQUIRING_BANK(): string {
    return optional('BAKONG_ACQUIRING_BANK');
  },
  get BAKONG_MOBILE_NUMBER(): string {
    return optional('BAKONG_MOBILE_NUMBER');
  },
  get BAKONG_STORE_LABEL(): string {
    return optional('BAKONG_STORE_LABEL');
  },
  get BAKONG_TERMINAL_LABEL(): string {
    return optional('BAKONG_TERMINAL_LABEL');
  },
  get BAKONG_REQUEST_TIMEOUT_MS(): number {
    return integer('BAKONG_REQUEST_TIMEOUT_MS', 10000);
  },
} as const;
