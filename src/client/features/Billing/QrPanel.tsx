"use client";

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import type { PaymentOrderDTO } from '@/shared/types/coins';

interface QrPanelProps {
  order: PaymentOrderDTO;
  isMockProvider: boolean;
  onCancel: () => void;
  onMockPay: () => void;
}

function useCountdown(expiresAt: string): number {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining;
}

export function QrPanel({ order, isMockProvider, onCancel, onMockPay }: QrPanelProps) {
  const { t } = useTranslations('billing');
  const remaining = useCountdown(order.expiresAt);

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-slate-500">{t.scanToPay}</p>
        <p className="text-2xl font-bold text-slate-900">{order.priceLabel}</p>
        <p className="text-xs text-slate-400">
          {t.forCoins.replace('{count}', String(order.totalCoins))}
        </p>
      </div>

      {order.qrSvg ? (
        <div
          className="w-56 h-56 [&>svg]:w-full [&>svg]:h-full rounded-xl border border-slate-200 bg-white p-2"
          // The SVG is generated server-side by the `qrcode` library from our own
          // stored payload; it never contains user-supplied markup.
          dangerouslySetInnerHTML={{ __html: order.qrSvg }}
        />
      ) : order.checkoutUrl ? (
        <a
          href={order.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {t.openCheckout}
          <ExternalLink size={14} />
        </a>
      ) : (
        <div className="flex h-56 w-56 items-center justify-center text-slate-300">
          <Loader2 size={28} className="animate-spin" />
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 size={13} className="animate-spin" />
        {t.waitingForPayment}
        <span className="font-semibold tabular-nums text-slate-700">
          {minutes}:{seconds}
        </span>
      </div>

      <p className="text-[11px] text-slate-400">
        {t.reference}: <span className="font-mono">{order.billNumber}</span>
      </p>

      {order.deepLink && (
        <a
          href={order.deepLink}
          className="text-xs font-semibold text-indigo-600 hover:underline sm:hidden"
        >
          {t.openInBankApp}
        </a>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          {t.cancelOrder}
        </button>

        {isMockProvider && (
          <button
            type="button"
            onClick={onMockPay}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            {t.simulatePayment}
          </button>
        )}
      </div>
    </div>
  );
}
