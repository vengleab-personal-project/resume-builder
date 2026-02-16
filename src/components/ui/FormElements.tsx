"use client";

import React, { useState, KeyboardEvent } from 'react';
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { AIButton } from './AIButton';
import { cn } from '@/lib/utils';

export { RichTextEditor } from './RichTextEditor';

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
          <AIButton 
            label="Generate" 
            onClick={(e) => {
              e.stopPropagation();
              onAiClick();
            }} 
            loading={aiLoading}
            variant="ghost" 
          />
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

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  addButtonLabel?: string;
}

export const TagInput = ({
  label,
  tags,
  onChange,
  placeholder,
  addButtonLabel = "Add"
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, index) => (
          <span 
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md border border-slate-200"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
              type="button"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
        />
        <button
          onClick={addTag}
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
};
