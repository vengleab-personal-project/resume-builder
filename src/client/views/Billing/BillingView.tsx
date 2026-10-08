"use client";

import { Coins, Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslations } from '@/client/hooks/useTranslations';
import { useLocaleStore } from '@/client/store/locale-store';
import { useBillingLogic } from './useBillingLogic';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
  CANCELED: 'bg-slate-100 text-slate-500',
};

export function BillingView() {
  const { t } = useTranslations('billing');
  const { locale } = useLocaleStore();
  const vm = useBillingLogic();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'km' ? 'km-KH' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t.pageTitle}</h1>
            <p className="text-sm text-slate-500">{t.pageSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={vm.openTopUp}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Plus size={15} />
            {t.topUp}
          </button>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.currentBalance}
          </p>
          <p className="mt-1 flex items-center gap-2 text-4xl font-bold text-slate-900 tabular-nums">
            <Coins size={28} className="text-amber-500" />
            {vm.balance ?? '—'}
          </p>
        </section>

        {vm.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{vm.error}</p>
        )}

        <section className="rounded-2xl bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold text-slate-900">
            {t.ordersTitle}
          </h2>

          {vm.isLoading ? (
            <div className="flex justify-center py-10 text-slate-300">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : vm.orders.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">{t.noOrders}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {vm.orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {order.totalCoins} {t.coinsLabel} · {order.priceLabel}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {order.billNumber} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {t.orderStatus[order.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold text-slate-900">
            {t.historyTitle}
          </h2>

          {vm.isLoading ? (
            <div className="flex justify-center py-10 text-slate-300">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : vm.transactions.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">{t.noTransactions}</p>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {vm.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {t.transactionType[tx.type]}
                        {tx.relatedAction && (
                          <span className="text-slate-400"> · {t.action[tx.relatedAction]}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={clsx(
                          'text-sm font-bold tabular-nums',
                          tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-700'
                        )}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount}
                      </p>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        {t.balanceAfter}: {tx.balanceAfter}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {vm.hasMore && (
                <div className="px-6 py-4">
                  <button
                    type="button"
                    onClick={vm.loadMore}
                    disabled={vm.isLoadingMore}
                    className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {vm.isLoadingMore ? t.loadingMore : t.loadMore}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
