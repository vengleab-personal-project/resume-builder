"use client";

import React, { useState } from 'react';
import { Sparkles, Target, BarChart2, Scissors, Loader2, Check } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';

interface InlineAiToolbarProps {
  content: string;
  onApply: (newContent: string) => void;
  onRefine: (instruction: string, existingData: string) => Promise<string>;
  className?: string;
}

export const InlineAiToolbar: React.FC<InlineAiToolbarProps> = ({
  content,
  onApply,
  onRefine,
  className = '',
}) => {
  const { t } = useTranslations('inlineAi');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const handleAction = async (actionKey: string, instruction: string) => {
    if (!content.trim() || activeAction) return;

    setActiveAction(actionKey);
    try {
      const refined = await onRefine(instruction, content);
      if (refined && refined.trim()) {
        onApply(refined);
        setJustApplied(true);
        setTimeout(() => setJustApplied(false), 2000);
      }
    } catch (err) {
      console.error('Inline AI action failed:', err);
    } finally {
      setActiveAction(null);
    }
  };

  const isBusy = activeAction !== null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200/80 ${className}`}>
      
      {/* Label / Tooltip */}
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 flex items-center gap-1">
        <Sparkles size={11} className="text-amber-400" />
        AI Micro-Actions:
      </span>

      {/* Action 1: Polish & Refine */}
      <button
        type="button"
        disabled={isBusy || !content.trim()}
        onClick={() =>
          handleAction(
            'polish',
            'Improve tone, flow, and professionalism. Correct grammar and syntax without adding fictional claims.'
          )
        }
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 transition-all shadow-xs disabled:opacity-50"
      >
        {activeAction === 'polish' ? (
          <Loader2 size={12} className="animate-spin text-indigo-600" />
        ) : (
          <Sparkles size={12} className="text-indigo-500" />
        )}
        <span>{activeAction === 'polish' ? t.polishing : t.polish}</span>
      </button>

      {/* Action 2: STAR Method */}
      <button
        type="button"
        disabled={isBusy || !content.trim()}
        onClick={() =>
          handleAction(
            'star',
            'Rewrite these bullets into impactful STAR (Situation, Task, Action, Result) format starting with strong action verbs (e.g., Architected, Spearheaded, Optimized).'
          )
        }
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 hover:text-purple-600 hover:border-purple-200 border border-slate-200 transition-all shadow-xs disabled:opacity-50"
      >
        {activeAction === 'star' ? (
          <Loader2 size={12} className="animate-spin text-purple-600" />
        ) : (
          <Target size={12} className="text-purple-500" />
        )}
        <span>{activeAction === 'star' ? t.convertingStar : t.star}</span>
      </button>

      {/* Action 3: Quantify Impact */}
      <button
        type="button"
        disabled={isBusy || !content.trim()}
        onClick={() =>
          handleAction(
            'metrics',
            'Enhance bullets by incorporating quantifiable metrics (e.g. [X]% speedup, [$Y] saved, [N] active users) with placeholder brackets where actual metrics belong.'
          )
        }
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 hover:text-emerald-600 hover:border-emerald-200 border border-slate-200 transition-all shadow-xs disabled:opacity-50"
      >
        {activeAction === 'metrics' ? (
          <Loader2 size={12} className="animate-spin text-emerald-600" />
        ) : (
          <BarChart2 size={12} className="text-emerald-500" />
        )}
        <span>{activeAction === 'metrics' ? t.addingMetrics : t.metrics}</span>
      </button>

      {/* Action 4: Shorten / Fit Line */}
      <button
        type="button"
        disabled={isBusy || !content.trim()}
        onClick={() =>
          handleAction(
            'shorten',
            'Condense this text slightly (by ~15%) to eliminate orphan trailing words and keep bullet points crisp and concise for PDF page fitting.'
          )
        }
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 hover:text-amber-600 hover:border-amber-200 border border-slate-200 transition-all shadow-xs disabled:opacity-50"
      >
        {activeAction === 'shorten' ? (
          <Loader2 size={12} className="animate-spin text-amber-600" />
        ) : (
          <Scissors size={12} className="text-amber-500" />
        )}
        <span>{activeAction === 'shorten' ? t.shortening : t.shorten}</span>
      </button>

      {justApplied && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 ml-auto animate-in fade-in duration-150">
          <Check size={12} />
          {t.applied}
        </span>
      )}

    </div>
  );
};
