"use client";

import { X, Sparkles, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEvaluationLogic } from './useEvaluationLogic';
import { EvaluationJobInput } from './EvaluationJobInput';
import { EvaluationResultPanel } from './EvaluationResultPanel';

interface EvaluationPageProps {
  onClose?: () => void;
}

export function EvaluationPage({ onClose }: EvaluationPageProps) {
  const vm = useEvaluationLogic();
  const router = useRouter();

  const handleClose = () => {
    if (onClose) onClose();
    else router.push('/');
  };

  return (
    <div className="h-screen w-full flex bg-slate-100">
      {/* Left sidebar — always visible */}
      <aside className="w-80 xl:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-full overflow-hidden">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">AI Evaluation</h2>
              <p className="text-[11px] text-slate-400">Candidate Intelligence</p>
            </div>
          </div>
          <button
            id="btn-close-evaluation"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="Close evaluation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Candidate summary card */}
        <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {vm.resumeData.personalInfo.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {vm.resumeData.personalInfo.name || 'Unknown Candidate'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {vm.resumeData.personalInfo.title || 'No title provided'}
              </p>
              {vm.resumeData.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {vm.resumeData.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                  {vm.resumeData.skills.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                      +{vm.resumeData.skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics legend */}
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evaluation Weights</p>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'Role Match', pct: '25%' },
              { label: 'Skills Match', pct: '20%' },
              { label: 'Experience Quality', pct: '15%' },
              { label: 'Achievements & Impact', pct: '15%' },
              { label: 'Career Stability', pct: '10%' },
              { label: 'Communication Quality', pct: '10%' },
              { label: 'Education & Certs', pct: '5%' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{item.label}</span>
                <span className="text-xs font-semibold text-indigo-600">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Evaluation uses your CV data from the resume builder. Results are based on heuristic analysis.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList size={18} className="text-indigo-500" />
            <h1 className="text-base font-semibold text-slate-900">
              {vm.result ? 'Evaluation Intelligence' : 'Job Description Input'}
            </h1>
            {vm.result && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                vm.result.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                vm.result.overallScore >= 65 ? 'bg-indigo-100 text-indigo-700' :
                vm.result.overallScore >= 45 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                Score: {vm.result.overallScore}/100
              </span>
            )}
          </div>
          {vm.result && (
            <button
              onClick={() => vm.setResult(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              ← New Evaluation
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 p-8 max-w-8xl mx-auto w-full">
          {vm.result ? (
            <EvaluationResultPanel
              result={vm.result}
              onReevaluate={() => vm.setResult(null)}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Provide Job Description</h2>
                <p className="text-sm text-slate-500">
                  Paste or upload the job description to evaluate your CV against it. Your input is saved locally for future sessions.
                </p>
              </div>
              <EvaluationJobInput
                inputMode={vm.inputMode}
                onSetInputMode={vm.setInputMode}
                jobDescription={vm.jobDescription}
                onJobDescriptionChange={vm.setJobDescription}
                pdfFile={vm.pdfFile}
                fileInputRef={vm.fileInputRef}
                onFileChange={vm.handleFileChange}
                hasPersistedJD={vm.hasPersistedJD}
                onClearJD={vm.clearPersistedJD}
                onEvaluate={vm.handleEvaluate}
                isEvaluating={vm.isEvaluating}
                canEvaluate={vm.canEvaluate}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
