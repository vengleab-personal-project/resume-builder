import type { AiActionKey } from './index';

export type CoinTransactionTypeKey = 'PURCHASE' | 'DEDUCTION' | 'REFUND' | 'ADMIN_ADJUSTMENT';

export type PaymentProviderKey = 'BAKONG' | 'MOCK';

export type PaymentOrderStatusKey = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELED';

export type CurrencyKey = 'KHR' | 'USD';

export interface CoinTransactionDTO {
  id: string;
  type: CoinTransactionTypeKey;
  amount: number;
  balanceAfter: number;
  relatedAction: AiActionKey | null;
  modelId: string | null;
  note: string | null;
  createdAt: string;
}

export interface CoinBalanceDTO {
  balance: number;
}

export interface CoinPackageDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  coinAmount: number;
  bonusCoins: number;
  totalCoins: number;
  priceMinor: number;
  currency: CurrencyKey;
  priceLabel: string;
}

export interface PaymentProviderOptionDTO {
  id: PaymentProviderKey;
  label: string;
  capabilities: {
    qr: boolean;
    redirect: boolean;
    webhook: boolean;
  };
}

export interface PaymentOrderDTO {
  id: string;
  provider: PaymentProviderKey;
  status: PaymentOrderStatusKey;
  coinAmount: number;
  bonusCoins: number;
  totalCoins: number;
  fiatAmountMinor: number;
  currency: CurrencyKey;
  priceLabel: string;
  billNumber: string;
  qrPayload: string | null;
  qrSvg: string | null;
  checkoutUrl: string | null;
  deepLink: string | null;
  failureReason: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
}

export interface InsufficientCoinsPayload {
  error: 'INSUFFICIENT_COINS';
  code: 'INSUFFICIENT_COINS';
  required: number;
  balance: number;
}

// Set on every successful AI response so the client can update the badge
// without a follow-up round trip. The 3 AI routes' bodies stay unwrapped.
export const COIN_BALANCE_HEADER = 'X-Coin-Balance';
