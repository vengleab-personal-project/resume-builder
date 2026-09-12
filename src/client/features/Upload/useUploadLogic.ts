"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { useChatModels } from '@/client/hooks/useChatModels';
import { parseResume } from '@/server/services/resumeService';
import { AIProvider, AIModel, ViewMode } from '@/shared/types';

export const useUploadLogic = () => {
  const { models, providers, modelsForProvider, isLoading: isLoadingModels } = useChatModels();
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

  // A persisted localStorage aiConfig can point at a model an admin has since
  // deactivated. The server would silently substitute its default; snap the
  // selection back so the UI never claims a model that will not run.
  useEffect(() => {
    if (isLoadingModels || models.length === 0) return;
    if (models.some((model) => model.modelId === aiConfig.model)) return;

    const preferred =
      models.find((model) => model.provider === aiConfig.provider && model.isDefault) ??
      models.find((model) => model.provider === aiConfig.provider) ??
      models.find((model) => model.isDefault) ??
      models[0];

    setAIConfig({ provider: preferred.provider, model: preferred.modelId });
  }, [isLoadingModels, models, aiConfig.model, aiConfig.provider, setAIConfig]);

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
    const available = modelsForProvider(provider);
    const next = available.find((model) => model.isDefault) ?? available[0];
    setAIConfig(next ? { provider, model: next.modelId } : { provider });
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
    models,
    providers,
    modelsForProvider,
    isLoadingModels,
  };
};
