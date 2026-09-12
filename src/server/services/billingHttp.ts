import 'server-only';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/server/auth/guards';
import { PaymentProviderError } from '@/server/payments/types';
import { COIN_BALANCE_HEADER } from '@/shared/types/coins';
import { InsufficientCoinsError } from './coinService';
import { PaymentError } from './paymentService';

export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

export function jsonNoStore(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...(init?.headers ?? {}) },
  });
}

export function withCoinBalanceHeader(response: NextResponse, balance: number): NextResponse {
  response.headers.set(COIN_BALANCE_HEADER, String(balance));
  return response;
}

/**
 * Maps the billing layer's typed errors onto HTTP, or returns null so a caller
 * with its own error handling (the 3 AI routes) keeps owning everything else.
 */
export function tryBillingErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof InsufficientCoinsError) {
    return jsonNoStore(
      {
        error: error.code,
        code: error.code,
        required: error.required,
        balance: error.balance,
      },
      { status: 402 }
    );
  }

  if (error instanceof PaymentError) {
    return jsonNoStore({ error: error.code, message: error.message }, { status: error.status });
  }

  if (error instanceof PaymentProviderError) {
    console.error(`Payment provider ${error.provider} failed (${error.code}):`, error.message);
    return jsonNoStore(
      { error: error.code, message: error.message },
      { status: error.code === 'PROVIDER_UNCONFIGURED' ? 400 : 503 }
    );
  }

  return null;
}

export function billingErrorResponse(error: unknown): NextResponse {
  return tryBillingErrorResponse(error) ?? errorResponse(error);
}

export function withBillingErrors<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return billingErrorResponse(error);
    }
  };
}
