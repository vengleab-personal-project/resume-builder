"use client";

import { FileX, Loader2, Printer, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { PasscodeForm } from './components/PasscodeForm';
import { SharedDocument } from './components/SharedDocument';
import { useSharedResumeLogic } from './useSharedResumeLogic';

export type SharedResumeProps = {
  code: string;
  needsPasscode: boolean;
};

/** The public page behind a share link: passcode (if any), then the CV. No app chrome. */
export default function SharedResume({ code, needsPasscode }: SharedResumeProps) {
  const { t } = useTranslations('share');
  const vm = useSharedResumeLogic(code, needsPasscode);
  const labels = t.viewer;

  if (vm.phase === 'ready' && vm.content) {
    return (
      <div className="h-screen flex flex-col bg-slate-100 print:block print:h-auto print:bg-white">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-white border-b border-slate-200 print:hidden">
          <span className="text-sm font-semibold text-slate-700">{labels.title}</span>
          <button
            type="button"
            onClick={vm.print}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <Printer size={14} />
            {labels.print}
          </button>
        </header>
        <SharedDocument content={vm.content} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      {vm.phase === 'passcode' && (
        <PasscodeForm
          passcode={vm.passcode}
          error={vm.passcodeError}
          isSubmitting={vm.isSubmitting}
          labels={labels}
          onChange={vm.setPasscode}
          onSubmit={vm.submitPasscode}
        />
      )}

      {vm.phase === 'loading' && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          {labels.loading}
        </div>
      )}

      {vm.phase === 'unavailable' && (
        <div className="max-w-sm text-center flex flex-col items-center gap-3">
          <FileX size={32} className="text-slate-300" />
          <h1 className="text-lg font-bold text-slate-900">{labels.unavailableTitle}</h1>
          <p className="text-sm text-slate-500">{labels.unavailableBody}</p>
        </div>
      )}

      {vm.phase === 'failed' && (
        <div className="max-w-sm text-center flex flex-col items-center gap-3">
          <p className="text-sm text-slate-500">{labels.failed}</p>
          <button
            type="button"
            onClick={vm.retry}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            <RefreshCw size={14} />
            {t.retry}
          </button>
        </div>
      )}
    </div>
  );
}
