"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Sparkles, Settings, FileCode2, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from '@/client/hooks/useTranslations';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function GlobalSidebar() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useTranslations('sidebar');

  const navItems = [
    { name: t.resumeBuilder, href: '/builder', icon: FileText },
    { name: t.aiEvaluation, href: '/evaluation', icon: Sparkles },
  ];

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'km' : 'en');
  };

  return (
    <aside className="w-16 flex-shrink-0 bg-slate-900 flex flex-col items-center py-4 z-50 h-full overflow-hidden print:hidden">
      {/* Top Logo */}
      <Link
        href="/"
        title={t.backToHome}
        className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-8 hover:scale-105 hover:bg-indigo-500 transition-all shadow-md"
      >
        <FileCode2 size={20} strokeWidth={2.5} />
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon size={20} className={cn("transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
              
              {/* Tooltip */}
              <div className="absolute left-14 px-2.5 py-1 bg-slate-800 text-slate-200 text-[11px] font-semibold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto w-full px-3 flex flex-col items-center gap-3">
        {/* Language Switch Button */}
        <button
          type="button"
          onClick={toggleLanguage}
          title={`${t.language}: ${locale.toUpperCase()}`}
          className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all group relative"
        >
          <Globe size={16} />
          <span className="text-[9px] font-bold mt-0.5 tracking-wider uppercase text-indigo-400">
            {locale === 'en' ? 'EN' : 'ខ្មែរ'}
          </span>
          <div className="absolute left-14 px-2.5 py-1 bg-slate-800 text-slate-200 text-[11px] font-semibold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
            {locale === 'en' ? 'Switch to ភាសាខ្មែរ' : 'Switch to English'}
          </div>
        </button>

        <button
          title={t.settings}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all group relative"
        >
          <Settings size={20} />
          <div className="absolute left-14 px-2.5 py-1 bg-slate-800 text-slate-200 text-[11px] font-semibold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
            {t.settings}
          </div>
        </button>
      </div>
    </aside>
  );
}
