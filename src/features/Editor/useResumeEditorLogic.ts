"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { API_ENDPOINTS } from '@/config/constants';

type SectionKey = 'experience' | 'education' | 'publications' | 'skills' | 'certifications' | 'volunteering' | 'languages' | 'otherTraining' | 'references';
type BreakPageKey = 'experience' | 'education' | 'publications' | 'volunteering' | 'otherTraining';

export const useResumeEditorLogic = () => {
  const { resumeData, setResumeData, aiConfig, sectionOrder, setSectionOrder } = useResumeStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Keep a ref to latest resumeData to avoid stale closures in callbacks
  const resumeDataRef = useRef(resumeData);
  useEffect(() => {
    resumeDataRef.current = resumeData;
  }, [resumeData]);

  const setLocalLoading = useCallback((key: string, val: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: val }));
  }, []);

  const refineWithInstruction = useCallback(async (id: string, currentVal: string, instruction: string, onDone: (res: string) => void) => {
    setLocalLoading(id, true);
    try {
      const config = useResumeStore.getState().aiConfig;
      const res = await fetch('/api/refine-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, content: currentVal, config }),
      });
      const data = await res.json();
      if (data.result) onDone(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(id, false);
    }
  }, [setLocalLoading]);

  const generateItems = useCallback(async (id: string, sectionTitle: string, onDone: (data: unknown) => void, schema: Record<string, unknown>) => {
    setLocalLoading(id, true);
    try {
      const config = useResumeStore.getState().aiConfig;
      const res = await fetch('/api/refine-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instruction: `Generate professional and relevant entries for the resume section: ${sectionTitle} in JSON format.`, 
          schema,
          config
        }),
      });
      const data = await res.json();
      if (data.items) onDone(data.items);
      else onDone(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(id, false);
    }
  }, [setLocalLoading]);

  const updatePersonalInfo = useCallback((key: string, val: string) => {
    const current = useResumeStore.getState().resumeData;
    setResumeData({ 
      ...current, 
      personalInfo: { ...current.personalInfo, [key]: val } 
    });
  }, [setResumeData]);

  const addItem = useCallback((key: SectionKey, item: unknown) => {
    const current = useResumeStore.getState().resumeData;
    const currentArray = (current as unknown as Record<string, unknown[]>)[key] || [];
    setResumeData({
      ...current,
      [key]: [...currentArray, item]
    });
  }, [setResumeData]);

  const removeItem = useCallback((key: SectionKey, index: number) => {
    const current = useResumeStore.getState().resumeData;
    const list = [...((current as unknown as Record<string, unknown[]>)[key] || [])];
    list.splice(index, 1);
    setResumeData({ ...current, [key]: list });
  }, [setResumeData]);

  const updateItem = useCallback((key: SectionKey, index: number, field: string, val: unknown) => {
    const current = useResumeStore.getState().resumeData;
    const list = [...((current as unknown as Record<string, unknown[]>)[key] as Array<Record<string, unknown>>)];
    list[index] = { ...list[index], [field]: val };
    setResumeData({ ...current, [key]: list });
  }, [setResumeData]);

  const toggleBreakPage = useCallback((key: BreakPageKey, index: number) => {
    const current = useResumeStore.getState().resumeData;
    const list = [...((current as unknown as Record<string, Array<{ breakPage?: boolean }>>)[key])];
    list[index] = { ...list[index], breakPage: !list[index].breakPage };
    setResumeData({ ...current, [key]: list });
  }, [setResumeData]);

  const updateSectionOrder = useCallback((newOrder: string[]) => {
    setSectionOrder(newOrder);
  }, [setSectionOrder]);

  const updateSummary = useCallback((v: string) => {
    const current = useResumeStore.getState().resumeData;
    setResumeData({...current, summary: v});
  }, [setResumeData]);
  
  const updateSkills = useCallback((v: string) => {
    const current = useResumeStore.getState().resumeData;
    setResumeData({...current, skills: v.split(',').map(s => s.trim()).filter(Boolean)});
  }, [setResumeData]);

  const handleSkillsChange = useCallback((tags: string[]) => {
    const current = useResumeStore.getState().resumeData;
    setResumeData({ ...current, skills: tags });
  }, [setResumeData]);

  const refineContent = useCallback(async (instruction: string, existingData: string): Promise<string> => {
    const config = useResumeStore.getState().aiConfig;
    const res = await fetch(API_ENDPOINTS.REFINE_RESUME, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        content: existingData,
        config,
      }),
    });
    const data = await res.json();
    return data.result || '';
  }, []);

  return {
    resumeData,
    loadingStates,
    updatePersonalInfo,
    addItem,
    removeItem,
    updateItem,
    updateSummary,
    updateSkills,
    handleSkillsChange,
    refineWithInstruction,
    generateItems,
    setResumeData,
    toggleBreakPage,
    updateSectionOrder,
    sectionOrder,
    aiConfig,
    refineContent,
  };
};
