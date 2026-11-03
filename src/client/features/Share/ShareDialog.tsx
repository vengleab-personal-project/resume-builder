"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, RefreshCw, Share2, ShieldCheck, X } from 'lucide-react';
import { NewShareLinkForm } from './components/NewShareLinkForm';
import { ShareLinkRow } from './components/ShareLinkRow';
import { useShareLinksLogic } from './useShareLinksLogic';

export type ShareDialogProps = {
  /** The FULL resume to share; null closes nothing but renders nothing. */
  resumeId: string | null;
  resumeTitle: string;
  open: boolean;
  onClose: () => void;
};

/** Manage a resume's share links: create, copy, turn on/off, refresh, re-key, delete. */
export const ShareDialog = ({ resumeId, resumeTitle, open, onClose }: ShareDialogProps) => {
  const vm = useShareLinksLogic(resumeId, open);
  const { t } = vm;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Opened only by a click, so never during server rendering - but the portal target
  // must exist all the same.
  if (!open || !resumeId || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 bg-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 id="share-dialog-title" className="text-lg font-semibold text-slate-900">
                {t.title}
              </h2>
              <p className="text-xs text-slate-500 truncate">{t.subtitle.replace('{title}', resumeTitle)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title={t.close}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {vm.notice && (
            <p role="status" className="text-sm px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700">
              {vm.notice}
            </p>
          )}

          {vm.status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              {t.loading}
            </div>
          )}

          {vm.status === 'error' && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {t.loadFailed}
              <button
                type="button"
                onClick={vm.retry}
                className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700"
              >
                <RefreshCw size={13} />
                {t.retry}
              </button>
            </div>
          )}

          {vm.status === 'ready' && (
            <>
              {vm.isFormOpen ? (
                <NewShareLinkForm
                  draft={vm.draft}
                  errors={vm.fieldErrors}
                  isCreating={vm.isCreating}
                  canCancel={vm.links.length > 0}
                  labels={t}
                  onChange={vm.updateDraft}
                  onSubmit={vm.create}
                  onCancel={vm.closeForm}
                />
              ) : (
                <button
                  type="button"
                  onClick={vm.openForm}
                  className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <Plus size={15} />
                  {t.newLink}
                </button>
              )}

              {vm.links.length === 0 && !vm.isFormOpen && <p className="text-sm text-slate-500">{t.empty}</p>}

              <ul className="flex flex-col gap-3">
                {vm.links.map((link) => (
                  <ShareLinkRow
                    key={link.id}
                    link={link}
                    url={vm.shareUrl(link)}
                    isBusy={vm.busyId === link.id}
                    isCopied={vm.copiedId === link.id}
                    labels={t}
                    onCopy={() => void vm.copy(link)}
                    onToggleActive={() => void vm.toggleActive(link)}
                    onRefreshSnapshot={() => void vm.refreshSnapshot(link)}
                    onChangePasscode={(passcode) => vm.changePasscode(link, passcode)}
                    onDelete={() => void vm.remove(link)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        <p className="flex items-start gap-2 px-5 py-3 text-[11px] text-slate-500 border-t border-slate-200 bg-white">
          <ShieldCheck size={14} className="shrink-0 text-emerald-600 mt-px" />
          {t.botNote}
        </p>
      </div>
    </div>,
    document.body
  );
};
