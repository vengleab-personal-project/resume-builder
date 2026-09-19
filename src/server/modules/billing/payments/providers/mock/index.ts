import 'server-only';
import { createHash } from 'node:crypto';
import { serverEnv } from '@/server/config/env.server';
import {
  type CheckStatusInput,
  type CheckStatusResult,
  type CreateOrderInput,
  type CreateOrderResult,
  type PaymentProvider,
  type PaymentProviderCapabilities,
} from '../../types';

// Belt and braces. registry.ts already refuses to register this provider in
// production, but the module itself must be impossible to load there -- a
// working mock on the live site would mint free coins.
if (process.env.NODE_ENV === 'production') {
  throw new Error('The mock payment provider must never be loaded in production.');
}

const CAPABILITIES: PaymentProviderCapabilities = {
  qr: true,
  redirect: false,
  webhook: true,
  currencies: ['KHR', 'USD'],
};

interface MockOrderState {
  createdAt: number;
  paidAt: number | null;
}

// Process-local only, which is fine: the mock exists for local development and
// preview demos, both single-process. A restart simply leaves orders PENDING.
const orders = new Map<string, MockOrderState>();

function stateFor(billNumber: string): MockOrderState {
  let state = orders.get(billNumber);
  if (!state) {
    state = { createdAt: Date.now(), paidAt: null };
    orders.set(billNumber, state);
  }
  return state;
}

export function markMockOrderPaid(billNumber: string): void {
  stateFor(billNumber).paidAt = Date.now();
}

function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

export const mockProvider: PaymentProvider = {
  id: 'MOCK',
  label: 'Mock (development)',
  capabilities: CAPABILITIES,

  isConfigured(): boolean {
    return serverEnv.PAYMENTS_MOCK_ENABLED && !serverEnv.isProduction;
  },

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    stateFor(input.billNumber);

    // Shaped like a KHQR payload so the QR panel renders something realistic,
    // but deliberately not CRC-valid: no real wallet will ever accept it.
    const qrPayload = [
      'MOCKKHQR',
      input.billNumber,
      String(input.amountMinor),
      input.currency,
      String(input.expiresAt.getTime()),
    ].join('|');

    return { qrPayload, qrMd5: md5(qrPayload), providerRef: `mock_${input.orderId}` };
  },

  async checkStatus(input: CheckStatusInput): Promise<CheckStatusResult> {
    const state = stateFor(input.billNumber);
    const autopaySeconds = serverEnv.PAYMENTS_MOCK_AUTOPAY_SECONDS;

    if (
      state.paidAt === null &&
      autopaySeconds > 0 &&
      Date.now() - state.createdAt >= autopaySeconds * 1000
    ) {
      state.paidAt = Date.now();
    }

    if (state.paidAt !== null) {
      return {
        state: 'PAID',
        providerTxnId: `mock_txn_${md5(input.billNumber).slice(0, 24)}`,
        paidAmountMinor: input.amountMinor,
        paidCurrency: input.currency,
      };
    }

    return { state: input.expiresAt.getTime() < Date.now() ? 'EXPIRED' : 'PENDING' };
  },

  async verifyWebhook(req: Request) {
    const body = (await req.json().catch(() => ({}))) as {
      billNumber?: string;
      providerTxnId?: string;
      state?: string;
    };

    return {
      billNumber: body.billNumber,
      providerTxnId: body.providerTxnId ?? `mock_txn_${md5(body.billNumber ?? '')}`,
      state: body.state === 'FAILED' ? ('FAILED' as const) : ('PAID' as const),
    };
  },
};
