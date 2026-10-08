import 'server-only';
import { serverEnv } from '@/server/config/env.server';
import { PaymentProviderError } from '../../types';

// Shape of `POST /v1/check_transaction_by_md5` on Bakong's Open API.
// responseCode 0 = found and settled; responseCode 1 with errorCode 1 = not
// found yet (the normal "still waiting" answer while polling).
export interface BakongTransactionData {
  hash?: string;
  fromAccountId?: string;
  toAccountId?: string;
  currency?: string;
  amount?: number;
  description?: string;
  externalRef?: string;
  createdDateMs?: number;
  acknowledgedDateMs?: number;
}

export interface BakongCheckResponse {
  responseCode: number;
  responseMessage?: string;
  errorCode?: number | null;
  data?: BakongTransactionData | null;
}

const NOT_FOUND_ERROR_CODE = 1;

export function isTransactionNotFound(body: BakongCheckResponse): boolean {
  if (body.responseCode === 0) return false;
  if (body.errorCode === NOT_FOUND_ERROR_CODE) return true;
  return /not\s*be?\s*found|no\s+record/i.test(body.responseMessage ?? '');
}

export function isSettled(body: BakongCheckResponse): boolean {
  return body.responseCode === 0 && !!body.data;
}

/**
 * Developer tokens expire roughly every 90 days and renewal requires a
 * registered email, which a stateless function cannot do. An auth failure is
 * therefore reported as retryable: the caller leaves the order PENDING (our
 * credentials broke, not the user's payment) and the reconcile cron picks it up
 * once the token has been rotated by hand.
 */
export async function checkTransactionByMd5(md5: string): Promise<BakongCheckResponse> {
  const baseUrl = serverEnv.BAKONG_API_BASE_URL.replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), serverEnv.BAKONG_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/check_transaction_by_md5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverEnv.BAKONG_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ md5 }),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    throw new PaymentProviderError(
      'BAKONG',
      'PROVIDER_UNAVAILABLE',
      `Bakong request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    console.error(
      'Bakong rejected our credentials (HTTP %d). The developer token has most likely expired and must be rotated manually.',
      response.status
    );
    throw new PaymentProviderError(
      'BAKONG',
      'PROVIDER_AUTH',
      'Bakong access token was rejected'
    );
  }

  const body = (await response.json().catch(() => null)) as BakongCheckResponse | null;

  if (!body || typeof body.responseCode !== 'number') {
    throw new PaymentProviderError(
      'BAKONG',
      'PROVIDER_UNAVAILABLE',
      `Unreadable Bakong response (HTTP ${response.status})`
    );
  }

  // A non-2xx that still carried a structured "not found" body is a normal
  // still-pending answer, not an outage.
  if (!response.ok && !isTransactionNotFound(body)) {
    throw new PaymentProviderError(
      'BAKONG',
      'PROVIDER_UNAVAILABLE',
      `Bakong returned HTTP ${response.status}: ${body.responseMessage ?? 'unknown error'}`
    );
  }

  return body;
}
