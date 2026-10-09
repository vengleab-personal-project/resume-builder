"use client";

import React from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { THEME_COLORS, THEME_FONTS, THEME_DENSITIES } from '@/shared/config/constants';
import { useTranslations } from '@/client/hooks/useTranslations';
import { TemplatePicker } from '@/client/features/Resume/components/TemplatePicker';
import type { ResumeTemplateId, ResumeDensity } from '@/shared/types';
import { Palette, Type, Sliders } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useResumeStore();
  const { t } = useTranslations('editor');
  const { t: tDensity } = useTranslations('density');

  const isCustomColor = !THEME_COLORS.some(c => c.value === theme.primaryColor);

  return (
    <div className="space-y-6">
      
      {/* 1. Template Catalog Picker */}
      <TemplatePicker
        selectedTemplate={theme.templateId || 'modern'}
        onSelectTemplate={(templateId: ResumeTemplateId) => setTheme({ templateId })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
        
        {/* 2. Color Palette */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={14} className="text-indigo-600" />
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t.theme.accentColor}
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {THEME_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setTheme({ primaryColor: c.value, backgroundColor: c.bg || theme.backgroundColor })}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 relative ${
                  theme.primaryColor === c.value ? 'border-slate-800 ring-2 ring-slate-300' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}

            {/* Custom Color Picker */}
            <div
              className={`relative w-8 h-8 overflow-hidden rounded-full border-2 transition-transform hover:scale-110 ${
                isCustomColor ? 'border-slate-800 ring-2 ring-slate-300' : 'border-slate-200'
              }`}
              style={
                isCustomColor
                  ? { backgroundColor: theme.primaryColor }
                  : { background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }
              }
              title={t.theme.customColor}
            >
              <input
                type="color"
                className="absolute -top-1 -left-1 w-10 h-10 p-0 border-0 cursor-pointer opacity-0"
                value={theme.primaryColor}
                onChange={(e) => setTheme({ primaryColor: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 3. Typography Pairings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type size={14} className="text-indigo-600" />
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t.theme.typography}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {THEME_FONTS.map((f) => (
              <button
                key={f.name}
                onClick={() => setTheme({ fontFamily: f.value })}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all text-left truncate ${
                  theme.fontFamily === f.value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Spacing Density */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sliders size={14} className="text-indigo-600" />
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {tDensity.title}
            </label>
          </div>

          <div className="flex gap-2">
            {THEME_DENSITIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setTheme({ density: d.id as ResumeDensity })}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                  (theme.density || 'standard') === d.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
                title={d.label}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
