"use client";

import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { DefaultResumeCard } from './components/DefaultResumeCard';
import { PersonalDetailsCard } from './components/PersonalDetailsCard';
import { PhotoField } from './components/PhotoField';
import { useProfileLogic } from './useProfileLogic';

export default function Profile() {
  const vm = useProfileLogic();
  const { t, fields } = vm;

  if (vm.isLoading) {
    return (
      <div className="h-full flex items-center justify-center gap-3 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin" />
        {t.loading}
      </div>
    );
  }

  if (!vm.hasProfile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
        <p>{t.loadFailed}</p>
        <button
          type="button"
          onClick={vm.retry}
          className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw size={14} />
          {t.retry}
        </button>
      </div>
    );
  }

  const noticeText = {
    saved: t.saved,
    savedResume: t.savedResume,
    conflict: t.conflict,
    failed: t.saveFailed,
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6">
          <h2 className="text-sm font-bold text-slate-800">{t.detailsSection}</h2>

          <PhotoField
            photoUrl={fields.photoUrl}
            name={fields.fullName}
            hasError={vm.photoError}
            disabled={vm.isSaving}
            labels={t}
            onChoose={vm.choosePhoto}
            onRemove={vm.removePhoto}
          />

          <PersonalDetailsCard
            fields={fields}
            disabled={vm.isSaving}
            labels={t}
            errorMessage={vm.errorMessage}
            onChange={vm.setField}
          />

          <p className="text-xs text-slate-500 leading-relaxed">{t.syncNote}</p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={vm.save}
              disabled={!vm.dirty || vm.isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {vm.isSaving && <Loader2 size={14} className="animate-spin" />}
              {vm.isSaving ? t.saving : t.save}
            </button>
            {vm.dirty && !vm.isSaving && (
              <button
                type="button"
                onClick={vm.discard}
                className="px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.discard}
              </button>
            )}
            {vm.notice ? (
              <span
                role="status"
                className={`inline-flex items-center gap-1.5 text-sm ${
                  vm.notice === 'saved' || vm.notice === 'savedResume'
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {vm.notice === 'saved' || vm.notice === 'savedResume' ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <AlertCircle size={15} />
                )}
                {noticeText[vm.notice]}
              </span>
            ) : (
              vm.dirty && <span className="text-sm text-slate-500">{t.unsaved}</span>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800">{t.defaultResumeSection}</h2>
          <DefaultResumeCard
            resume={vm.defaultResume}
            isLoading={vm.isResumeLoading}
            labels={t}
            onOpen={vm.openDefaultInBuilder}
          />
        </section>
      </div>
    </div>
  );
}
