import React from 'react';
import { redirect } from 'next/navigation';
import { GlobalSidebar } from '@/client/components/layouts/GlobalSidebar';
import { AppSessionProvider } from '@/client/components/layouts/AppSessionProvider';
import { TopUpModal } from '@/client/features/Billing';
import { getCurrentUser } from '@/server/modules/auth/getCurrentUser';
import { AUTH_ROUTES } from '@/shared/config/auth';

// Never prerender: the session check has to run per request, and there is no
// DATABASE_URL at build time.
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every page in this group needs a signed-in user. The middleware redirect is
  // only a fast path whose matcher can drift from the route list; this check
  // cannot. The data behind each page is still gated by requireUser() in the API.
  const user = await getCurrentUser();
  if (!user) {
    redirect(AUTH_ROUTES.LOGIN);
  }

  return (
    <AppSessionProvider>
      {/* Column on phones so the sidebar's top bar stacks above the page, row
          from lg up where the sidebar is a real column beside it. */}
      <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 lg:flex-row print:block print:h-auto print:overflow-visible">
        <GlobalSidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">
          {children}
        </main>
      </div>
      {/* Mounted once here: any screen can open it through the coin store
          without each one rendering its own copy. */}
      <TopUpModal />
    </AppSessionProvider>
  );
}
