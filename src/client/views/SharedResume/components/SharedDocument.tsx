"use client";

import { useRef } from 'react';
import { ResumeDocument } from '@/client/features/Resume';
import { usePrintPagination } from '@/client/features/Resume/usePrintPagination';
import { usePreviewScale } from '@/client/hooks/usePreviewScale';
import type { SharedResumeContent } from '@/shared/types/persistence';

export type SharedDocumentProps = {
  content: SharedResumeContent;
};

/**
 * The shared CV on its A4 canvas: laid out at the true print width and scaled to fit,
 * exactly like the builder's preview, and paginated by the same `usePrintPagination`,
 * so the viewer's PDF breaks pages where the owner's does. It mounts only once content
 * has arrived, because both hooks measure the elements their refs point at.
 *
 * The print classes mirror CvBuilder's canvas: every wrapper must stop clipping and
 * drop its transform in print (see the print contract in CLAUDE.md).
 */
export const SharedDocument = ({ content }: SharedDocumentProps) => {
  const { viewportRef, canvasRef, zoom, frame } = usePreviewScale();
  const containerRef = useRef<HTMLDivElement>(null);
  usePrintPagination(containerRef);

  return (
    <div
      ref={viewportRef}
      className="flex-1 p-4 sm:p-8 overflow-auto flex justify-center-safe items-start print:block print:p-0 print:overflow-visible"
    >
      <div
        className="relative shrink-0 print:static print:w-auto! print:h-auto!"
        style={{ width: frame.width, height: frame.height }}
      >
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 origin-top-left w-[210mm] min-h-[297mm] shadow-2xl bg-white flex print:static print:w-full print:min-h-0 print:shadow-none print:transform-none!"
          style={{ transform: `scale(${zoom})` }}
        >
          <div ref={containerRef} className="relative w-full min-h-[1122px] print:min-h-0">
            <ResumeDocument
              resumeData={content.data}
              theme={content.theme}
              sectionOrder={content.sectionOrder}
              locale={content.locale}
              printable
            />
          </div>
        </div>
      </div>
    </div>
  );
};
