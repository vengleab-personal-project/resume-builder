"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from "@/client/hooks/useTranslations";

type SectionSchema = Record<string, unknown>;

import { Send } from 'lucide-react';

interface AISectionGeneratorModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  schema: SectionSchema;
  onApply: (items: T[], mode: 'replace' | 'amend') => void;
  onGenerate: (briefInfo: string, sectionTitle: string, schema: SectionSchema) => Promise<T[]>;
  currentContent?: React.ReactNode;
}

export function AISectionGeneratorModal<T>({
  isOpen,
  onClose,
  sectionTitle,
  schema,
  onApply,
  onGenerate,
  currentContent,
}: AISectionGeneratorModalProps<T>) {
  const { t: tAi } = useTranslations('ai');
  const { t: tCommon } = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [briefInfo, setBriefInfo] = useState('');
  const [aiResult, setAiResult] = useState<T[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    setBriefInfo('');
    setAiResult([]);
    setError('');

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!briefInfo.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');
    
    try {
      const result = await onGenerate(briefInfo, sectionTitle, schema);
      setAiResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = (mode: 'replace' | 'amend') => {
    if (aiResult.length > 0) {
      onApply(aiResult, mode);
      handleClose();
    }
  };

  const handleClose = () => {
    setBriefInfo('');
    setAiResult([]);
    setError('');
    onClose();
  };

  const renderPreviewItem = (item: T, index: number) => {
    if (typeof item !== 'object' || item === null) {
      return <div key={index} className="text-sm text-slate-700">{String(item)}</div>;
    }
    
    return (
      <div key={index} className="p-3 bg-white rounded-lg border border-indigo-100 mb-2 last:mb-0">
        {Object.entries(item as Record<string, unknown>).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-sm mb-1 last:mb-0">
            <span className="font-medium text-slate-600 capitalize min-w-[80px] text-[10px]">{key}:</span>
            <span className="text-slate-700 break-words flex-1 text-[11px]">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{tAi.assistant}</h2>
              <p className="text-[11px] text-slate-500">{sectionTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Preview */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 bg-slate-50/30">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {tAi.currentContent}
                </h3>
                {currentContent ? (
                  <div className="opacity-90 origin-top">
                    {currentContent}
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-sm text-center py-8">
                    {tAi.noContent}
                  </div>
                )}
              </div>

              {aiResult.length > 0 && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={12} />
                    {tAi.result}
                  </h3>
                  <div className="ring-2 ring-indigo-500 ring-offset-2 rounded-lg p-4 bg-indigo-50 shadow-lg">
                    {aiResult.map((item, index) => renderPreviewItem(item, index))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Chat/Instruction */}
          <div className="w-[350px] flex flex-col bg-white">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 border border-slate-100">
                {tAi.briefInfoPlaceholder}
              </div>
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-indigo-50 rounded-2xl p-4 text-sm text-indigo-600 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {tAi.generating}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {aiResult.length > 0 && !isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-indigo-600 text-white rounded-2xl p-4 text-sm shadow-md animate-in slide-in-from-left-2 duration-300">
                    <p className="font-medium mb-1">{tAi.resultReady || 'I have generated content for this section.'}</p>
                    <p className="text-indigo-100 text-xs">{tAi.reviewOnLeft || 'Review the suggested changes on the left.'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="relative">
                <textarea
                  value={briefInfo}
                  onChange={(e) => setBriefInfo(e.target.value)}
                  placeholder={tAi.placeholder}
                  className="w-full h-24 p-3 pr-12 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none placeholder:text-slate-400 bg-white shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  disabled={isGenerating}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !briefInfo.trim()}
                  className={cn(
                    "absolute bottom-3 right-3 p-2 rounded-lg transition-all",
                    isGenerating || !briefInfo.trim() ? "text-slate-300" : "text-indigo-600 hover:bg-indigo-50"
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
        </div>

        {/* Footer Actions */}
        {aiResult.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setAiResult([])}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              {tAi.regenerate}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleApply('amend')}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
              >
                {tCommon.amend}
              </button>
              <button
                onClick={() => handleApply('replace')}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
              >
                {tCommon.replace}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
