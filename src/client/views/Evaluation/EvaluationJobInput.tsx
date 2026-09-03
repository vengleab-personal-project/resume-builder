"use client";

import { FileText, Upload, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { InputMode } from './useEvaluationLogic';
import { useTranslations } from '@/client/hooks/useTranslations';

interface EvaluationJobInputProps {
  inputMode: InputMode;
  onSetInputMode: (mode: InputMode) => void;
  jobDescription: string;
  onJobDescriptionChange: (val: string) => void;
  pdfFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasPersistedJD: boolean;
  onClearJD: () => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
  canEvaluate: boolean;
}

export function EvaluationJobInput({
  inputMode,
  onSetInputMode,
  jobDescription,
  onJobDescriptionChange,
  pdfFile,
  fileInputRef,
  onFileChange,
  hasPersistedJD,
  onClearJD,
  onEvaluate,
  isEvaluating,
  canEvaluate,
}: EvaluationJobInputProps) {
  const { t } = useTranslations('evaluation');

  return (
    <div className="flex flex-col gap-6">
      {/* Persisted JD banner */}
      {hasPersistedJD && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
          <p className="text-sm text-indigo-700 flex-1">
            {t.sessionLoaded}
          </p>
          <button
            onClick={onClearJD}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <RefreshCw size={12} />
            {t.clearReset}
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => onSetInputMode('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'text'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={15} />
          {t.tabPasteText}
        </button>
        <button
          onClick={() => onSetInputMode('pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'pdf'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload size={15} />
          {t.tabUploadPdf}
        </button>
      </div>

      {/* Content area */}
      {inputMode === 'text' ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            {t.targetJdLabel}
          </label>
          <textarea
            id="jd-textarea"
            value={jobDescription}
            onChange={e => onJobDescriptionChange(e.target.value)}
            placeholder={t.jdPlaceholder}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
          />
          <p className="text-xs text-slate-400">
            {jobDescription.length} {t.charactersCount} — {t.minRecommended}
          </p>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            pdfFile
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          {pdfFile ? (
            <>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-indigo-600" size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-indigo-700">{pdfFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">{t.dropPdfPrompt}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <Upload className="text-slate-500" size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">{t.uploadJdTitle}</p>
                <p className="text-xs text-slate-500 mt-1">{t.pdfConstraint}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <span>
          {t.provideJdDesc}
        </span>
      </div>

      {/* Evaluate button */}
      <button
        id="btn-evaluate"
        onClick={onEvaluate}
        disabled={!canEvaluate || isEvaluating}
        className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
      >
        {isEvaluating ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t.evaluatingButton}
          </>
        ) : (
          <>
            <span className="text-base">✦</span>
            {t.evaluateButton}
          </>
        )}
      </button>
    </div>
  );
}
