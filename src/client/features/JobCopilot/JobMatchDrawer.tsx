"use client";

import React from 'react';
import { X, Target, Sparkles, Loader2, Copy } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { useJobCopilotLogic } from './useJobCopilotLogic';
import { KeywordGapList } from './KeywordGapList';

interface JobMatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobMatchDrawer: React.FC<JobMatchDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslations('jobCopilot');
  const {
    jobDescription,
    setJobDescription,
    isEvaluating,
    isForking,
    error,
    result,
    matchedKeywords,
    missingKeywords,
    handleEvaluate,
    handleAddSkillToResume,
    handleForkResume,
  } = useJobCopilotLogic();

  if (!isOpen) return null;

  const score = result?.overallScore || 0;

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (val >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Target size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              {t.title}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/40 text-indigo-200 border border-indigo-400/20">
                2 Coins
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">{t.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title={t.closeDrawer}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
        
        {/* Job Description Input Box */}
        <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t.enterJdPrompt}
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder={t.placeholder}
            rows={4}
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isEvaluating || jobDescription.trim().length < 20}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEvaluating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t.analyzing}</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-300" />
                <span>{t.evaluateButton}</span>
              </>
            )}
          </button>
          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        {/* Evaluation Output */}
        {result && (
          <div className="space-y-4">
            
            {/* Score & Verdict Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t.overallMatch}
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {result.recommendation}
                </p>
                {result.action && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{result.action}</p>
                )}
              </div>

              <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(score)}`}>
                <span className="text-xl font-black">{score}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Match</span>
              </div>
            </div>

            {/* Keyword Gap Chips */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <KeywordGapList
                matchedKeywords={matchedKeywords}
                missingKeywords={missingKeywords}
                onAddSkill={handleAddSkillToResume}
              />
            </div>

            {/* AI Bullet Improvement Suggestions */}
            {result.strengths && result.strengths.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {t.recommendations}
                </span>
                <div className="space-y-2">
                  {result.strengths.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
                      💡 {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fork Resume Button */}
            <button
              type="button"
              onClick={handleForkResume}
              disabled={isForking}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isForking ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Copy size={14} />
              )}
              <span>{isForking ? t.forking : t.forkResume}</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
