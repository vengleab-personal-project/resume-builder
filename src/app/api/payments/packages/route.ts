import { requireUser } from '@/server/modules/auth/guards';
import { listAvailableProviders } from '@/server/modules/billing/payments/registry';
import { listCoinPackages } from '@/server/modules/billing/paymentService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';
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
