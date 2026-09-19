import React from 'react';
import { GlobalSidebar } from '@/client/components/layouts/GlobalSidebar';
import { AppSessionProvider } from '@/client/components/layouts/AppSessionProvider';
import { TopUpModal } from '@/client/features/Billing';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSessionProvider>
      {/* Column on phones so the sidebar's top bar stacks above the page, row
          from lg up where the sidebar is a real column beside it. */}
      <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 lg:flex-row">
        <GlobalSidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
      {/* Mounted once here: any screen can open it through the coin store
          without each one rendering its own copy. */}
      <TopUpModal />
    </AppSessionProvider>
  );
}
