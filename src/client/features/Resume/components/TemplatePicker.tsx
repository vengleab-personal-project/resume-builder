"use client";

import React from 'react';
import { Check, Layout } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { THEME_TEMPLATES } from '@/shared/config/constants';
import type { ResumeTemplateId } from '@/shared/types';

interface TemplatePickerProps {
  selectedTemplate: ResumeTemplateId;
  onSelectTemplate: (templateId: ResumeTemplateId) => void;
  className?: string;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selectedTemplate = 'modern',
  onSelectTemplate,
  className = '',
}) => {
  const { t } = useTranslations('templates');

  const getTemplatePreview = (id: string) => {
    switch (id) {
      case 'modern':
        return (
          <div className="w-full h-20 bg-slate-50 rounded border border-slate-200 flex overflow-hidden p-1 gap-1">
            <div className="w-1/3 bg-indigo-100/70 rounded-xs flex flex-col gap-1 p-1">
              <div className="w-4 h-4 rounded-full bg-indigo-400 mx-auto" />
              <div className="w-full h-1 bg-indigo-300 rounded" />
              <div className="w-3/4 h-1 bg-indigo-200 rounded" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 p-1">
              <div className="w-2/3 h-1.5 bg-slate-400 rounded" />
              <div className="w-full h-1 bg-slate-200 rounded" />
              <div className="w-5/6 h-1 bg-slate-200 rounded" />
              <div className="w-full h-1 bg-slate-200 rounded" />
            </div>
          </div>
        );
      case 'executive':
        return (
          <div className="w-full h-20 bg-slate-50 rounded border border-slate-200 flex flex-col p-1.5 gap-1.5">
            <div className="w-1/2 h-2 bg-slate-700 rounded mx-auto" />
            <div className="w-3/4 h-1 bg-slate-300 rounded mx-auto" />
            <div className="w-full h-0.5 bg-slate-300 my-0.5" />
            <div className="w-full h-1 bg-slate-200 rounded" />
            <div className="w-5/6 h-1 bg-slate-200 rounded" />
            <div className="w-4/5 h-1 bg-slate-200 rounded" />
          </div>
        );
      case 'compact':
        return (
          <div className="w-full h-20 bg-slate-50 rounded border border-slate-200 flex flex-col p-1.5 gap-1">
            <div className="flex justify-between items-center pb-1 border-b border-slate-200">
              <div className="w-1/3 h-2 bg-slate-800 rounded" />
              <div className="w-1/4 h-1 bg-slate-400 rounded" />
            </div>
            <div className="w-full h-1 bg-slate-300 rounded" />
            <div className="w-full h-1 bg-slate-200 rounded" />
            <div className="w-4/5 h-1 bg-slate-200 rounded" />
            <div className="flex gap-1 pt-1">
              <div className="w-4 h-1.5 bg-slate-300 rounded-xs" />
              <div className="w-4 h-1.5 bg-slate-300 rounded-xs" />
              <div className="w-4 h-1.5 bg-slate-300 rounded-xs" />
            </div>
          </div>
        );
      case 'cambodia':
        return (
          <div className="w-full h-20 bg-slate-50 rounded border border-slate-200 flex flex-col p-1.5 gap-1">
            <div className="flex justify-between items-start pb-1 border-b border-slate-200">
              <div className="flex-1 space-y-1">
                <div className="w-1/2 h-2 bg-slate-800 rounded" />
                <div className="w-2/3 h-1 bg-slate-400 rounded" />
              </div>
              <div className="w-4 h-5 border border-slate-300 bg-slate-200 rounded-xs" />
            </div>
            <div className="w-full h-1 bg-slate-200 rounded" />
            <div className="w-4/5 h-1 bg-slate-200 rounded" />
            <div className="w-3/4 h-1 bg-slate-200 rounded" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Layout size={15} className="text-indigo-600" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {t.selectTemplate}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {THEME_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl.id as ResumeTemplateId)}
              className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}

              {getTemplatePreview(tmpl.id)}

              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {tmpl.name}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {tmpl.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
