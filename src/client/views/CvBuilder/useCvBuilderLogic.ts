"use client";

import { useState } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import { generateResumeDocx } from './generateResumeDocx';

export const useCvBuilderLogic = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const { resumeData, theme, sectionOrder } = useResumeStore();
  const { t } = useTranslations('editor');

  const handleExportPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    setIsExporting(true);

    try {
      // Use browser's native print API - produces pixel-perfect PDFs
      // The browser properly renders CSS flexbox, SVG icons, and all styles
      
      // Store original document title to restore later
      const originalTitle = document.title;
      
      // Set document title (this becomes the default PDF filename)
      document.title = `${resumeData.personalInfo.name || 'resume'}`;
      
      // Trigger browser's print dialog (user can save as PDF)
      window.print();
      
      // Restore original title after a short delay
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    setIsExportingDocx(true);

    try {
      const blob = await generateResumeDocx(resumeData, theme, sectionOrder, t.preview);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeData.personalInfo.name || 'resume'}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DOCX export failed:', error);
    } finally {
      setIsExportingDocx(false);
    }
  };

  return {
    isExporting,
    isExportingDocx,
    handleExportPDF,
    handleExportDocx
  };
};
