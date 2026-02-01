"use client";

import { useRef, useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { parseResume } from '@/services/resumeService';
import { AIProvider, AIModel } from '@/types';

export const useUploadLogic = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    setResumeData, 
    setIsParsing, 
    isParsing, 
    aiConfig, 
    setAIConfig, 
    setOriginalFileUrl, 
    originalFileUrl,
    setViewMode 
  } = useResumeStore();
  const [error, setError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

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

  const processFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    setViewMode('parsed');

    // Create a preview URL for the original file
    if (originalFileUrl) {
      URL.revokeObjectURL(originalFileUrl);
    }
    const fileUrl = URL.createObjectURL(file);
    setOriginalFileUrl(fileUrl);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isParsing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
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
    triggerFileInput,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
