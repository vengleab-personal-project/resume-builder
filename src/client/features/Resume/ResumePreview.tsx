"use client";

import React, { memo, useRef } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { ResumeDocument } from './ResumeDocument';
import { PageBreakIndicator } from './components/PageBreakIndicator';
import { usePrintPagination } from './usePrintPagination';

const ResumePreviewComponent = () => {
  const { resumeData, theme, sectionOrder } = useResumeStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const { flows, nearlyFits } = usePrintPagination(containerRef);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[1122px]">
      {/* Visual Page Boundary Indicators (Screen only, hidden in print) */}
      <PageBreakIndicator flows={flows} nearlyFits={nearlyFits} />

      <ResumeDocument resumeData={resumeData} theme={theme} sectionOrder={sectionOrder} printable />
    </div>
  );
};

export const ResumePreview = memo(ResumePreviewComponent);
