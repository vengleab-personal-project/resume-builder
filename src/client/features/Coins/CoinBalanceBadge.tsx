"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslations } from '@/client/hooks/useTranslations';
import { useCoinBalanceLogic } from './useCoinBalanceLogic';

export function CoinBalanceBadge() {
  const { t } = useTranslations('coins');
  const pathname = usePathname();
  const vm = useCoinBalanceLogic();

  if (!vm.isSignedIn) return null;

  // Links to /billing rather than opening the top-up modal directly: the modal
  // is the response to a 402, while the badge is the standing "where did my
  // coins go" affordance, and /billing is the only entry point to the history.
  return (
    <Link
      href="/billing"
      title={t.badgeTooltip}
      className={clsx(
        'w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all group relative',
        pathname.startsWith('/billing')
          ? 'bg-amber-400/10 text-amber-200'
          : 'text-amber-300 hover:bg-amber-400/10 hover:text-amber-200'
      )}
    >
      <Coins size={16} />
      <span className="text-[9px] font-bold mt-0.5 tabular-nums">
        {vm.balance === null ? '—' : vm.balance}
      </span>
      <div className="absolute left-14 px-2.5 py-1 bg-slate-800 text-slate-200 text-[11px] font-semibold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
        {vm.balance === null ? t.badgeTooltip : `${vm.balance} ${t.unit} · ${t.badgeTooltip}`}
      </div>
    </Link>
  );
}
