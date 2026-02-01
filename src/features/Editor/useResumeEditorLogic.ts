"use client";

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { refineResumeField } from '@/services/resumeService';

export const useResumeEditorLogic = () => {
  const { resumeData, setResumeData, aiConfig } = useResumeStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Local state for skills and certifications text input
  const [skillsText, setSkillsText] = useState(resumeData.skills.join(', '));
  const [certsText, setCertsText] = useState(resumeData.certifications.join('\n'));

  // Sync local state with store changes
  useEffect(() => {
    const currentText = resumeData.skills.join(', ');
    const normalizedLocal = skillsText.split(',').map(s => s.trim()).filter(Boolean).join(', ');
    if (currentText !== normalizedLocal) {
      setSkillsText(currentText);
    }
  }, [resumeData.skills]);

  useEffect(() => {
    const currentText = resumeData.certifications.join('\n');
    const normalizedLocal = certsText.split('\n').map(s => s.trim()).filter(Boolean).join('\n');
    if (currentText !== normalizedLocal) {
      setCertsText(currentText);
    }
  }, [resumeData.certifications]);

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

  const toggleBreakPage = (key: 'experience' | 'education' | 'publications', index: number) => {
    const list = [...(resumeData[key] as any[])];
    list[index] = { ...list[index], breakPage: !list[index].breakPage };
    setResumeData({ ...resumeData, [key]: list });
  };

  const updateSummary = (v: string) => setResumeData({...resumeData, summary: v});
  
  const updateSkills = (v: string) => setResumeData({...resumeData, skills: v.split(',').map(s => s.trim()).filter(Boolean)});
  
  const updateCertifications = (v: string) => setResumeData({...resumeData, certifications: v.split('\n').filter(Boolean)});

  const handleSkillsChange = (val: string) => {
    setSkillsText(val);
    updateSkills(val);
  };

  const handleCertsChange = (val: string) => {
    setCertsText(val);
    updateCertifications(val);
  };

  return {
    resumeData,
    loadingStates,
    skillsText,
    certsText,
    updatePersonalInfo,
    addItem,
    removeItem,
    updateItem,
    updateSummary,
    updateSkills,
    updateCertifications,
    handleSkillsChange,
    handleCertsChange,
    refineWithInstruction,
    generateItems,
    setResumeData,
    toggleBreakPage,
  };
};
