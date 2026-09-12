import { requireUser } from '@/server/auth/guards';
import { listAvailableProviders } from '@/server/payments/registry';
import { listCoinPackages } from '@/server/services/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/services/billingHttp';
import type { PaymentProviderOptionDTO } from '@/shared/types/coins';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withBillingErrors(async () => {
  await requireUser();

  const [packages, providers] = await Promise.all([listCoinPackages(), listAvailableProviders()]);

  const providerOptions: PaymentProviderOptionDTO[] = providers.map((provider) => ({
    id: provider.id,
    label: provider.label,
    capabilities: {
      qr: provider.capabilities.qr,
      redirect: provider.capabilities.redirect,
      webhook: provider.capabilities.webhook,
    },
  }));

  return jsonNoStore({ packages, providers: providerOptions });
});
