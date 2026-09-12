"use client";

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';

export function SuccessPanel({ coins, onDone }: { coins: number; onDone: () => void }) {
  const { t } = useTranslations('billing');

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 size={44} className="text-emerald-500" />
      <p className="text-lg font-bold text-slate-900">{t.successTitle}</p>
      <p className="text-sm text-slate-500">
        {t.successBody.replace('{count}', String(coins))}
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {t.done}
      </button>
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslations('billing');

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <AlertTriangle size={44} className="text-red-500" />
      <p className="text-lg font-bold text-slate-900">{t.errorTitle}</p>
      <p className="text-sm text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}
