import 'server-only';
import { serverEnv } from '@/server/config/env.server';
import type { PaymentProviderKey } from '@/shared/types/coins';
import { bakongProvider } from './providers/bakong';
import { PaymentProviderError, type PaymentProvider } from './types';

// The mock is reached through a dynamic import rather than a top-level one so
// its module-load production assertion is never evaluated during a production
// build, and its code never ends up in a production bundle at all.
async function loadMockProvider(): Promise<PaymentProvider | null> {
  if (serverEnv.isProduction) return null;
  if (!serverEnv.PAYMENTS_MOCK_ENABLED) return null;

  const { mockProvider } = await import('./providers/mock');
  return mockProvider;
}

export async function listPaymentProviders(): Promise<PaymentProvider[]> {
  const providers: PaymentProvider[] = [bakongProvider];

  const mock = await loadMockProvider();
  if (mock) providers.push(mock);

  return providers;
}

/** Providers that are both registered and actually usable right now. */
export async function listAvailableProviders(): Promise<PaymentProvider[]> {
  const providers = await listPaymentProviders();
  return providers.filter((provider) => provider.isConfigured());
}

export async function getPaymentProvider(id: PaymentProviderKey): Promise<PaymentProvider> {
  const providers = await listPaymentProviders();
  const provider = providers.find((candidate) => candidate.id === id);

  if (!provider) {
    throw new PaymentProviderError(
      id,
      'PROVIDER_UNCONFIGURED',
      `Unknown payment provider: ${id}`,
      false
    );
  }

  return provider;
}

export async function getConfiguredProvider(id: PaymentProviderKey): Promise<PaymentProvider> {
  const provider = await getPaymentProvider(id);

  if (!provider.isConfigured()) {
    throw new PaymentProviderError(
      id,
      'PROVIDER_UNCONFIGURED',
      `Payment provider ${id} is not configured`,
      false
    );
  }

  return provider;
}

export function isPaymentProviderKey(value: unknown): value is PaymentProviderKey {
  return value === 'BAKONG' || value === 'MOCK';
}
