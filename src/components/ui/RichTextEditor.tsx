"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { sanitizeHTML } from "@/lib/sanitize";
import { AIButton } from "./AIButton";
import { AIConversationModal } from "./AIConversationModal";
import { cn } from "@/lib/utils";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse bg-slate-100 rounded-md"
      style={{ minHeight: "100px" }}
    />
  ),
});

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAiGenerate?: (instruction: string, existingData: string) => Promise<string>;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const DEBOUNCE_MS = 300;

const RichTextEditorComponent = ({
  label,
  value,
  onChange,
  onAiGenerate,
  placeholder,
  className,
  minHeight = "100px",
}: RichTextEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const mountedRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync external value changes (AI apply, reset, etc.) into local state
  // This uses the "derive state from props" pattern recommended by React
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value);
  }

  // Defer rendering to prevent blocking the main thread
  useEffect(() => {
    mountedRef.current = true;

    // Use requestIdleCallback with setTimeout fallback for Safari
    const scheduleReady = () => {
      if (typeof requestIdleCallback !== "undefined") {
        return requestIdleCallback(
          () => {
            if (mountedRef.current) setIsReady(true);
          },
          { timeout: 100 },
        );
      } else {
        return window.setTimeout(() => {
          if (mountedRef.current) setIsReady(true);
        }, 50);
      }
    };

    const timer = scheduleReady();

    return () => {
      mountedRef.current = false;
      if (
        typeof cancelIdleCallback !== "undefined" &&
        typeof timer === "number"
      ) {
        cancelIdleCallback(timer);
      } else {
        clearTimeout(timer as number);
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        // ['clean']
      ],
    }),
    [],
  );

  const formats = useMemo(() => ["bold", "italic", "underline", "list"], []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback((content: string) => {
    setLocalValue(content);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sanitized = sanitizeHTML(content);
      onChangeRef.current(sanitized);
    }, DEBOUNCE_MS);
  }, []);

  const handleApply = useCallback(
    (newValue: string, mode: "replace" | "amend") => {
      if (mode === "replace") {
        setLocalValue(newValue);
        onChangeRef.current(newValue);
      } else {
        // Amend mode: append to existing content
        const combined = localValue ? `${localValue}\n${newValue}` : newValue;
        setLocalValue(combined);
        onChangeRef.current(combined);
      }
    },
    [localValue],
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        {onAiGenerate && (
          <AIButton onClick={() => setIsModalOpen(true)} variant="ghost" />
        )}
      </div>
      <div
        className={cn(
          "rich-text-editor bg-slate-50/50 border border-slate-200 rounded-md focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all",
          className,
        )}
        style={{ minHeight }}
      >
        {isReady ? (
          <ReactQuill
            theme="snow"
            value={localValue}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            className="rich-text-quill"
          />
        ) : (
          <div
            className="animate-pulse bg-slate-100 rounded-md"
            style={{ minHeight }}
          />
        )}
      </div>
      <style jsx global>{`
        .rich-text-editor .ql-container {
          border: none;
          font-size: 14px;
          min-height: ${minHeight};
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          padding: 10px;
        }
        .rich-text-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 6px 6px 0 0;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #64748b;
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: #64748b;
        }
        .rich-text-editor .ql-snow .ql-picker-label {
          color: #64748b;
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #4f46e5;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #4f46e5;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #4f46e5;
        }
      `}</style>

      {onAiGenerate && (
        <AIConversationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={label}
          currentValue={value}
          onApply={handleApply}
          onGenerate={onAiGenerate}
          fieldType="richtext"
        />
      )}
    </div>
  );
};

export const RichTextEditor = memo(RichTextEditorComponent);
