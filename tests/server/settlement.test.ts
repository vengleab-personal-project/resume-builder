import { describe, expect, it } from 'vitest';
import { decideSettlement } from '@/server/modules/billing/paymentService';

const order = { fiatAmountMinor: 400, currency: 'USD' };

describe('decideSettlement', () => {
  it('accepts an exact payment and an overpayment', () => {
    expect(decideSettlement(order, { paidAmountMinor: 400, paidCurrency: 'USD' })).toEqual({ ok: true });
    expect(decideSettlement(order, { paidAmountMinor: 900, paidCurrency: 'USD' })).toEqual({ ok: true });
  });

  it('refuses an underpayment', () => {
    expect(decideSettlement(order, { paidAmountMinor: 399, paidCurrency: 'USD' })).toEqual({
      ok: false,
      reason: 'AMOUNT_MISMATCH',
    });
  });

  it('refuses a payment whose amount the provider did not report', () => {
    expect(decideSettlement(order, { paidCurrency: 'USD' })).toEqual({ ok: false, reason: 'AMOUNT_UNVERIFIED' });
    expect(decideSettlement(order, {})).toEqual({ ok: false, reason: 'AMOUNT_UNVERIFIED' });
  });

  it('refuses a payment with no currency, however large', () => {
    expect(decideSettlement(order, { paidAmountMinor: 100000 })).toEqual({ ok: false, reason: 'AMOUNT_UNVERIFIED' });
  });

  it('refuses the wrong currency even when the number is big enough', () => {
    // 4100 riel is about one US dollar: 4100 >= 400 as bare numbers, and means nothing.
    expect(decideSettlement(order, { paidAmountMinor: 4100, paidCurrency: 'KHR' })).toEqual({
      ok: false,
      reason: 'CURRENCY_MISMATCH',
    });
  });

  it('treats a zero amount as reported, and too small', () => {
    expect(decideSettlement(order, { paidAmountMinor: 0, paidCurrency: 'USD' })).toEqual({
      ok: false,
      reason: 'AMOUNT_MISMATCH',
    });
  });
});
