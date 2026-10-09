"use client";

import React, { useState } from 'react';
import { Check, Plus, CheckCircle2 } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';

interface KeywordGapListProps {
  matchedKeywords: string[];
  missingKeywords: string[];
  onAddSkill: (skill: string) => void;
  className?: string;
}

export const KeywordGapList: React.FC<KeywordGapListProps> = ({
  matchedKeywords = [],
  missingKeywords = [],
  onAddSkill,
  className = '',
}) => {
  const { t } = useTranslations('jobCopilot');
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());

  const handleAdd = (skill: string) => {
    onAddSkill(skill);
    setAddedSkills((prev) => new Set([...prev, skill]));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* 1. Missing Skills (Highest Priority) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {t.missingKeywords} ({missingKeywords.length})
          </span>
          <span className="text-[11px] text-slate-400">Click to add to CV</span>
        </div>

        {missingKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((skill, idx) => {
              const isAdded = addedSkills.has(skill);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isAdded && handleAdd(skill)}
                  disabled={isAdded}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isAdded
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                      : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300 active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span>{skill}</span>
                      <span className="text-[10px] text-emerald-600 font-bold ml-1">({t.addedSkill})</span>
                    </>
                  ) : (
                    <>
                      <Plus size={12} className="text-rose-500" />
                      <span>{skill}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 border border-emerald-100">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{t.noSkillsGap}</span>
          </div>
        )}
      </div>

      {/* 2. Matched Skills */}
      {matchedKeywords.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t.matchedKeywords} ({matchedKeywords.length})
          </span>

          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
              >
                <Check size={12} className="text-emerald-500" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
