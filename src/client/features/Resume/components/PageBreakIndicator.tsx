"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { AlertTriangle } from 'lucide-react';

interface PageBreakIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

// Standard A4 height in pixels at 96 DPI is approx 1122.5px (297mm)
const A4_PAGE_HEIGHT_PX = 1122;

export const PageBreakIndicator: React.FC<PageBreakIndicatorProps> = ({ containerRef }) => {
  const { t } = useTranslations('density');
  const [pageCount, setPageCount] = useState(1);
  const [hasOverflowWarning, setHasOverflowWarning] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      if (!containerRef.current) return;
      const height = containerRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(height / A4_PAGE_HEIGHT_PX));
      setPageCount(pages);

      // If content overflows page 1 by less than 150px, show actionable warning
      const overflowPx = height % A4_PAGE_HEIGHT_PX;
      if (pages === 2 && overflowPx > 0 && overflowPx < 180) {
        setHasOverflowWarning(true);
      } else {
        setHasOverflowWarning(false);
      }
    };

    checkHeight();
    const observer = new ResizeObserver(checkHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [containerRef]);

  if (pageCount <= 1 && !hasOverflowWarning) return null;

  const boundaries = Array.from({ length: pageCount - 1 }, (_, i) => (i + 1) * A4_PAGE_HEIGHT_PX);

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
            <span>{t.pageBreak.replace('{page}', String(idx + 1))} (A4 297mm)</span>
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
