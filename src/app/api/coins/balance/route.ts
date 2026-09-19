import { requireUser } from '@/server/modules/auth/guards';
import { getBalance } from '@/server/modules/billing/coinService';
import { jsonNoStore, withBillingErrors } from '@/server/modules/billing/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withBillingErrors(async () => {
  const user = await requireUser();
  return jsonNoStore({ balance: await getBalance(user.id) });
});
