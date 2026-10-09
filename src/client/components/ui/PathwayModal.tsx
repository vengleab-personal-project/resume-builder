"use client";

import React from 'react';
import { Sparkles, Wand2, Mic, Target, X, ArrowRight, FileUp } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import Link from 'next/link';

interface PathwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIngest: () => void;
  onSelectWizard: () => void;
  onSelectTailor: () => void;
}

export const PathwayModal: React.FC<PathwayModalProps> = ({
  isOpen,
  onClose,
  onSelectIngest,
  onSelectWizard,
  onSelectTailor,
}) => {
  const { t } = useTranslations('pathway');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <Sparkles size={12} className="text-amber-300" />
              Career Acceleration Studio
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {t.title}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* 4 Pathway Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
          
          {/* Path 1: Smart Ingest */}
          <button
            type="button"
            onClick={onSelectIngest}
            className="group relative flex flex-col justify-between p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all text-left active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileUp size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {t.pathways.ingest.badge}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                {t.pathways.ingest.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t.pathways.ingest.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>{t.pathways.ingest.action}</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </button>

          {/* Path 2: Progressive Wizard */}
          <button
            type="button"
            onClick={onSelectWizard}
            className="group relative flex flex-col justify-between p-4 bg-white rounded-xl border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all text-left active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wand2 size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                  {t.pathways.wizard.badge}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">
                {t.pathways.wizard.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t.pathways.wizard.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
              <span>{t.pathways.wizard.action}</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </button>

          {/* Path 3: Spoken Khmer CV */}
          <Link
            href="/basic-resume"
            className="group relative flex flex-col justify-between p-4 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all text-left active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mic size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {t.pathways.spoken.badge}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">
                {t.pathways.spoken.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t.pathways.spoken.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>{t.pathways.spoken.action}</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </Link>

          {/* Path 4: Job-Match Tailoring Studio */}
          <button
            type="button"
            onClick={onSelectTailor}
            className="group relative flex flex-col justify-between p-4 bg-white rounded-xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all text-left active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                  {t.pathways.tailor.badge}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                {t.pathways.tailor.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t.pathways.tailor.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
              <span>{t.pathways.tailor.action}</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            You can switch pathways or tools anytime from the top bar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            {t.skipToEditor}
          </button>
        </div>

      </div>
    </div>
  );
};
