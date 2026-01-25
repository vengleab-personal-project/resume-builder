"use client";

import React from 'react';
import { Printer } from 'lucide-react';
import { Upload } from '@/features/Upload';
import { ResumeEditor, ThemeSwitcher } from '@/features/Editor';
import { ResumePreview } from '@/features/Resume';
import { useHomeLogic } from './useHomeLogic';

export const HomePage: React.FC = () => {
  const { handlePrint } = useHomeLogic();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* App Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            AI
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Resume<span className="text-indigo-600">Builder</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer size={16} />
            Export / Print
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Controls (Scrollable) */}
        <div className="w-[450px] bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 h-[calc(100vh-64px)] overflow-y-auto print:hidden">
          <div className="p-6 space-y-6">
            
            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">1. Ingest</h2>
              <Upload />
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">2. Customize</h2>
              <ThemeSwitcher />
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">3. Edit Content</h2>
              <ResumeEditor />
            </section>
            
          </div>
        </div>

        {/* Right Panel: Live Preview (Centered) */}
        <div className="flex-1 bg-slate-200/50 p-8 overflow-y-auto h-[calc(100vh-64px)] flex justify-center items-start print:p-0 print:h-auto print:bg-white print:overflow-visible">
          
          <div className="print:w-full print:h-full w-[210mm] min-h-[297mm] shadow-2xl bg-white origin-top items-center justify-center flex transition-all print:shadow-none print:transform-none">
             <div className="w-full h-full"> 
               <ResumePreview />
             </div>
          </div>

        </div>
      </div>

    </div>
  );
};
