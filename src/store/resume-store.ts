import { create } from 'zustand';
import { ResumeData, ThemeConfig, AIConfig } from '@/types';
import { INITIAL_RESUME_DATA, INITIAL_THEME, INITIAL_AI_CONFIG } from '@/config/constants';

interface ResumeState {
  resumeData: ResumeData;
  theme: ThemeConfig;
  aiConfig: AIConfig;
  isParsing: boolean;
  setResumeData: (data: ResumeData) => void;
  updateNestedResumeData: (path: string, value: unknown) => void; // Helper for deep updates
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setAIConfig: (config: Partial<AIConfig>) => void;
  setIsParsing: (isParsing: boolean) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumeData: INITIAL_RESUME_DATA as unknown as ResumeData,
  theme: INITIAL_THEME as unknown as ThemeConfig,
  aiConfig: INITIAL_AI_CONFIG as unknown as AIConfig,
  isParsing: false,
  setResumeData: (data) => set({ resumeData: data }),
  updateNestedResumeData: (path, value) => set((state) => {
    // Note: Simple implementation for now, could be improved with lodash set
    return { resumeData: { ...state.resumeData } }; 
  }),
  setTheme: (newTheme) => set((state) => ({ theme: { ...state.theme, ...newTheme } })),
  setAIConfig: (newConfig) => set((state) => ({ aiConfig: { ...state.aiConfig, ...newConfig } })),
  setIsParsing: (isParsing) => set({ isParsing }),
}));
