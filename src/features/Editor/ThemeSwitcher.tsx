
import React from 'react';
import { useResumeStore } from '@/store/resume-store';
import { THEME_COLORS, THEME_FONTS } from '@/config/constants';
import { useTranslations } from '@/hooks/useTranslations';


export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useResumeStore();
  const { t } = useTranslations('editor');

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 mb-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('theme.options')}</h3>
      
      <div className="mb-4">
        <label className="text-xs text-slate-500 mb-2 block font-medium">{t('theme.accentColor')}</label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setTheme({ primaryColor: c.value, backgroundColor: c.value })}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${theme.primaryColor === c.value ? 'border-slate-800 ring-2 ring-slate-200' : 'border-transparent'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          {/* Custom Color Picker */}
          <div className="relative w-8 h-8 overflow-hidden rounded-full border-2 border-slate-200">
            <input 
              type="color" 
              className="absolute -top-1 -left-1 w-10 h-10 p-0 border-0 cursor-pointer"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value, backgroundColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-2 block font-medium">{t('theme.typography')}</label>
        <div className="flex gap-2">
          {THEME_FONTS.map((f) => (
            <button
              key={f.name}
              onClick={() => setTheme({ fontFamily: f.value })}
              className={`px-3 py-1 text-xs rounded border ${theme.fontFamily === f.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
