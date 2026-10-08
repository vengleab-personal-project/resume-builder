"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from '@/client/hooks/useTranslations';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { t } = useTranslations('admin');

  const tabs = [
    { href: '/admin/chat-models', label: t.nav.chatModels },
    { href: '/admin/action-costs', label: t.nav.actionCosts },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t.subtitle}</p>
          </div>
          <Link
            href="/builder"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            {t.backToApp}
          </Link>
        </div>

        <nav className="max-w-5xl mx-auto px-6 flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors',
                pathname.startsWith(tab.href)
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
};
