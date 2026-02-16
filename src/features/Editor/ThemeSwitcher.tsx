
import React from 'react';
import { useResumeStore } from '@/store/resume-store';
import { THEME_COLORS, THEME_FONTS } from '@/config/constants';
import { useTranslations } from '@/hooks/useTranslations';


export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useResumeStore();
  const { t } = useTranslations('editor');

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Color Column */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
          {t('theme.accentColor')}
        </label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setTheme({ primaryColor: c.value })}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${theme.primaryColor === c.value ? 'border-slate-800 ring-2 ring-slate-200' : 'border-transparent'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          {/* Custom Color Picker */}
          <div 
            className="relative w-8 h-8 overflow-hidden rounded-full border-2 border-slate-200 transition-transform hover:scale-110"
            style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }}
          >
            <input 
              type="color" 
              className="absolute -top-1 -left-1 w-10 h-10 p-0 border-0 cursor-pointer opacity-0"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value })}
              title={t('theme.customColor')}
            />
          </div>
        </div>
      </div>

      {/* Font Column */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
          {t('theme.typography')}
        </label>
        <div className="flex gap-2">
          {THEME_FONTS.map((f) => (
            <button
              key={f.name}
              onClick={() => setTheme({ fontFamily: f.value })}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${theme.fontFamily === f.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
