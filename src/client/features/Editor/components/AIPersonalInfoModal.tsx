"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, RefreshCw, Send } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from "@/client/hooks/useTranslations";
import { PersonalInfoSection } from './PersonalInfoSection';
import type { ResumeData } from '@/shared/types';

interface AIPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalInfo: ResumeData['personalInfo'];
  onApply: (data: ResumeData['personalInfo']) => void;
  onGenerate: (instruction: string, existingData: ResumeData['personalInfo']) => Promise<ResumeData['personalInfo']>;
  currentContent?: React.ReactNode;
}

export const AIPersonalInfoModal = ({
  isOpen,
  onClose,
  personalInfo,
  onApply,
  onGenerate,
  currentContent,
}: AIPersonalInfoModalProps) => {
  const { t: tAi } = useTranslations('ai');
  const { t: tCommon } = useTranslations('common');
  const { t: tEditor } = useTranslations('editor');
  
  const [isMounted, setIsMounted] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [aiResult, setAiResult] = useState<ResumeData['personalInfo'] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    setInstruction('');
    setAiResult(null);
    setGenerationError('');

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!instruction.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationError('');
    
    try {
      const result = await onGenerate(instruction, personalInfo);
      setAiResult(result);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : tCommon.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyChanges = () => {
    if (!aiResult) return;
    onApply(aiResult);
    onClose();
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        <ModalHeader title={tAi.assistant} subtitle={tEditor.personalInfo} onClose={onClose} />

        <div className="flex-1 flex overflow-hidden">
          <PreviewPanel 
            currentInfo={personalInfo} 
            generatedInfo={aiResult} 
            translations={{
              current: tAi.currentContent,
              result: tAi.result
            }} 
            currentContent={currentContent}
          />

          <ChatPanel 
            instruction={instruction}
            onInstructionChange={setInstruction}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={generationError}
            hasResult={!!aiResult}
            translations={{
              placeholder: tAi.placeholder,
              generating: tAi.generating,
              resultReady: tAi.resultReady || 'I have generated a professional profile for you.',
              reviewOnLeft: tAi.reviewOnLeft || 'Review the suggested changes on the left.',
              briefInfo: tAi.briefInfoPlaceholder
            }}
          />
        </div>

        {aiResult && (
          <ModalFooter 
            onCancel={() => setAiResult(null)} 
            onApply={handleApplyChanges}
            labels={{
              cancel: tAi.regenerate,
              apply: tCommon.apply
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

// --- Internal Sub-components ---

const ModalHeader = ({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-indigo-600" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
    >
      <X size={18} />
    </button>
  </div>
);

const PreviewPanel = ({ 
  currentInfo, 
  generatedInfo, 
  translations,
  currentContent,
}: { 
  currentInfo: ResumeData['personalInfo']; 
  generatedInfo: ResumeData['personalInfo'] | null;
  translations: { current: string; result: string };
  currentContent?: React.ReactNode;
}) => (
  <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 bg-slate-50/30">
    <div className="max-w-md mx-auto">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          {translations.current}
        </h3>
        {currentContent || (
          <PersonalInfoSection 
            personalInfo={currentInfo}
            onUpdateField={() => {}}
            onPhotoChange={() => {}}
            onAiGenerate={() => {}}
            aiLoading={false}
            readOnly={true}
          />
        )}
      </div>

      {generatedInfo && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={12} />
            {translations.result}
          </h3>
          <div className="ring-2 ring-indigo-500 ring-offset-2 rounded-lg overflow-hidden shadow-lg">
            <PersonalInfoSection 
              personalInfo={generatedInfo}
              onUpdateField={() => {}}
              onPhotoChange={() => {}}
              onAiGenerate={() => {}}
              aiLoading={false}
              readOnly={true}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);

const ChatPanel = ({
  instruction,
  onInstructionChange,
  onGenerate,
  isGenerating,
  error,
  hasResult,
  translations
}: {
  instruction: string;
  onInstructionChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string;
  hasResult: boolean;
  translations: {
    placeholder: string;
    generating: string;
    resultReady: string;
    reviewOnLeft: string;
    briefInfo: string;
  };
}) => (
  <div className="w-[400px] flex flex-col bg-white">
    <div className="flex-1 p-6 overflow-y-auto space-y-4">
      <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 border border-slate-100">
        {translations.briefInfo}
      </div>
      
      {isGenerating && (
        <div className="flex justify-start">
          <div className="bg-indigo-50 rounded-2xl p-4 text-sm text-indigo-600 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {translations.generating}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {hasResult && !isGenerating && (
        <div className="flex justify-start">
          <div className="bg-indigo-600 text-white rounded-2xl p-4 text-sm shadow-md animate-in slide-in-from-left-2 duration-300">
            <p className="font-medium mb-1">{translations.resultReady}</p>
            <p className="text-indigo-100 text-xs">{translations.reviewOnLeft}</p>
          </div>
        </div>
      )}
    </div>

    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
      <div className="relative">
        <textarea
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder={translations.placeholder}
          className="w-full h-24 p-3 pr-12 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none placeholder:text-slate-400 bg-white shadow-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onGenerate();
            }
          }}
        />
        <button
          onClick={onGenerate}
          disabled={isGenerating || !instruction.trim()}
          className={cn(
            "absolute bottom-3 right-3 p-2 rounded-lg transition-all",
            isGenerating || !instruction.trim() ? "text-slate-300" : "text-indigo-600 hover:bg-indigo-50"
          )}
        >
          <Send size={18} />
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  </div>
);

const ModalFooter = ({ onCancel, onApply, labels }: { onCancel: () => void; onApply: () => void; labels: { cancel: string; apply: string } }) => (
  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
    <button
      onClick={onCancel}
      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
    >
      {labels.cancel}
    </button>
    <button
      onClick={onApply}
      className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
    >
      {labels.apply}
    </button>
  </div>
);

