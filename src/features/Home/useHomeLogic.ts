"use client";

import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useResumeStore } from '@/store/resume-store';
import { PDF_EXPORT_CONFIG } from '@/config/constants';

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
        scale: PDF_EXPORT_CONFIG.CANVAS_SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // 2. Create PDF
      const imgData = canvas.toDataURL(PDF_EXPORT_CONFIG.IMAGE_MIME_TYPE);
      const pdf = new jsPDF({
        orientation: PDF_EXPORT_CONFIG.ORIENTATION,
        unit: PDF_EXPORT_CONFIG.UNIT,
        format: PDF_EXPORT_CONFIG.FORMAT,
      });

      const imgWidth = PDF_EXPORT_CONFIG.A4_WIDTH_MM;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, PDF_EXPORT_CONFIG.IMAGE_FORMAT, 0, 0, imgWidth, imgHeight);
      
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
