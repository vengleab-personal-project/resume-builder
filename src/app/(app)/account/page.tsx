import { Suspense } from 'react';
import { AccountView } from '@/client/views/Account/AccountView';

export const dynamic = 'force-dynamic';

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountView />
    </Suspense>
  );
}
