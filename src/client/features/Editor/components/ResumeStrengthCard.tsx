"use client";

import React, { useMemo } from 'react';
import { Sparkles, CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import type { ResumeData } from '@/shared/types';

interface ResumeStrengthCardProps {
  resumeData: ResumeData;
  onNavigateSection?: (sectionId: string) => void;
  className?: string;
}

export const ResumeStrengthCard: React.FC<ResumeStrengthCardProps> = ({
  resumeData,
  onNavigateSection,
  className = '',
}) => {
  const { t } = useTranslations('strength');

  const { score, tasks } = useMemo(() => {
    let currentScore = 0;
    const taskList: { id: string; label: string; done: boolean }[] = [];

    // 1. Personal Name & Title (15pts)
    const hasName = Boolean(resumeData.personalInfo?.name && resumeData.personalInfo.name !== 'Your Name' && resumeData.personalInfo.name.trim() !== '');
    const hasTitle = Boolean(resumeData.personalInfo?.title && resumeData.personalInfo.title !== 'Your Title' && resumeData.personalInfo.title.trim() !== '');
    if (hasName && hasTitle) currentScore += 15;
    else if (hasName) currentScore += 10;
    taskList.push({
      id: 'personalInfo',
      label: t.tasks.personalName,
      done: hasName && hasTitle,
    });

    // 2. Contact Info (10pts)
    const hasEmail = Boolean(resumeData.personalInfo?.email && resumeData.personalInfo.email !== 'email@example.com' && resumeData.personalInfo.email.trim() !== '');
    const hasPhone = Boolean(resumeData.personalInfo?.phone && resumeData.personalInfo.phone !== '(555) 555-5555' && resumeData.personalInfo.phone.trim() !== '');
    if (hasEmail && hasPhone) currentScore += 10;
    else if (hasEmail || hasPhone) currentScore += 5;
    taskList.push({
      id: 'personalInfo',
      label: t.tasks.contactInfo,
      done: hasEmail && hasPhone,
    });

    // 3. Summary (15pts)
    const hasSummary = Boolean(resumeData.summary && resumeData.summary.trim().length >= 40);
    if (hasSummary) currentScore += 15;
    else if (resumeData.summary && resumeData.summary.trim().length > 0) currentScore += 5;
    taskList.push({
      id: 'summary',
      label: t.tasks.summary,
      done: hasSummary,
    });

    // 4. Experience (20pts)
    const expCount = resumeData.experience?.length || 0;
    if (expCount >= 2) currentScore += 20;
    else if (expCount === 1) currentScore += 12;
    taskList.push({
      id: 'experience',
      label: t.tasks.experience,
      done: expCount >= 1,
    });

    // 5. Quantifiable Metrics in Experience (15pts)
    const allExpDesc = (resumeData.experience || []).map(e => e.description || '').join(' ');
    // Detect numbers, percentages, dollar/riel/currency, or metric patterns
    const hasMetrics = /([0-9]+%|\$[0-9]+|[0-9]+\s*(k|m|users|clients|teams|projects|speedup|revenue|growth|increase|decrease|saved))/i.test(allExpDesc);
    if (hasMetrics) currentScore += 15;
    taskList.push({
      id: 'experience',
      label: t.tasks.metrics,
      done: hasMetrics,
    });

    // 6. Education (10pts)
    const eduCount = resumeData.education?.length || 0;
    if (eduCount >= 1) currentScore += 10;
    taskList.push({
      id: 'education',
      label: t.tasks.education,
      done: eduCount >= 1,
    });

    // 7. Skills (10pts)
    const skillsCount = resumeData.skills?.length || 0;
    if (skillsCount >= 5) currentScore += 10;
    else if (skillsCount >= 2) currentScore += 5;
    taskList.push({
      id: 'skills',
      label: t.tasks.skills,
      done: skillsCount >= 5,
    });

    // 8. LinkedIn Link (5pts bonus up to 100)
    const hasLinkedIn = Boolean(resumeData.personalInfo?.linkedin && resumeData.personalInfo.linkedin.trim() !== '');
    if (hasLinkedIn) currentScore += 5;
    taskList.push({
      id: 'personalInfo',
      label: t.tasks.linkedin,
      done: hasLinkedIn,
    });

    return {
      score: Math.min(100, currentScore),
      tasks: taskList,
    };
  }, [resumeData, t]);

  // Color mapping based on score
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'from-emerald-500 to-teal-600 text-emerald-700';
    if (val >= 60) return 'from-indigo-500 to-blue-600 text-indigo-700';
    if (val >= 40) return 'from-amber-500 to-orange-600 text-amber-700';
    return 'from-rose-500 to-red-600 text-rose-700';
  };

  const getScoreBadge = (val: number) => {
    if (val >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val >= 60) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (val >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const pendingTasks = tasks.filter(t => !t.done);

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 ${className}`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={13} />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t.title}
          </span>
        </div>
        
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreBadge(score)}`}>
          {score}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
        <div
          className={`h-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Actionable Tasks */}
      {pendingTasks.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t.tasksTitle}
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {pendingTasks.slice(0, 3).map((task, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigateSection?.(task.id)}
                className="w-full text-left flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-600 hover:text-indigo-600 transition-colors group"
              >
                <Circle size={12} className="text-slate-300 group-hover:text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1 flex-1">{task.label}</span>
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
          <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
          <span>{t.allGood}</span>
        </div>
      )}

    </div>
  );
};
