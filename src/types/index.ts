export enum ViewMode {
  EDITOR = 'editor',
  PREVIEW = 'preview',
}

export interface Education {
  degree: string;
  school: string;
  year: string;
  location?: string;
  description?: string;
  breakPage?: boolean;
}

export interface Experience {
  role: string;
  company: string;
  dates: string;
  location?: string;
  description: string;
  breakPage?: boolean;
}

export interface Publication {
  title: string;
  link?: string;
  date?: string;
  breakPage?: boolean;
}

export interface Volunteering {
  role: string;
  organization: string;
  topic?: string;
  breakPage?: boolean;
}

export interface Language {
  name: string;
  proficiency: string;
}

export interface Training {
  name: string;
  breakPage?: boolean;
}

export interface Reference {
  name: string;
  title: string;
  company: string;
  phone?: string;
  email?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  location?: string;
  expireDate?: string;
  year?: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    title?: string;
    email: string;
    phone: string;
    address: string;
    photoUrl?: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  certifications: Certification[];
  publications: Publication[];
  volunteering: Volunteering[];
  languages: Language[];
  otherTraining: Training[];
  references: Reference[];
}

export type AIProvider = 'openai' | 'google';
export type AIModel = 'gpt-4o' | 'gpt-3.5-turbo' | 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface AIConfig {
  provider: AIProvider;
  model: AIModel;
}

export interface ThemeConfig {
  primaryColor: string; // Hex or Tailwind class
  fontFamily: string;
  backgroundColor: string; // For Sidebar
}
