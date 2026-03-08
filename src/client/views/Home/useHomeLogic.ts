"use client";

import { useState } from 'react';
import { useResumeStore } from '@/client/store/resume-store';

export const useHomeLogic = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { resumeData } = useResumeStore();

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

  return {
    isExporting,
    handleExportPDF
  };
};
