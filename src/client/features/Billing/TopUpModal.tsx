"use client";

import { X } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { PackageGrid } from './PackageGrid';
import { QrPanel } from './QrPanel';
import { ErrorPanel, SuccessPanel } from './StatusPanels';
import { useTopUpLogic } from './useTopUpLogic';

export function TopUpModal() {
  const { t } = useTranslations('billing');
  const vm = useTopUpLogic();

  if (!vm.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.title}</h2>
            <p className="text-xs text-slate-400">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={vm.close}
            aria-label={t.closeLabel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {vm.step === 'select' && (
            <PackageGrid
              packages={vm.packages}
              providers={vm.providers}
              provider={vm.provider}
              onProviderChange={vm.setProvider}
              onSelect={vm.selectPackage}
              isLoading={vm.isLoading}
              isCreating={vm.isCreating}
              requiredCoins={vm.requiredCoins}
            />
          )}

          {vm.step === 'pay' && vm.order && (
            <QrPanel
              order={vm.order}
              isMockProvider={vm.isMockProvider}
              onCancel={vm.cancelOrder}
              onMockPay={vm.payWithMock}
            />
          )}

          {vm.step === 'success' && (
            <SuccessPanel coins={vm.order?.totalCoins ?? 0} onDone={vm.finish} />
          )}

          {vm.step === 'error' && (
            <ErrorPanel message={vm.error ?? t.errors.createFailed} onRetry={vm.retry} />
          )}
        </div>
      </div>
    </div>
  );
}
