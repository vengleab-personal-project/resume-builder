"use client";

import React from 'react';
import { FilePlus2, FileText, Star, Pencil, Copy, Trash2, Loader2 } from 'lucide-react';
import { useResumeListLogic } from './useResumeListLogic';
import { useTranslations } from '@/client/hooks/useTranslations';
import { LanguageSwitcher } from '@/client/components/ui/LanguageSwitcher';
import type { ResumeSummary } from '@/shared/types/persistence';

export default function ResumeList() {
  const vm = useResumeListLogic();
  const { t } = useTranslations('resumeList');

  return (
    <div className="h-full flex flex-col font-sans text-slate-900 bg-slate-100">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText size={18} />
          </div>
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{t.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="subtle" />
          <button
            type="button"
            onClick={() => void vm.createResume()}
            disabled={vm.pendingId === 'new'}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            {vm.pendingId === 'new' ? <Loader2 size={15} className="animate-spin" /> : <FilePlus2 size={15} />}
            <span>{t.newResume}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto w-full">
          {vm.failed && (
            <p className="text-sm text-red-500 mb-4">{t.loadFailed}</p>
          )}

          {!vm.failed && vm.isLoading && vm.resumes.length === 0 && (
            <p className="text-sm text-slate-400">{t.loading}</p>
          )}

          {!vm.failed && !vm.isLoading && vm.resumes.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText size={26} />
              </div>
              <h2 className="text-base font-semibold text-slate-800">{t.emptyTitle}</h2>
              <p className="text-sm text-slate-500 max-w-sm">{t.emptyDesc}</p>
              <button
                type="button"
                onClick={() => void vm.createResume()}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <FilePlus2 size={16} />
                {t.newResume}
              </button>
            </div>
          )}

          {vm.resumes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vm.resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  isActive={resume.id === vm.activeResumeId}
                  isPending={vm.pendingId === resume.id}
                  labels={t}
                  onOpen={() => void vm.openAndEdit(resume.id)}
                  onRename={() => {
                    const next = window.prompt(t.renamePrompt, resume.title);
                    if (next !== null) void vm.renameResume(resume, next);
                  }}
                  onDuplicate={() => void vm.duplicateResume(resume)}
                  onSetDefault={() => void vm.setDefaultResume(resume)}
                  onDelete={() => {
                    if (window.confirm(t.deleteConfirm)) void vm.deleteResume(resume.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResumeCardProps {
  resume: ResumeSummary;
  isActive: boolean;
  isPending: boolean;
  labels: ReturnType<typeof useTranslations<'resumeList'>>['t'];
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}

function ResumeCard({
  resume,
  isActive,
  isPending,
  labels,
  onOpen,
  onRename,
  onDuplicate,
  onSetDefault,
  onDelete,
}: ResumeCardProps) {
  return (
    <div
      className={`group relative bg-white rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        isActive ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      {isPending && (
        <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center z-10">
          <Loader2 size={20} className="animate-spin text-indigo-500" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate" title={resume.title}>
            {resume.title}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {labels.updated} {new Date(resume.updatedAt).toLocaleDateString()}
          </p>
        </div>
        {resume.isDefault && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-semibold whitespace-nowrap">
            <Star size={10} fill="currentColor" />
            {labels.defaultBadge}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-sm font-medium text-slate-700 transition-colors"
      >
        {labels.open}
      </button>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRename}
            title={labels.rename}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            title={labels.duplicate}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Copy size={14} />
          </button>
          {!resume.isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              title={labels.setDefault}
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors"
            >
              <Star size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          title={labels.delete}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
