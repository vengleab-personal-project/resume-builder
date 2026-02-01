"use client";

import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useResumeStore } from '@/store/resume-store';

export const useHomeLogic = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { setExportedFileUrl, setViewMode, resumeData, exportedFileUrl } = useResumeStore();

  const handleExportPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    setIsExporting(true);

    try {
      // 1. Generate Canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // 2. Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // 3. Create Blob and URL
      const pdfBlob = pdf.output('blob');
      
      if (exportedFileUrl) {
        URL.revokeObjectURL(exportedFileUrl);
      }
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setExportedFileUrl(pdfUrl);
      setViewMode('exported');

      // 4. Trigger Download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${resumeData.personalInfo.name || 'resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
