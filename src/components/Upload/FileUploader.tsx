"use client";

import React, { useRef, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Cpu, Sparkles } from 'lucide-react';
import { useResumeStore } from '@/lib/store';
import { AIProvider, AIModel } from '@/lib/types';

export default function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setResumeData, setIsParsing, isParsing, aiConfig, setAIConfig } = useResumeStore();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", aiConfig.provider);
    formData.append("model", aiConfig.model);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setResumeData(data); // Update store
      
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume. Please try again.");
    } finally {
      setIsParsing(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const providers: { id: AIProvider; name: string; icon: React.ElementType }[] = [
    { id: 'openai', name: 'OpenAI', icon: Sparkles },
    { id: 'google', name: 'Google Gemini', icon: Cpu },
  ];

  const models: Record<AIProvider, { id: AIModel; name: string }[]> = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o (Smartest)' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 (Fast)' },
    ],
    google: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    ],
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">AI Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setAIConfig({ provider: p.id, model: models[p.id][0].id });
              }}
              className={`
                flex items-center justify-center gap-2 p-2 rounded-md border text-sm font-medium transition-all
                ${aiConfig.provider === p.id 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
              `}
            >
              <p.icon size={14} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Model</label>
        <select
          value={aiConfig.model}
          onChange={(e) => setAIConfig({ model: e.target.value as AIModel })}
          className="w-full p-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          {models[aiConfig.provider].map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <div 
          onClick={() => !isParsing && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isParsing ? 'bg-slate-50 border-slate-300 cursor-not-allowed' : 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.docx,.txt" 
            className="hidden" 
            disabled={isParsing}
          />
          
          {isParsing ? (
            <>
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-sm text-slate-500 font-medium">Analyzing with AI...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-indigo-500 mb-2" />
              <p className="text-sm text-slate-700 font-medium">Click to Upload</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}

