"use client";

import { useTranslations } from '@/client/hooks/useTranslations';
import { AlertTriangle } from 'lucide-react';
import type { PaginatedFlow } from '../pagination';

export type PageBreakIndicatorProps = {
  /** Where print will end each page, per column (see `usePrintPagination`). */
  flows: PaginatedFlow[];
  /** The last page holds only a little: suggest a denser setting. */
  nearlyFits: boolean;
};

/**
 * Draws where printed pages end. The positions are the breaks print is forced to take,
 * so a marker is exactly where the PDF starts its next page. In a two-column layout
 * each column breaks on its own; the badge rides on the widest one.
 */
export const PageBreakIndicator = ({ flows, nearlyFits }: PageBreakIndicatorProps) => {
  const { t } = useTranslations('density');
  const widest = flows.reduce<PaginatedFlow | null>((best, flow) => (!best || flow.width > best.width ? flow : best), null);
  const markers = flows.flatMap((flow) =>
    flow.breaks.map((brk) => ({ ...brk, left: flow.left, width: flow.width, badge: flow === widest }))
  );

  if (!markers.length && !nearlyFits) return null;

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none print:hidden z-30">
      {markers.map((marker) => (
        <div
          key={`${marker.left}-${marker.page}`}
          className="absolute flex items-center justify-between"
          style={{ top: `${marker.y}px`, left: `${marker.left}px`, width: `${marker.width}px` }}
        >
          {/* Left Dashed Line */}
          <div className="flex-1 border-b-2 border-dashed border-rose-400/80 shadow-xs" />

          {/* Center Badge */}
          {marker.badge && (
            <div className="px-3 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-full border border-rose-300 shadow-sm flex items-center gap-1.5 mx-2 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{t.pageBreak.replace('{page}', String(marker.page))} (A4)</span>
            </div>
          )}

          {/* Right Dashed Line */}
          {marker.badge && <div className="flex-1 border-b-2 border-dashed border-rose-400/80 shadow-xs" />}
        </div>
      ))}

      {nearlyFits && (
        <div className="fixed bottom-6 right-8 bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-amber-400 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <AlertTriangle size={15} className="text-slate-950 flex-shrink-0" />
          <span>{t.pageBreakWarning}</span>
        </div>
      )}
    </div>
  );
};
