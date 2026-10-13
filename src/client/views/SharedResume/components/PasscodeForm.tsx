import { Loader2, Lock } from 'lucide-react';
import type { Translations } from '@/client/hooks/useTranslations';
import type { PasscodeError } from '../useSharedResumeLogic';

export type PasscodeFormProps = {
  passcode: string;
  error: PasscodeError;
  isSubmitting: boolean;
  labels: Translations['share']['viewer'];
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export const PasscodeForm = ({ passcode, error, isSubmitting, labels, onChange, onSubmit }: PasscodeFormProps) => {
  const message =
    error === 'wrong'
      ? labels.wrongPasscode
      : error === 'rateLimited'
        ? labels.tooManyAttempts
        : error === 'again'
          ? labels.passcodeAgain
          : null;

  return (
    <form
      className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <Lock size={18} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-slate-900">{labels.passcodeTitle}</h1>
        <p className="text-sm text-slate-500 mt-1">{labels.passcodePrompt}</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{labels.passcodeLabel}</span>
        <input
          type="password"
          autoComplete="off"
          autoFocus
          value={passcode}
          onChange={(event) => onChange(event.target.value)}
          className="w-full text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
        />
      </label>
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={!passcode || isSubmitting}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
        {isSubmitting ? labels.checking : labels.submit}
      </button>
    </form>
  );
};
