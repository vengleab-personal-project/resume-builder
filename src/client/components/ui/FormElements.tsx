"use client";

import React, { useState, KeyboardEvent, useEffect } from "react";
import { ChevronDown, ChevronRight, X, AlertCircle } from "lucide-react";
import { AIButton } from "./AIButton";
import { cn } from "@/shared/lib/utils";
import { useTranslations } from "@/client/hooks/useTranslations";

export { RichTextEditor } from "./RichTextEditor";
interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onAiClick?: () => void;
  aiLoading?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const Section = ({
  title,
  icon,
  children,
  defaultOpen = false,
  onAiClick,
  aiLoading,
  className,
  readOnly = false,
}: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "border border-slate-200 rounded-lg bg-white mb-3 shadow-sm overflow-hidden",
        className,
      )}
    >
      <div
        className="w-full flex items-center justify-between p-3 text-left font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown size={16} className="text-slate-400" />
            ) : (
              <ChevronRight size={16} className="text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <span className="text-sm font-bold tracking-tight text-slate-800">{title}</span>
          </div>
        </div>
        {onAiClick && !readOnly && (
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
      {isOpen && (
        <div className="p-4 border-t border-slate-100 bg-white">{children}</div>
      )}
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
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {onAiClick && (
        <AIButton onClick={onAiClick} loading={aiLoading} variant="ghost" />
      )}
    </div>
    <input
      {...props}
      value={props.value ?? ""}
      className={cn(
        "w-full text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400",
        className,
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
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {onAiClick && (
        <AIButton onClick={onAiClick} loading={aiLoading} variant="ghost" />
      )}
    </div>
    <textarea
      {...props}
      value={props.value ?? ""}
      className={cn(
        "w-full text-sm p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 min-h-[100px]",
        className,
      )}
    />
  </div>
);

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const TagInput = ({
  label,
  tags,
  onChange,
  placeholder,
  readOnly = false,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations("common");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const decodeHtml = (html: string) => {
    return html
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  };

  const processedTags = tags
    .map((tag) => decodeHtml(tag).trim())
    .filter(Boolean);

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    if (
      processedTags.some((t) => t.toLowerCase() === trimmedValue.toLowerCase())
    ) {
      setError(t.errors.duplicateSkill);
      return;
    }

    onChange([...processedTags, trimmedValue]);
    setInputValue("");
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      processedTags.length > 0
    ) {
      e.preventDefault();
      const newTags = [...processedTags];
      newTags.pop();
      onChange(newTags);
      setError(null);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(processedTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      <div
        className="flex flex-wrap gap-2 p-1.5 bg-slate-50/50 border border-slate-200 rounded-md focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all cursor-text min-h-[42px]"
        onClick={() => document.getElementById(`tag-input-${label}`)?.focus()}
      >
        {processedTags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-sm rounded border border-indigo-100 transition-colors"
          >
            {tag}
            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:text-indigo-900 transition-colors p-0.5"
                type="button"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {!readOnly && (
          <input
            id={`tag-input-${label}`}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={processedTags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm p-1 placeholder:text-slate-400"
          />
        )}
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};
