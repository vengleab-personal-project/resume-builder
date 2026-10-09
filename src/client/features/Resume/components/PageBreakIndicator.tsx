"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { AlertTriangle } from 'lucide-react';
import { printablePageHeightPx } from '@/shared/config/resume-layout';

export type PageBreakIndicatorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Where printed pages end, in the preview's own (unscaled) CSS px. Each sheet loses
 * its `@page` margins - the first only at the bottom - so a page holds less than the
 * 297mm sheet; marking every 1122px drew page 2 starting ~45px later than the PDF did.
 */
const pageEnds = (contentHeight: number): number[] => {
  const ends: number[] = [];
  let end = 0;
  do {
    end += printablePageHeightPx(ends.length);
    ends.push(end);
  } while (end < contentHeight);
  return ends;
};

/** Breaks that land this close to the end of the content are worth a "nearly fits" nudge. */
const NEARLY_FITS_PX = 180;

export const PageBreakIndicator = ({ containerRef }: PageBreakIndicatorProps) => {
  const { t } = useTranslations('density');
  const [boundaries, setBoundaries] = useState<number[]>([]);
  const [hasOverflowWarning, setHasOverflowWarning] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      const container = containerRef.current;
      if (!container) return;

      // Measure where the content ends, not the box: the template has an A4-tall
      // `min-height` that would otherwise count as content. Rects include the zoom
      // transform, so divide it back out.
      const box = container.getBoundingClientRect();
      const scale = container.offsetHeight ? box.height / container.offsetHeight : 1;
      const blocks = container.querySelectorAll('header, section');
      const contentHeight = Array.from(blocks).reduce(
        (max, el) => Math.max(max, (el.getBoundingClientRect().bottom - box.top) / (scale || 1)),
        0
      );

      const ends = pageEnds(contentHeight);
      setBoundaries(ends.slice(0, -1));

      // Spilling onto page 2 by only a little: suggest a denser setting.
      const overflowPx = contentHeight - (ends[0] ?? 0);
      setHasOverflowWarning(ends.length === 2 && overflowPx > 0 && overflowPx < NEARLY_FITS_PX);
    };

    checkHeight();
    // Content can grow inside the A4 min-height without resizing the box, so watch
    // edits as well as size. Batched to one measure per frame.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(checkHeight);
    };
    const resizeObserver = new ResizeObserver(schedule);
    const mutationObserver = new MutationObserver(schedule);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      mutationObserver.observe(containerRef.current, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef]);

  if (!boundaries.length && !hasOverflowWarning) return null;

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none print:hidden z-30">
      {boundaries.map((topPx, idx) => (
        <div
          key={idx}
          className="absolute inset-x-0 flex items-center justify-between"
          style={{ top: `${topPx}px` }}
        >
          {/* Left Dashed Line */}
          <div className="flex-1 border-b-2 border-dashed border-rose-400/80 shadow-xs" />

          {/* Center Badge */}
          <div className="px-3 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-full border border-rose-300 shadow-sm flex items-center gap-1.5 mx-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{t.pageBreak.replace('{page}', String(idx + 1))} (A4)</span>
          </div>

          {/* Right Dashed Line */}
          <div className="flex-1 border-b-2 border-dashed border-rose-400/80 shadow-xs" />
        </div>
      ))}

      {hasOverflowWarning && (
        <div className="fixed bottom-6 right-8 bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-amber-400 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <AlertTriangle size={15} className="text-slate-950 flex-shrink-0" />
          <span>{t.pageBreakWarning}</span>
        </div>
      )}
    </div>
  );
};
