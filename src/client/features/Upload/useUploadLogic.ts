"use client";

import { useRef, useState, useCallback } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { parseResume } from '@/server/services/resumeService';
import { AIProvider, AIModel, ViewMode } from '@/shared/types';

export const useUploadLogic = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  const cancelParsing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsParsing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setIsParsing]);

  const processInput = async (input: File | string) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsParsing(true);
    setError(null);
    setViewMode(ViewMode.EDITOR);

    try {
      const data = await parseResume(input, aiConfig, abortControllerRef.current.signal);
      setResumeData(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to parse resume. Please try again.";
      setError(message);
    } finally {
      setIsParsing(false);
      abortControllerRef.current = null;
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
      google: 'gemini-3.8-flash'
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
    handlePasteSubmit,
    cancelParsing,
  };
};
