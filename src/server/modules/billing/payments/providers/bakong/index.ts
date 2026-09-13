import 'server-only';
import { BakongKHQR, IndividualInfo, MerchantInfo } from 'bakong-khqr';
import { serverEnv } from '@/server/config/env.server';
import { CURRENCY_NUMERIC, currencyFromNumeric, fromMinor, toMinor } from '../../currency';
import {
  PaymentProviderError,
  type CheckStatusInput,
  type CheckStatusResult,
  type CreateOrderInput,
  type CreateOrderResult,
  type PaymentProvider,
  type PaymentProviderCapabilities,
} from '../../types';
import { checkTransactionByMd5, isSettled, isTransactionNotFound } from './client';

const CAPABILITIES: PaymentProviderCapabilities = {
  qr: true,
  // Bakong's Open API is pull-based for third-party integrators: there is no
  // webhook to subscribe to, so the client polls and a cron reconciles.
  redirect: false,
  webhook: false,
  currencies: ['KHR', 'USD'],
};

// KHQR tag 62-01. Longer values are rejected by some wallet apps, and our
// generated bill numbers are ~14 characters, so this is only a guard.
const BILL_NUMBER_MAX_LENGTH = 25;

function shouldUseMerchantForm(): boolean {
  return Boolean(serverEnv.BAKONG_MERCHANT_ID && serverEnv.BAKONG_ACQUIRING_BANK);
}

export const bakongProvider: PaymentProvider = {
  id: 'BAKONG',
  label: 'Bakong (KHQR)',
  capabilities: CAPABILITIES,

  isConfigured(): boolean {
    return Boolean(serverEnv.BAKONG_ACCESS_TOKEN && serverEnv.BAKONG_ACCOUNT_ID);
  },

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!this.isConfigured()) {
      throw new PaymentProviderError(
        'BAKONG',
        'PROVIDER_UNCONFIGURED',
        'Bakong is not configured',
        false
      );
    }

    const optional = {
      currency: CURRENCY_NUMERIC[input.currency],
      amount: fromMinor(input.amountMinor, input.currency),
      billNumber: input.billNumber.slice(0, BILL_NUMBER_MAX_LENGTH),
      mobileNumber: serverEnv.BAKONG_MOBILE_NUMBER || undefined,
      storeLabel: serverEnv.BAKONG_STORE_LABEL || undefined,
      terminalLabel: serverEnv.BAKONG_TERMINAL_LABEL || undefined,
      // Required by the KHQR spec whenever the amount is non-zero: without it
      // wallets treat the code as static and reusable.
      expirationTimestamp: input.expiresAt.getTime(),
    };

    const khqr = new BakongKHQR();
    const response = shouldUseMerchantForm()
      ? khqr.generateMerchant(
          new MerchantInfo(
            serverEnv.BAKONG_ACCOUNT_ID,
            serverEnv.BAKONG_MERCHANT_NAME,
            serverEnv.BAKONG_MERCHANT_CITY,
            serverEnv.BAKONG_MERCHANT_ID,
            serverEnv.BAKONG_ACQUIRING_BANK,
            optional
          )
        )
      : khqr.generateIndividual(
          new IndividualInfo(
            serverEnv.BAKONG_ACCOUNT_ID,
            serverEnv.BAKONG_MERCHANT_NAME,
            serverEnv.BAKONG_MERCHANT_CITY,
            optional
          )
        );

    if (!response.data?.qr || !response.data.md5) {
      throw new PaymentProviderError(
        'BAKONG',
        'PROVIDER_REJECTED',
        `KHQR generation failed: ${response.status?.message ?? 'unknown error'}`,
        false
      );
    }

    return {
      qrPayload: response.data.qr,
      qrMd5: response.data.md5,
      providerRef: input.billNumber,
    };
  },

  async checkStatus(input: CheckStatusInput): Promise<CheckStatusResult> {
    if (!this.isConfigured()) {
      throw new PaymentProviderError(
        'BAKONG',
        'PROVIDER_UNCONFIGURED',
        'Bakong is not configured',
        false
      );
    }

    if (!input.qrMd5) {
      throw new PaymentProviderError(
        'BAKONG',
        'PROVIDER_REJECTED',
        'Order has no KHQR md5 to poll with',
        false
      );
    }

    const body = await checkTransactionByMd5(input.qrMd5);

    if (isSettled(body)) {
      const data = body.data!;
      const paidCurrency = currencyFromNumeric(data.currency) ?? input.currency;

      return {
        state: 'PAID',
        // The transaction hash is Bakong's own settled-transaction id; storing
        // it under @@unique([provider, providerTxnId]) is what stops two orders
        // claiming one real-world payment.
        providerTxnId: data.hash ?? data.externalRef ?? input.qrMd5,
        paidAmountMinor:
          typeof data.amount === 'number' ? toMinor(data.amount, paidCurrency) : undefined,
        paidCurrency,
      };
    }

    if (isTransactionNotFound(body)) {
      return { state: input.expiresAt.getTime() < Date.now() ? 'EXPIRED' : 'PENDING' };
    }

    throw new PaymentProviderError(
      'BAKONG',
      'PROVIDER_UNAVAILABLE',
      `Unexpected Bakong response ${body.responseCode}: ${body.responseMessage ?? ''}`
    );
  },
};
