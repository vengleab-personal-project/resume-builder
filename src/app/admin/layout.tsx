import React from 'react';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/client/views/Admin/AdminShell';
import { getCurrentUser } from '@/server/auth/getCurrentUser';
import { ADMIN_PATH_PREFIX, AUTH_ROUTES } from '@/shared/config/auth';

// Never prerender: the role check has to run per request, and there is no
// DATABASE_URL at build time.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // getCurrentUser re-reads the role from Postgres, so this is a real check and
  // not just the middleware's stale-claim fast path.
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${AUTH_ROUTES.LOGIN}?next=${ADMIN_PATH_PREFIX}`);
  }

  if (user.role !== 'ADMIN') {
    redirect(AUTH_ROUTES.AFTER_LOGIN);
  }

  return <AdminShell>{children}</AdminShell>;
}
