"use client";

import React from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import { THEME_DENSITIES } from '@/shared/config/constants';
import type { ResumeDensity } from '@/shared/types';
import { ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

interface DensityControlsProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  className?: string;
}

export const DensityControls: React.FC<DensityControlsProps> = ({
  zoom,
  onZoomChange,
  className = '',
}) => {
  const { theme, setTheme } = useResumeStore();
  const { t: tDensity } = useTranslations('density');

  const handleToggleFitToOnePage = () => {
    const nextFit = !theme.fitToOnePage;
    setTheme({
      fitToOnePage: nextFit,
      density: nextFit ? 'compact' : (theme.density || 'standard'),
    });
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 p-2 bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-sm text-xs ${className}`}>
      
      {/* Left: Density Presets */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 hidden sm:inline">
          {tDensity.title}:
        </span>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {THEME_DENSITIES.map((d) => {
            const isSelected = (theme.density || 'standard') === d.id && !theme.fitToOnePage;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setTheme({ density: d.id as ResumeDensity, fitToOnePage: false })}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={d.label}
              >
                {d.name}
              </button>
            );
          })}
        </div>

        {/* Auto Fit 1 Page Toggle */}
        <button
          type="button"
          onClick={handleToggleFitToOnePage}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            theme.fitToOnePage
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
          title={tDensity.fitToOnePageDesc}
        >
          <Sparkles size={12} className={theme.fitToOnePage ? 'text-indigo-600' : 'text-slate-400'} />
          <span>{tDensity.fitToOnePage}</span>
        </button>
      </div>

      {/* Right: Zoom Level Controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <span className="text-[11px] font-mono font-semibold text-slate-600 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(1.4, zoom + 0.1))}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(1.0)}
          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors ml-1 border border-slate-200"
          title="Reset Zoom to 100%"
        >
          100%
        </button>
      </div>

    </div>
  );
};
