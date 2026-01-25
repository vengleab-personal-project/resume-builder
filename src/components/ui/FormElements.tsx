"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AIButton } from './AIButton';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onAiClick?: () => void;
  aiLoading?: boolean;
  className?: string;
}

export const Section = ({ 
  title, 
  children, 
  defaultOpen = false, 
  onAiClick, 
  aiLoading,
  className 
}: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={cn("border border-slate-200 rounded-lg bg-white mb-3 shadow-sm overflow-hidden", className)}>
      <div 
        className="w-full flex items-center justify-between p-3 text-left font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span className="text-sm font-semibold tracking-tight">{title}</span>
        </div>
        {onAiClick && (
          <AIButton label="Generate" onClick={onAiClick} loading={aiLoading} variant="ghost" />
        )}
      </div>
      {isOpen && <div className="p-4 border-t border-slate-100 bg-white">{children}</div>}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onAiClick?: () => void;
  aiLoading?: boolean;
}

export const Input = ({ 
  label, 
  onAiClick, 
  aiLoading, 
  className,
  ...props 
}: InputProps) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {onAiClick && <AIButton onClick={onAiClick} loading={aiLoading} variant="ghost" />}
    </div>
    <input
      {...props}
      value={props.value ?? ""}
      className={cn(
        "w-full text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400",
        className
      )}
    />
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  onAiClick?: () => void;
  aiLoading?: boolean;
}

export const TextArea = ({ 
  label, 
  onAiClick, 
  aiLoading, 
  className,
  ...props 
}: TextAreaProps) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {onAiClick && <AIButton onClick={onAiClick} loading={aiLoading} variant="ghost" />}
    </div>
    <textarea
      {...props}
      value={props.value ?? ""}
      className={cn(
        "w-full text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 min-h-[100px]",
        className
      )}
    />
  </div>
);
