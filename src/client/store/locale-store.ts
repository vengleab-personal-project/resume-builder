import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SupportedLocale } from '@/shared/types';

interface LocaleState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale: SupportedLocale) => {
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
        set({ locale });
      },
    }),
    {
      name: 'resume-builder-locale',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.lang = state.locale;
        }
      },
    }
  )
);
