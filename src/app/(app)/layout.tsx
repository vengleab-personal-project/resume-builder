import React from 'react';
import { GlobalSidebar } from '@/client/components/layouts/GlobalSidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
      <GlobalSidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}
