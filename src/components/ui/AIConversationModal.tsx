"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from "@/hooks/useTranslations";
import { sanitizeHTML } from '@/lib/sanitize';

interface AIConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: string;
  onApply: (value: string, mode: 'replace' | 'amend') => void;
  onGenerate: (instruction: string, existingData: string) => Promise<string>;
  fieldType?: 'text' | 'richtext';
}

export const AIConversationModal = ({
  isOpen,
  onClose,
  title,
  currentValue,
  onApply,
  onGenerate,
  fieldType = 'text'
}: AIConversationModalProps) => {
  const { t: tAi } = useTranslations('ai');
  const { t: tCommon } = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Reset state when modal opens or when currentValue changes
  useEffect(() => {
    if (isOpen) {
      setInstruction('');
      setAiResult('');
      setError('');
    }
  }, [isOpen, currentValue]);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const result = await onGenerate(instruction, currentValue);
      setAiResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (mode: 'replace' | 'amend') => {
    if (aiResult) {
      onApply(aiResult, mode);
      handleClose();
    }
  };

  const handleClose = () => {
    setInstruction('');
    setAiResult('');
    setError('');
    onClose();
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{tAi.assistant}</h2>
              <p className="text-xs text-slate-500">{title}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {/* Current Value Display */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {tAi.currentContent}
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 max-h-32 overflow-auto break-words">
              {currentValue ? (
                fieldType === 'richtext' ? (
                  <div 
                    className="[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2 [&_li]:text-slate-700" 
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentValue) }} 
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">{currentValue}</pre>
                )
              ) : (
                <span className="text-slate-400 italic">{tAi.noContent}</span>
              )}
            </div>
          </div>

          {/* Instruction Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {tAi.question}
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={tAi.placeholder}
              className="w-full h-24 p-3 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !instruction.trim()}
              className={cn(
                "mt-3 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                isLoading || !instruction.trim()
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {tAi.generating}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {tAi.generate}
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* AI Result Preview */}
          {aiResult && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {tAi.result}
                </label>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  {tAi.regenerate}
                </button>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-slate-700 max-h-64 overflow-auto break-words">
                {fieldType === 'richtext' ? (
                  <div 
                    className="[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2 [&_li]:text-slate-700" 
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(aiResult) }} 
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">{aiResult}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {aiResult && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {tCommon.cancel}
            </button>
            <button
              onClick={() => handleApply('amend')}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              {tCommon.amend}
            </button>
            <button
              onClick={() => handleApply('replace')}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              {tCommon.replace}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
