"use client";

import React, { memo, useRef } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { ResumeDocument } from './ResumeDocument';
import { PageBreakIndicator } from './components/PageBreakIndicator';

const ResumePreviewComponent = () => {
  const { resumeData, theme, sectionOrder } = useResumeStore();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[1122px]">
      {/* Visual Page Boundary Indicators (Screen only, hidden in print) */}
      <PageBreakIndicator containerRef={containerRef} />

      <ResumeDocument resumeData={resumeData} theme={theme} sectionOrder={sectionOrder} printable />
    </div>
  );
};

export const ResumePreview = memo(ResumePreviewComponent);
