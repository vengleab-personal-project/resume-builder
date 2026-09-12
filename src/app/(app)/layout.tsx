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
      <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
        <GlobalSidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {children}
        </main>
      </div>
      {/* Mounted once here: any screen can open it through the coin store
          without each one rendering its own copy. */}
      <TopUpModal />
    </AppSessionProvider>
  );
}
