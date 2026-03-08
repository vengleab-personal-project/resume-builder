import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResumeData, ThemeConfig, AIConfig, ViewMode } from '@/shared/types';
import { INITIAL_RESUME_DATA, INITIAL_THEME, INITIAL_AI_CONFIG, INITIAL_SECTION_ORDER } from '@/shared/config/constants';

interface ResumeState {
  resumeData: ResumeData;
  sectionOrder: string[];
  theme: ThemeConfig;
  aiConfig: AIConfig;
  isParsing: boolean;
  viewMode: ViewMode;
  setResumeData: (data: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
  setSectionOrder: (order: string[] | ((prev: string[]) => string[])) => void;
  updateNestedResumeData: (path: string, value: unknown) => void; // Helper for deep updates
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setAIConfig: (config: Partial<AIConfig>) => void;
  setIsParsing: (isParsing: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  resetData: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumeData: INITIAL_RESUME_DATA as unknown as ResumeData,
      sectionOrder: INITIAL_SECTION_ORDER as unknown as string[],
      theme: INITIAL_THEME as unknown as ThemeConfig,
      aiConfig: INITIAL_AI_CONFIG as unknown as AIConfig,
      isParsing: false,
      viewMode: ViewMode.EDITOR,
      setResumeData: (data) => set((state) => ({ 
        resumeData: typeof data === 'function' ? data(state.resumeData) : data 
      })),
      setSectionOrder: (order) => set((state) => ({ 
        sectionOrder: typeof order === 'function' ? order(state.sectionOrder) : order 
      })),
      updateNestedResumeData: (path, value) => set((state) => {
        // Note: Simple implementation for now, could be improved with lodash set
        return { resumeData: { ...state.resumeData } }; 
      }),
      setTheme: (newTheme) => set((state) => ({ theme: { ...state.theme, ...newTheme } })),
      setAIConfig: (newConfig) => set((state) => ({ aiConfig: { ...state.aiConfig, ...newConfig } })),
      setIsParsing: (isParsing) => set({ isParsing }),
      setViewMode: (mode) => set({ viewMode: mode }),
      resetData: () => set({ 
        resumeData: INITIAL_RESUME_DATA as unknown as ResumeData,
        sectionOrder: INITIAL_SECTION_ORDER as unknown as string[],
        theme: INITIAL_THEME as unknown as ThemeConfig,
      }),
    }),
    {
      name: 'resume-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        resumeData: state.resumeData, 
        sectionOrder: state.sectionOrder,
        theme: state.theme,
        aiConfig: state.aiConfig 
      }),
    }
  )
);
