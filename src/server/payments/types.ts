import 'server-only';
import type { CurrencyKey, PaymentProviderKey } from '@/shared/types/coins';

/**
 * A PaymentProvider is a pure adapter over one payment network.
 *
 * It never imports Prisma, never reads or writes the database, and holds no
 * state that settlement depends on. Every persistence, idempotency and
 * coin-crediting decision lives in paymentService.ts, which is provider-
 * agnostic -- that is what makes adding a second provider one folder plus one
 * enum value instead of a re-review of the money path.
 */
export interface PaymentProviderCapabilities {
  qr: boolean;
  redirect: boolean;
  webhook: boolean;
  currencies: CurrencyKey[];
}

export interface CreateOrderInput {
  orderId: string;
  billNumber: string;
  userId: string;
  coinAmount: number;
  amountMinor: number;
  currency: CurrencyKey;
  description: string;
  expiresAt: Date;
}

export interface CreateOrderResult {
  qrPayload?: string;
  qrMd5?: string;
  checkoutUrl?: string;
  deepLink?: string;
  providerRef?: string;
}

export type ProviderPaymentState = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface CheckStatusInput {
  orderId: string;
  billNumber: string;
  qrMd5: string | null;
  providerRef: string | null;
  amountMinor: number;
  currency: CurrencyKey;
  expiresAt: Date;
}

export interface CheckStatusResult {
  state: ProviderPaymentState;
  // The provider's own identifier for the settled transaction. Stored on the
  // order under a unique index so two orders can never claim the same one.
  providerTxnId?: string;
  paidAmountMinor?: number;
  paidCurrency?: CurrencyKey;
  failureReason?: string;
}

export interface WebhookResult {
  billNumber?: string;
  qrMd5?: string;
  providerTxnId?: string;
  state: ProviderPaymentState;
  paidAmountMinor?: number;
  paidCurrency?: CurrencyKey;
  failureReason?: string;
}

export interface PaymentProvider {
  readonly id: PaymentProviderKey;
  readonly label: string;
  readonly capabilities: PaymentProviderCapabilities;

  isConfigured(): boolean;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  checkStatus(input: CheckStatusInput): Promise<CheckStatusResult>;
  verifyWebhook?(req: Request): Promise<WebhookResult>;
}

export type PaymentProviderErrorCode =
  | 'PROVIDER_UNCONFIGURED'
  | 'PROVIDER_AUTH'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_REJECTED';

export class PaymentProviderError extends Error {
  readonly code: PaymentProviderErrorCode;
  readonly provider: PaymentProviderKey;
  // Retryable failures leave the order PENDING: it is our credentials or the
  // network that broke, not the user's payment.
  readonly retryable: boolean;

  constructor(
    provider: PaymentProviderKey,
    code: PaymentProviderErrorCode,
    message: string,
    retryable = true
  ) {
    super(message);
    this.name = 'PaymentProviderError';
    this.provider = provider;
    this.code = code;
    this.retryable = retryable;
  }
}
