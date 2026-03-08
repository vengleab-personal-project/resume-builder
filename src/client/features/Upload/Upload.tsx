"use client";

import React from 'react';
import { Upload as UploadIcon, Loader2, AlertCircle, Cpu, Sparkles, X } from 'lucide-react';
import { AIProvider } from '@/shared/types';
import { useUploadLogic } from './useUploadLogic';
import { AI_PROVIDERS, AI_MODELS, FILE_LIMITS } from '@/shared/config/constants';
import { useTranslations } from '@/client/hooks/useTranslations';

export const Upload: React.FC = () => {
  const {
    fileInputRef,
    isParsing,
    aiConfig,
    error,
    handleFileChange,
    handleProviderChange,
    handleModelChange,
    triggerFileInput,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    pastedText,
    setPastedText,
    handlePasteSubmit,
    cancelParsing,
  } = useUploadLogic();

  const { t } = useTranslations('upload');

  const providerIcons: Record<string, React.ElementType> = {
    [AI_PROVIDERS.OPENAI]: Sparkles,
    [AI_PROVIDERS.GOOGLE]: Cpu,
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {t.aiProvider}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(AI_PROVIDERS).map((providerId) => {
            if (AI_MODELS[providerId as keyof typeof AI_MODELS].length === 0) {
              return null;
            }
            const Icon = providerIcons[providerId];
            const isSelected = aiConfig.provider === providerId;
            return (
              <button
                key={providerId}
                onClick={() => handleProviderChange(providerId as AIProvider)}
                className={`
                  flex items-center justify-center gap-2 p-2 rounded-md border text-sm font-medium transition-all
                  ${isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                `}
              >
                {Icon && <Icon size={14} />}
                {t.providers[providerId as keyof typeof t.providers]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {t.model}
        </label>
        <select
          value={aiConfig.model}
          onChange={(e) => handleModelChange(e.target.value as any)}
          className="w-full p-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          {AI_MODELS[aiConfig.provider as keyof typeof AI_MODELS].map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 pt-2">
        <div 
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isParsing ? 'bg-slate-50 border-slate-300 cursor-not-allowed' : 
              isDragging ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20' : 
              'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept={FILE_LIMITS.ACCEPTED_TYPES.join(',')} 
            className="hidden" 
            disabled={isParsing}
          />
          
          {isParsing ? (
            <>
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-sm text-slate-500 font-medium">{t.analyzing}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelParsing();
                }}
                className="mt-2 px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1"
              >
                <X size={12} />
                {t.cancel}
              </button>
            </>
          ) : (
            <>
              <UploadIcon className="w-8 h-8 text-indigo-500 mb-2" />
              <p className="text-sm text-slate-700 font-medium">{t.clickToUpload}</p>
              <p className="text-xs text-slate-400 mt-1">{t.supportedFormats}</p>
            </>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">{t.or}</span>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={t.placeholderText}
            className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            disabled={isParsing}
          />
          <button
            onClick={handlePasteSubmit}
            disabled={isParsing || !pastedText.trim()}
            className={`
              w-full py-2 px-4 rounded-md text-sm font-medium transition-all
              ${isParsing || !pastedText.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}
            `}
          >
            {isParsing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {t.analyzing}
              </div>
            ) : (
              t.parseText
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded">
          <AlertCircle size={16} />
          {t.errors.parseError}
        </div>
      )}
    </div>
  );
};
