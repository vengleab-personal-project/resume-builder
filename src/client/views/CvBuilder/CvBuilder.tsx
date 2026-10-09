"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  Printer,
  FileText,
  FileDown,
  ChevronDown,
  Eye,
  Loader2,
  Trash2,
  Palette,
  Sparkles,
  Target,
  Pencil,
  Check,
  Coins,
} from 'lucide-react';
import { ResumeEditor, ThemeSwitcher } from '@/client/features/Editor';
import { ResumePreview, SyncStatusIndicator } from '@/client/features/Resume';
import { SectionNavigator, ResumeStrengthCard } from '@/client/features/Editor/components';
import { DensityControls } from '@/client/features/Editor/DensityControls';
import { JobMatchDrawer } from '@/client/features/JobCopilot';
import { PathwayModal } from '@/client/components/ui/PathwayModal';
import { IngestModal } from '@/client/components/ui/IngestModal';
import { LanguageSwitcher } from '@/client/components/ui/LanguageSwitcher';
import { useCvBuilderLogic } from './useCvBuilderLogic';
import { usePreviewScale } from './usePreviewScale';
import { useTranslations } from '@/client/hooks/useTranslations';
import { useResumeStore } from '@/client/store/resume-store';
import { useCoinStore } from '@/client/store/coin-store';
import { ViewMode } from '@/shared/types';

export default function CvBuilder() {
  const { handleExportPDF, handleExportDocx, isExporting, isExportingDocx } = useCvBuilderLogic();
  const { t: tHome } = useTranslations('home');
  const { t: tCommon } = useTranslations('common');
  const { t: tViewMode } = useTranslations('viewMode');
  const { t: tJob } = useTranslations('jobCopilot');

  const {
    viewMode,
    setViewMode,
    resetData,
    resumeData,
    title,
    setTitle,
    sectionOrder,
    setSectionOrder,
  } = useResumeStore();

  const { balance, openTopUp, refreshBalance } = useCoinStore();

  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isJobMatchDrawerOpen, setIsJobMatchDrawerOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const { viewportRef, canvasRef, zoom, setZoom, frame } = usePreviewScale();
  const [activeSectionId, setActiveSectionId] = useState<string>('personalInfo');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const hasAutoCheckedRef = useRef(false);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  // Auto popup Pathway modal by default when CV is empty on first visit
  useEffect(() => {
    if (hasAutoCheckedRef.current) return;
    hasAutoCheckedRef.current = true;

    const isEmpty =
      (!resumeData.experience || resumeData.experience.length === 0) &&
      (!resumeData.education || resumeData.education.length === 0) &&
      (!resumeData.skills || resumeData.skills.length === 0) &&
      (!resumeData.summary || resumeData.summary.trim() === '') &&
      (!resumeData.personalInfo?.name ||
        resumeData.personalInfo.name === 'Your Name' ||
        resumeData.personalInfo.name.trim() === '');

    if (isEmpty) {
      setIsPathwayModalOpen(true);
    }
  }, [resumeData]);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isExportBusy = isExporting || isExportingDocx;

  const handleClearData = () => {
    if (window.confirm(tCommon.confirmClearData)) {
      resetData();
      setIsPathwayModalOpen(true);
    }
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setTitle(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleNavigateSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const targetEl = document.getElementById(`section-${sectionId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddSectionToOrder = (sectionId: string) => {
    if (!sectionOrder.includes(sectionId)) {
      setSectionOrder([...sectionOrder, sectionId]);
      handleNavigateSection(sectionId);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans text-slate-900 bg-slate-100 relative print:block print:h-auto print:bg-white">
      
      {/* 1. App Header */}
      <header className="bg-white border-b border-slate-200 flex flex-col sticky top-0 z-40 print:hidden">
        <div className="h-16 flex items-center justify-between px-4 sm:px-6">
          
          {/* Left: Title & Sync Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0">
              <FileText size={18} />
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="px-2 py-1 text-sm font-semibold text-slate-800 bg-slate-50 border border-indigo-400 rounded-md outline-none max-w-xs focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 text-left truncate max-w-xs py-1 px-1.5 -ml-1.5 rounded-md hover:bg-slate-50 transition-colors"
                title="Click to rename"
              >
                <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
                  {title || tCommon.resumeEditor}
                </h1>
                <Pencil size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}

            <SyncStatusIndicator className="ml-1 flex-shrink-0" />
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Coin Balance Pill */}
            <button
              type="button"
              onClick={() => openTopUp()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all shadow-2xs"
              title="Coins balance (Click to top up)"
            >
              <Coins size={13} className="text-amber-600" />
              <span>{balance !== null ? `${balance} Coins` : 'Coins'}</span>
            </button>

            <LanguageSwitcher variant="subtle" />

            {/* Tailor for Job Action Button */}
            <button
              type="button"
              onClick={() => setIsJobMatchDrawerOpen((open) => !open)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isJobMatchDrawerOpen
                  ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <Target size={14} className="text-purple-600" />
              <span className="hidden sm:inline">{tJob.tailorButton}</span>
            </button>

            {/* Creation Pathways Button */}
            <button
              type="button"
              onClick={() => setIsPathwayModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 group"
            >
              <Sparkles size={14} className="text-amber-300 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">{tHome.actions.buildWithAi || tHome.actions.ingest}</span>
            </button>

            {/* Customizer Toggle */}
            <button
              type="button"
              onClick={() => setShowCustomize(!showCustomize)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showCustomize
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Palette size={14} />
              <span className="hidden md:inline">{tHome.actions.customize}</span>
            </button>

            {/* View Mode Toggle (Mobile / Tablet) */}
            <div className="flex xl:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode(ViewMode.EDITOR)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === ViewMode.EDITOR 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText size={13} />
                <span className="hidden sm:inline">{tViewMode.editor}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode(ViewMode.PREVIEW)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === ViewMode.PREVIEW 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye size={13} />
                <span className="hidden sm:inline">{tViewMode.preview}</span>
              </button>
            </div>

            {/* Clear Button */}
            <button 
              type="button"
              onClick={handleClearData}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-all"
              title={tCommon.clearData}
            >
              <Trash2 size={15} />
            </button>

            {/* Export Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((open) => !open)}
                disabled={isExportBusy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isExportBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Printer size={14} />
                )}
                <span>
                  {isExporting ? tCommon.exporting : isExportingDocx ? tCommon.exportingDocx : tCommon.exportPrint}
                </span>
                {!isExportBusy && <ChevronDown size={12} />}
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportPDF();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 text-left font-medium"
                  >
                    <Printer size={14} />
                    {tCommon.exportPrint}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportDocx();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 text-left font-medium"
                  >
                    <FileDown size={14} />
                    {tCommon.exportDocx}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Customize Panel - Collapsible */}
        {showCustomize && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-5xl mx-auto">
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </header>

      {/* 2. 3-Tier Split Workspace */}
      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible">
        
        {/* Tier 1 (Left Rail): Sections & Strength Meter */}
        <aside className="w-64 lg:w-72 bg-slate-50/80 border-r border-slate-200/80 flex flex-col flex-shrink-0 h-[calc(100vh-64px)] overflow-y-auto p-4 space-y-4 hidden xl:block print:hidden">
          <ResumeStrengthCard
            resumeData={resumeData}
            onNavigateSection={handleNavigateSection}
          />

          <SectionNavigator
            sectionOrder={sectionOrder}
            onReorder={setSectionOrder}
            resumeData={resumeData}
            activeSectionId={activeSectionId}
            onNavigateSection={handleNavigateSection}
            onAddSection={handleAddSectionToOrder}
          />
        </aside>

        {/* Tier 2 (Center Column): Focused Card Editor */}
        <section
          className={`bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 h-[calc(100vh-64px)] overflow-y-auto print:hidden ${
            viewMode === ViewMode.PREVIEW ? 'hidden xl:block' : 'w-full xl:w-[540px] 2xl:w-[600px]'
          }`}
        >
          <div className="p-6">
            <ResumeEditor />
          </div>
        </section>

        {/* Tier 3 (Right Column): True-to-Scale Canvas & Controls */}
        <main
          // `print:flex`: the printed page is ~794px wide, below `xl`, so without it the
          // editor view's `hidden xl:flex` would hide the preview and print a blank page.
          className={`flex-1 bg-slate-200/50 flex flex-col h-[calc(100vh-64px)] overflow-hidden relative print:flex print:p-0 print:h-auto print:bg-white print:overflow-visible ${
            viewMode === ViewMode.EDITOR ? 'hidden xl:flex' : 'flex'
          }`}
        >
          {/* Density & Zoom Canvas Top Bar */}
          <div className="p-3 border-b border-slate-200/80 bg-slate-100/80 print:hidden">
            <DensityControls
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>

          {/* Centered A4 Canvas */}
          {/* Laid out at the true 210mm print width and scaled to fit (usePreviewScale),
              so lines and pages wrap exactly where the PDF and DOCX put them. The
              frame/transform are inline styles, hence the `!` print overrides. */}
          <div
            ref={viewportRef}
            className="flex-1 p-6 sm:p-8 overflow-auto flex justify-center-safe items-start print:block print:p-0 print:h-auto print:overflow-visible"
          >
            <div
              className="relative shrink-0 print:static print:w-auto! print:h-auto!"
              style={{ width: frame.width, height: frame.height }}
            >
              <div
                ref={canvasRef}
                className="absolute top-0 left-0 origin-top-left w-[210mm] min-h-[297mm] shadow-2xl bg-white items-center justify-center flex print:static print:w-full print:h-full print:shadow-none print:transform-none!"
                style={{ transform: `scale(${zoom})` }}
              >
                <div className="w-full h-full">
                  <ResumePreview />
                </div>
              </div>
            </div>
          </div>

          {/* Job Match Copilot Sliding Drawer */}
          <JobMatchDrawer
            isOpen={isJobMatchDrawerOpen}
            onClose={() => setIsJobMatchDrawerOpen(false)}
          />
        </main>

      </div>

      {/* 3. Onboarding Pathway & Ingest Modals */}
      <PathwayModal
        isOpen={isPathwayModalOpen}
        onClose={() => setIsPathwayModalOpen(false)}
        onSelectIngest={() => {
          setIsPathwayModalOpen(false);
          setIsIngestModalOpen(true);
        }}
        onSelectWizard={() => {
          setIsPathwayModalOpen(false);
          handleNavigateSection('personalInfo');
        }}
        onSelectTailor={() => {
          setIsPathwayModalOpen(false);
          setIsJobMatchDrawerOpen(true);
        }}
      />

      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
      />

    </div>
  );
}
