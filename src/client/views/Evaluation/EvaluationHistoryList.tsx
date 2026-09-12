"use client";

import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import type { EvaluationSummary } from '@/shared/types/persistence';

interface EvaluationHistoryListProps {
  entries: EvaluationSummary[];
  isLoading: boolean;
  failed: boolean;
  hasMore: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
}

export const EvaluationHistoryList = ({
  entries,
  isLoading,
  failed,
  hasMore,
  onOpen,
  onDelete,
  onLoadMore,
}: EvaluationHistoryListProps) => {
  const { t } = useTranslations('evaluation');

  return (
    <div className="px-6 py-4 border-b border-slate-100">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        <History size={13} />
        {t.history.title}
      </p>

      {failed && <p className="text-[11px] text-red-500">{t.history.failed}</p>}

      {!failed && isLoading && entries.length === 0 && (
        <p className="text-[11px] text-slate-400">{t.history.loading}</p>
      )}

      {!failed && !isLoading && entries.length === 0 && (
        <p className="text-[11px] text-slate-400 leading-relaxed">{t.history.empty}</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className="group flex items-start gap-2">
            <button
              type="button"
              onClick={() => onOpen(entry.id)}
              className="flex-1 min-w-0 text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {entry.overallScore ?? '—'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                {entry.isFallback && (
                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-semibold">
                    {t.history.fallbackBadge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{entry.jobDescription}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.history.deleteConfirm)) onDelete(entry.id);
              }}
              title={t.history.delete}
              className="mt-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          {t.history.loadMore}
        </button>
      )}
    </div>
  );
};
