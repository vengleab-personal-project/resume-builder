"use client";

import React, { memo, useRef } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { TEMPLATE_COMPONENTS } from './templates';
import { PageBreakIndicator } from './components/PageBreakIndicator';

const ResumePreviewComponent = () => {
  const { resumeData, theme, sectionOrder } = useResumeStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const templateId = theme.templateId || 'modern';
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId] || TEMPLATE_COMPONENTS.modern;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[1122px]">
      {/* Visual Page Boundary Indicators (Screen only, hidden in print) */}
      <PageBreakIndicator containerRef={containerRef} />

      {/* Selected Template Component */}
      <TemplateComponent
        resumeData={resumeData}
        theme={theme}
        sectionOrder={sectionOrder}
        density={theme.density || 'standard'}
      />
    </div>
  );
};

export const ResumePreview = memo(ResumePreviewComponent);
