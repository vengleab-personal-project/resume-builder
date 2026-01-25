"use client";

import { useRef, useState } from 'react';
import { useResumeStore } from '@/lib/store';
import { parseResume } from '@/services/resumeService';
import { AIProvider, AIModel } from '@/types';

export const useUploadLogic = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setResumeData, setIsParsing, isParsing, aiConfig, setAIConfig } = useResumeStore();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const data = await parseResume(file, aiConfig);
      setResumeData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume. Please try again.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    const defaultModels: Record<AIProvider, AIModel> = {
      openai: 'gpt-4o',
      google: 'gemini-3-flash'
    };
    setAIConfig({ provider, model: defaultModels[provider] });
  };

  const handleModelChange = (model: AIModel) => {
    setAIConfig({ model });
  };

  const triggerFileInput = () => {
    if (!isParsing) {
      fileInputRef.current?.click();
    }
  };

  return {
    fileInputRef,
    isParsing,
    aiConfig,
    error,
    handleFileChange,
    handleProviderChange,
    handleModelChange,
    triggerFileInput
  };
};
