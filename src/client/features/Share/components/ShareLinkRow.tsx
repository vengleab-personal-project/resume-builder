import { useState } from 'react';
import { Check, Copy, KeyRound, Link2, Lock, RefreshCw, Trash2 } from 'lucide-react';
import type { Translations } from '@/client/hooks/useTranslations';
import { SHARE_PASSCODE_MIN_LENGTH } from '@/shared/config/share';
import type { ShareLinkDTO } from '@/shared/types/persistence';

export type ShareLinkRowProps = {
  link: ShareLinkDTO;
  url: string;
  isBusy: boolean;
  isCopied: boolean;
  labels: Translations['share'];
  onCopy: () => void;
  onToggleActive: () => void;
  onRefreshSnapshot: () => void;
  onChangePasscode: (passcode: string) => Promise<boolean>;
  onDelete: () => void;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const Badge = ({ children, tone }: { children: React.ReactNode; tone: 'slate' | 'indigo' | 'amber' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const ShareLinkRow = ({
  link,
  url,
  isBusy,
  isCopied,
  labels,
  onCopy,
  onToggleActive,
  onRefreshSnapshot,
  onChangePasscode,
  onDelete,
}: ShareLinkRowProps) => {
  // Local UI state only (is the inline passcode box open, what is typed in it).
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');

  const views = labels.views.replace('{count}', String(link.viewCount));
  const lastViewed = link.lastViewedAt
    ? labels.lastViewed.replace('{date}', formatDate(link.lastViewedAt))
    : labels.neverViewed;

  return (
    <li
      data-share-link={link.code}
      className={`flex flex-col gap-2.5 p-4 rounded-xl border transition-opacity ${
        link.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
      } ${isBusy ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-900 truncate">{link.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {link.access === 'PASSCODE' ? (
              <Badge tone="indigo">
                <Lock size={10} />
                {labels.badgePasscode}
              </Badge>
            ) : (
              <Badge tone="slate">
                <Link2 size={10} />
                {labels.badgeCode}
              </Badge>
            )}
            {link.content === 'SNAPSHOT' && link.snapshotAt ? (
              <Badge tone="amber">{labels.badgeSnapshot.replace('{date}', formatDate(link.snapshotAt))}</Badge>
            ) : (
              <Badge tone="slate">{labels.badgeLive}</Badge>
            )}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={link.isActive}
          onClick={onToggleActive}
          title={link.isActive ? labels.turnOff : labels.turnOn}
          className="flex items-center gap-2 shrink-0"
        >
          <span className={`text-xs font-semibold ${link.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {link.isActive ? labels.active : labels.disabled}
          </span>
          <span className={`relative w-9 h-5 rounded-full transition-colors ${link.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                link.isActive ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          className="flex-1 min-w-0 text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
        />
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          {isCopied ? labels.copied : labels.copy}
        </button>
      </div>

      {isEditingPasscode && (
        <form
          className="flex items-center gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await onChangePasscode(passcode)) {
              setPasscode('');
              setIsEditingPasscode(false);
            }
          }}
        >
          <input
            type="text"
            autoComplete="new-password"
            placeholder={labels.newPasscode}
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="flex-1 min-w-0 text-sm p-2 border border-slate-200 rounded-md"
          />
          <button
            type="submit"
            disabled={passcode.length < SHARE_PASSCODE_MIN_LENGTH}
            className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 rounded-md disabled:opacity-50"
          >
            {labels.savePasscode}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <span className="text-[11px] text-slate-500">
          {views} · {lastViewed}
        </span>
        <div className="flex items-center gap-1">
          {link.content === 'SNAPSHOT' && (
            <button
              type="button"
              onClick={onRefreshSnapshot}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <RefreshCw size={12} />
              {labels.updateCopy}
            </button>
          )}
          {link.access === 'PASSCODE' && (
            <button
              type="button"
              onClick={() => setIsEditingPasscode((open) => !open)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <KeyRound size={12} />
              {labels.changePasscode}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            title={labels.delete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </li>
  );
};
