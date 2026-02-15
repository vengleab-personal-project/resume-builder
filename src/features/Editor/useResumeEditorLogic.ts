"use client";

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { refineResumeField } from '@/services/resumeService';

type SectionKey = 'experience' | 'education' | 'publications' | 'skills' | 'certifications' | 'volunteering' | 'languages' | 'otherTraining' | 'references';
type BreakPageKey = 'experience' | 'education' | 'publications' | 'volunteering' | 'otherTraining';

export const useResumeEditorLogic = () => {
  const { resumeData, setResumeData, aiConfig } = useResumeStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Local state for skills text input
  const [skillsText, setSkillsText] = useState(resumeData.skills.join(', '));

  // Sync local state with store changes
  useEffect(() => {
    const currentText = resumeData.skills.join(', ');
    const normalizedLocal = skillsText.split(',').map(s => s.trim()).filter(Boolean).join(', ');
    if (currentText !== normalizedLocal) {
      setSkillsText(currentText);
    }
  }, [resumeData.skills]);

  const setLocalLoading = (key: string, val: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: val }));
  };

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

  const addItem = (key: SectionKey, item: any) => {
    setResumeData({
      ...resumeData,
      [key]: [...((resumeData as any)[key] || []), item]
    });
  };

  const removeItem = (key: SectionKey, index: number) => {
    const list = [...((resumeData as any)[key] || [])];
    list.splice(index, 1);
    setResumeData({ ...resumeData, [key]: list });
  };

  const updateItem = (key: SectionKey, index: number, field: string, val: any) => {
    const list = [...((resumeData as any)[key] as any[])];
    list[index] = { ...list[index], [field]: val };
    setResumeData({ ...resumeData, [key]: list });
  };

  const toggleBreakPage = (key: BreakPageKey, index: number) => {
    const list = [...((resumeData as any)[key] as any[])];
    list[index] = { ...list[index], breakPage: !list[index].breakPage };
    setResumeData({ ...resumeData, [key]: list });
  };

  const updateSectionOrder = (newOrder: string[]) => {
    setResumeData({ ...resumeData, sectionOrder: newOrder });
  };

  const updateSummary = (v: string) => setResumeData({...resumeData, summary: v});
  
  const updateSkills = (v: string) => setResumeData({...resumeData, skills: v.split(',').map(s => s.trim()).filter(Boolean)});

  const handleSkillsChange = (val: string) => {
    setSkillsText(val);
    updateSkills(val);
  };

  return {
    resumeData,
    loadingStates,
    skillsText,
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
  };
};
