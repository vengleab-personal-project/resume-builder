import { Loader2 } from 'lucide-react';
import type { Translations } from '@/client/hooks/useTranslations';
import type { NewShareLinkDraft, ShareFieldErrors } from '../useShareLinksLogic';

export type NewShareLinkFormProps = {
  draft: NewShareLinkDraft;
  errors: ShareFieldErrors;
  isCreating: boolean;
  canCancel: boolean;
  labels: Translations['share'];
  onChange: <K extends keyof NewShareLinkDraft>(key: K, value: NewShareLinkDraft[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

type ChoiceProps = {
  name: string;
  checked: boolean;
  title: string;
  hint: string;
  onSelect: () => void;
};

const Choice = ({ name, checked, title, hint, onSelect }: ChoiceProps) => (
  <label
    className={`flex gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
      checked ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:bg-slate-50'
    }`}
  >
    <input type="radio" name={name} checked={checked} onChange={onSelect} className="mt-0.5 accent-indigo-600" />
    <span className="flex flex-col">
      <span className="text-sm font-semibold text-slate-800">{title}</span>
      <span className="text-xs text-slate-500">{hint}</span>
    </span>
  </label>
);

const fieldLabel = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider';
const inputClass =
  'w-full text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none';

export const NewShareLinkForm = ({
  draft,
  errors,
  isCreating,
  canCancel,
  labels,
  onChange,
  onSubmit,
  onCancel,
}: NewShareLinkFormProps) => (
  <form
    className="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 bg-white"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <label className="flex flex-col gap-1.5">
      <span className={fieldLabel}>{labels.labelField}</span>
      <input
        name="share-label"
        value={draft.label}
        placeholder={labels.labelPlaceholder}
        onChange={(event) => onChange('label', event.target.value)}
        className={inputClass}
      />
      {errors.label && <span className="text-xs text-red-600">{errors.label}</span>}
    </label>

    <fieldset className="flex flex-col gap-2">
      <legend className={`${fieldLabel} mb-1.5`}>{labels.accessField}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Choice
          name="share-access"
          checked={draft.access === 'CODE'}
          title={labels.accessCode}
          hint={labels.accessCodeHint}
          onSelect={() => onChange('access', 'CODE')}
        />
        <Choice
          name="share-access"
          checked={draft.access === 'PASSCODE'}
          title={labels.accessPasscode}
          hint={labels.accessPasscodeHint}
          onSelect={() => onChange('access', 'PASSCODE')}
        />
      </div>
    </fieldset>

    {draft.access === 'PASSCODE' && (
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>{labels.passcodeField}</span>
        <input
          name="share-passcode"
          type="text"
          autoComplete="new-password"
          value={draft.passcode}
          onChange={(event) => onChange('passcode', event.target.value)}
          className={inputClass}
        />
        <span className={`text-xs ${errors.passcode ? 'text-red-600' : 'text-slate-500'}`}>
          {errors.passcode ?? labels.passcodeHint}
        </span>
      </label>
    )}

    <fieldset className="flex flex-col gap-2">
      <legend className={`${fieldLabel} mb-1.5`}>{labels.contentField}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Choice
          name="share-content"
          checked={draft.content === 'LIVE'}
          title={labels.contentLive}
          hint={labels.contentLiveHint}
          onSelect={() => onChange('content', 'LIVE')}
        />
        <Choice
          name="share-content"
          checked={draft.content === 'SNAPSHOT'}
          title={labels.contentSnapshot}
          hint={labels.contentSnapshotHint}
          onSelect={() => onChange('content', 'SNAPSHOT')}
        />
      </div>
    </fieldset>

    <div className="flex items-center gap-2">
      <button
        type="submit"
        disabled={isCreating}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {isCreating && <Loader2 size={14} className="animate-spin" />}
        {isCreating ? labels.creating : labels.create}
      </button>
      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {labels.cancel}
        </button>
      )}
    </div>
  </form>
);
