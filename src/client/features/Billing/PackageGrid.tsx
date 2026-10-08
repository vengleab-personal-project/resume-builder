"use client";

import { Coins, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslations } from '@/client/hooks/useTranslations';
import type { CoinPackageDTO, PaymentProviderOptionDTO, PaymentProviderKey } from '@/shared/types/coins';

interface PackageGridProps {
  packages: CoinPackageDTO[];
  providers: PaymentProviderOptionDTO[];
  provider: PaymentProviderKey | null;
  onProviderChange: (provider: PaymentProviderKey) => void;
  onSelect: (packageId: string) => void;
  isLoading: boolean;
  isCreating: boolean;
  requiredCoins: number | null;
}

export function PackageGrid({
  packages,
  providers,
  provider,
  onProviderChange,
  onSelect,
  isLoading,
  isCreating,
  requiredCoins,
}: PackageGridProps) {
  const { t } = useTranslations('billing');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (packages.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">{t.noPackages}</p>;
  }

  return (
    <div className="space-y-4">
      {requiredCoins !== null && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {t.requiredNotice.replace('{count}', String(requiredCoins))}
        </div>
      )}

      {providers.length > 1 && (
        <div className="flex gap-2">
          {providers.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onProviderChange(option.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                provider === option.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {packages.map((pkg) => {
          const covers = requiredCoins === null || pkg.totalCoins >= requiredCoins;

          return (
            <button
              key={pkg.id}
              type="button"
              disabled={isCreating}
              onClick={() => onSelect(pkg.id)}
              className={clsx(
                'text-left rounded-xl border p-4 transition-all disabled:opacity-50',
                covers
                  ? 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                  : 'border-slate-200 opacity-60 hover:opacity-100'
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {pkg.name}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-slate-900 tabular-nums">
                <Coins size={18} className="text-amber-500" />
                {pkg.totalCoins}
              </p>
              {pkg.bonusCoins > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  {t.bonus.replace('{count}', String(pkg.bonusCoins))}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold text-indigo-600">{pkg.priceLabel}</p>
              {pkg.description && (
                <p className="mt-1 text-[11px] leading-snug text-slate-400">{pkg.description}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
