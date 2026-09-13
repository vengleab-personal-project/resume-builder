import type { CurrencyKey } from '@/shared/types/coins';

// Money is stored and compared exclusively in integer minor units. KHR has no
// minor unit at all (exponent 0); USD has two. Converting to a float anywhere
// near a comparison is how "paid 9.999999 of 10.00" bugs happen.
const MINOR_UNIT_EXPONENT: Readonly<Record<CurrencyKey, number>> = {
  KHR: 0,
  USD: 2,
};

const CURRENCY_SYMBOL: Readonly<Record<CurrencyKey, string>> = {
  KHR: '៛',
  USD: '$',
};

// ISO 4217 numeric codes, which is what the KHQR payload carries.
export const CURRENCY_NUMERIC: Readonly<Record<CurrencyKey, number>> = {
  KHR: 116,
  USD: 840,
};

export function minorUnitExponent(currency: CurrencyKey): number {
  return MINOR_UNIT_EXPONENT[currency];
}

export function minorUnitFactor(currency: CurrencyKey): number {
  return 10 ** MINOR_UNIT_EXPONENT[currency];
}

export function toMinor(majorAmount: number, currency: CurrencyKey): number {
  return Math.round(majorAmount * minorUnitFactor(currency));
}

export function fromMinor(amountMinor: number, currency: CurrencyKey): number {
  return amountMinor / minorUnitFactor(currency);
}

export function formatMinor(amountMinor: number, currency: CurrencyKey): string {
  const exponent = MINOR_UNIT_EXPONENT[currency];
  const value = fromMinor(amountMinor, currency).toFixed(exponent);
  const [whole, fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const amount = fraction ? `${grouped}.${fraction}` : grouped;

  return currency === 'KHR' ? `${amount}${CURRENCY_SYMBOL.KHR}` : `${CURRENCY_SYMBOL.USD}${amount}`;
}

export function isSupportedCurrency(value: unknown): value is CurrencyKey {
  return value === 'KHR' || value === 'USD';
}

export function currencyFromNumeric(numeric: number | string | undefined): CurrencyKey | null {
  const code = typeof numeric === 'string' ? Number.parseInt(numeric, 10) : numeric;
  if (code === CURRENCY_NUMERIC.KHR) return 'KHR';
  if (code === CURRENCY_NUMERIC.USD) return 'USD';
  return null;
}
