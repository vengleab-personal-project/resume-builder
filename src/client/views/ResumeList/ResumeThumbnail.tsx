"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { ResumeDocument } from '@/client/features/Resume';
import type { ResumeDTO } from '@/shared/types/persistence';

// Matches an A4 page rendered at 96dpi -- the same box ResumePreview lays
// its content into, just scaled down to card size instead of print size. The
// thumbnail draws the very same template (ResumeDocument), so it shows the layout
// the user picked rather than a copy of one of them.
const SOURCE_WIDTH = 794;
const SOURCE_HEIGHT = 1123;

interface ResumeThumbnailProps {
  resumeId: string;
}

export function ResumeThumbnail({ resumeId }: ResumeThumbnailProps) {
  const { t: tResumeList } = useTranslations('resumeList');
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [resume, setResume] = useState<ResumeDTO | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/resumes/${resumeId}`, { credentials: 'same-origin' });
        if (!res.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const body = (await res.json()) as { resume: ResumeDTO };
        if (!cancelled) setResume(body.resume);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setScale(el.clientWidth / SOURCE_WIDTH);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
      style={{ aspectRatio: `${SOURCE_WIDTH} / ${SOURCE_HEIGHT}` }}
    >
      {!resume && !failed && <div className="absolute inset-0 animate-pulse bg-slate-100" />}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 px-4 text-center">
          {tResumeList.previewUnavailable}
        </div>
      )}

      {resume && scale > 0 && <ResumeThumbnailBody resume={resume} scale={scale} />}
    </div>
  );
}

function ResumeThumbnailBody({ resume, scale }: { resume: ResumeDTO; scale: number }) {
  return (
    <div
      className="bg-white pointer-events-none"
      style={{ width: SOURCE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <ResumeDocument
        resumeData={resume.data}
        theme={resume.theme}
        sectionOrder={resume.sectionOrder}
        printable={false}
      />
    </div>
  );
}
