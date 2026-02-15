"use client";

import { useRef, useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { parseResume } from '@/services/resumeService';
import { AIProvider, AIModel, ViewMode } from '@/types';

export const useUploadLogic = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    setResumeData, 
    setIsParsing, 
    isParsing, 
    aiConfig, 
    setAIConfig, 
    setViewMode 
  } = useResumeStore();
  const [error, setError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isParsing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processInput = async (input: File | string) => {
    setIsParsing(true);
    setError(null);
    setViewMode(ViewMode.EDITOR);

    try {
      const data = await parseResume(input, aiConfig);
      setResumeData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume. Please try again.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processInput(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isParsing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processInput(file);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim() || isParsing) return;
    await processInput(pastedText);
    setPastedText('');
  };

  const handleProviderChange = (provider: AIProvider) => {
    const defaultModels: Record<AIProvider, AIModel> = {
      openai: 'gpt-4o',
      google: 'gemini-3-flash-preview'
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
    triggerFileInput,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    pastedText,
    setPastedText,
    handlePasteSubmit
  };
};
