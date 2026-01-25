"use client";

import { useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { refineResumeField } from '@/services/resumeService';

export const useResumeEditorLogic = () => {
  const { resumeData, setResumeData, aiConfig } = useResumeStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLocalLoading = (key: string, val: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: val }));
  };

  const handleRefineField = async (id: string, currentVal: string, field: string, suggestion: string, onDone: (res: string) => void) => {
    setLocalLoading(id, true);
    try {
      const { refinedContent } = await refineResumeField(field, currentVal, suggestion, aiConfig);
      if (refinedContent) onDone(refinedContent);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(id, false);
    }
  };

  // This one is slightly different in original code (uses /api/refine-resume with instruction)
  // I'll keep the flexibility but use the service if it matches
  const refineWithInstruction = async (id: string, currentVal: string, instruction: string, onDone: (res: string) => void) => {
    setLocalLoading(id, true);
    try {
      const res = await fetch('/api/refine-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, content: currentVal, config: aiConfig }),
      });
      const data = await res.json();
      if (data.result) onDone(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(id, false);
    }
  };

  const generateItems = async (id: string, sectionTitle: string, onDone: (data: any) => void, schema: any) => {
    setLocalLoading(id, true);
    try {
      const res = await fetch('/api/refine-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instruction: `Generate professional and relevant entries for the resume section: ${sectionTitle} in JSON format.`, 
          schema,
          config: aiConfig
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
  };

  const updatePersonalInfo = (key: string, val: string) => {
    setResumeData({ 
      ...resumeData, 
      personalInfo: { ...resumeData.personalInfo, [key]: val } 
    });
  };

  const addItem = (key: 'experience' | 'education' | 'publications', item: any) => {
    setResumeData({
      ...resumeData,
      [key]: [...(resumeData[key] || []), item]
    });
  };

  const removeItem = (key: 'experience' | 'education' | 'publications' | 'skills' | 'certifications', index: number) => {
    const list = [...(resumeData[key] || [])];
    list.splice(index, 1);
    setResumeData({ ...resumeData, [key]: list });
  };

  const updateItem = (key: 'experience' | 'education' | 'publications', index: number, field: string, val: any) => {
    const list = [...(resumeData[key] as any[])];
    list[index] = { ...list[index], [field]: val };
    setResumeData({ ...resumeData, [key]: list });
  };

  const updateSummary = (v: string) => setResumeData({...resumeData, summary: v});
  
  const updateSkills = (v: string) => setResumeData({...resumeData, skills: v.split(',').map(s => s.trim()).filter(Boolean)});
  
  const updateCertifications = (v: string) => setResumeData({...resumeData, certifications: v.split('\n').filter(Boolean)});

  return {
    resumeData,
    loadingStates,
    updatePersonalInfo,
    addItem,
    removeItem,
    updateItem,
    updateSummary,
    updateSkills,
    updateCertifications,
    refineWithInstruction,
    generateItems,
    setResumeData
  };
};
