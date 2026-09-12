import { requireUser } from '@/server/auth/guards';
import { getBalance } from '@/server/services/coinService';
import { jsonNoStore, withBillingErrors } from '@/server/services/billingHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withBillingErrors(async () => {
  const user = await requireUser();
  return jsonNoStore({ balance: await getBalance(user.id) });
});
