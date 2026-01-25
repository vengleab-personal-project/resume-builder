export interface Education {
  degree: string;
  school: string;
  year: string;
  location?: string;
}

export interface Experience {
  role: string;
  company: string;
  dates: string;
  location?: string;
  bullets: string[];
}

export interface Publication {
  title: string;
  link?: string;
  date?: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    photoUrl?: string; // Optional
    linkedin?: string;
    website?: string;
  };
  summary: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  certifications: string[];
  publications: Publication[];
}

export type AIProvider = 'openai' | 'google';
export type AIModel = 'gpt-4o' | 'gpt-3.5-turbo' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-3-pro-preview' | 'gemini-3-flash-preview';

export interface AIConfig {
  provider: AIProvider;
  model: AIModel;
}

export interface ThemeConfig {
  primaryColor: string; // Hex or Tailwind class
  fontFamily: string;
  backgroundColor: string; // For Sidebar
}

