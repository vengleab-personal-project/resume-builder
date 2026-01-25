import { create } from 'zustand';
import { ResumeData, ThemeConfig, AIConfig } from '@/types';

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

const initialResumeData: ResumeData = {
  personalInfo: {
    name: "Your Name",
    email: "email@example.com",
    phone: "(555) 555-5555",
    address: "City, State",
  },
  summary: "Professional summary goes here...",
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  publications: []
};

const initialTheme: ThemeConfig = {
  primaryColor: "slate-900", // Tailwind class literal
  backgroundColor: "slate-900",
  fontFamily: "font-sans",
};

const initialAIConfig: AIConfig = {
  provider: 'google',
  model: 'gemini-3-flash',
};

export const useResumeStore = create<ResumeState>((set) => ({
  resumeData: initialResumeData,
  theme: initialTheme,
  aiConfig: initialAIConfig,
  isParsing: false,
  setResumeData: (data) => set({ resumeData: data }),
  updateNestedResumeData: (path, value) => set((state) => {
    return { resumeData: { ...state.resumeData } }; 
  }),
  setTheme: (newTheme) => set((state) => ({ theme: { ...state.theme, ...newTheme } })),
  setAIConfig: (newConfig) => set((state) => ({ aiConfig: { ...state.aiConfig, ...newConfig } })),
  setIsParsing: (isParsing) => set({ isParsing }),
}));

