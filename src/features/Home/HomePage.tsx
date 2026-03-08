"use client";

import React, { useState } from 'react';
import { Printer, FileText, Eye, Loader2, Trash2, Upload as UploadIcon, Palette } from 'lucide-react';
import { ResumeEditor, ThemeSwitcher } from '@/features/Editor';
import { ResumePreview } from '@/features/Resume';
import { useHomeLogic } from './useHomeLogic';
import { useTranslations } from '@/hooks/useTranslations';
import { useResumeStore } from '@/store/resume-store';
import { ViewMode } from '@/types';
import { IngestModal } from '@/components/ui/IngestModal';

export default function HomePage() {
  const { handleExportPDF, isExporting } = useHomeLogic();
  const { t: tHome } = useTranslations('home');
  const { t: tCommon } = useTranslations('common');
  const { t: tViewMode } = useTranslations('viewMode');
  const { viewMode, setViewMode, resetData } = useResumeStore();
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const handleClearData = () => {
    if (window.confirm(tCommon.confirmClearData)) {
      resetData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* App Header */}
      <header className="bg-white border-b border-slate-200 flex flex-col sticky top-0 z-50 print:hidden">
        <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {tHome.title.ai}
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {tHome.title.resume}<span className="text-indigo-600">{tHome.title.builder}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsIngestModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm font-medium transition-all"
            >
              <UploadIcon size={16} />
              <span className="hidden md:inline">{tHome.actions.ingest}</span>
            </button>

            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium transition-all"
            >
              <Palette size={16} />
              <span className="hidden md:inline">{tHome.actions.customize}</span>
            </button>

            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode(ViewMode.EDITOR)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === ViewMode.EDITOR 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText size={16} />
                {tViewMode.editor}
              </button>
              <button
                onClick={() => setViewMode(ViewMode.PREVIEW)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === ViewMode.PREVIEW 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye size={16} />
                {tViewMode.preview}
              </button>
            </div>

            <button 
              onClick={handleClearData}
              className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-all"
              title={tCommon.clearData}
            >
              <Trash2 size={16} />
              <span className="hidden md:inline">{tCommon.clear}</span>
            </button>

            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Printer size={16} />
              )}
              {isExporting ? tCommon.exporting : tCommon.exportPrint}
            </button>
          </div>
        </div>

        {/* Customize Section - Collapsible */}
        {showCustomize && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="max-w-4xl">
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Controls (Scrollable) */}
        {viewMode === ViewMode.EDITOR && (
          <div className="w-[450px] bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 h-[calc(100vh-64px)] overflow-y-auto print:hidden">
            <div className="p-6">
              <ResumeEditor />
            </div>
          </div>
        )}

        {/* Right Panel: Live Preview (Centered) */}
        <div className="flex-1 bg-slate-200/50 p-8 overflow-y-auto h-[calc(100vh-64px)] flex justify-center items-start print:p-0 print:h-auto print:bg-white print:overflow-visible relative">
          <div className="print:w-full print:h-full w-[210mm] min-h-[297mm] shadow-2xl bg-white origin-top items-center justify-center flex transition-all print:shadow-none print:transform-none">
             <div className="w-full h-full"> 
               <ResumePreview />
             </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IngestModal isOpen={isIngestModalOpen} onClose={() => setIsIngestModalOpen(false)} />
    </div>
  );
}
