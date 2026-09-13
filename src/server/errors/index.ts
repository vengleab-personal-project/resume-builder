import 'server-only';
import { NextResponse } from 'next/server';
import type { AuthErrorCode } from '@/shared/types/auth';

export class HttpError extends Error {
  readonly status: number;
  readonly code: AuthErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: AuthErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status }
    );
  }

  console.error('Unhandled route error:', error);
  return NextResponse.json({ error: 'INTERNAL_ERROR' as AuthErrorCode }, { status: 500 });
}

export function withErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
