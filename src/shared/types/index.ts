export enum ViewMode {
  EDITOR = 'editor',
  PREVIEW = 'preview',
}

export type SupportedLocale = 'en' | 'km';

export interface Education {
  id?: string;
  degree: string;
  school: string;
  year: string;
  location?: string;
  description?: string;
  breakPage?: boolean;
}

export interface Experience {
  id?: string;
  role: string;
  company: string;
  dates: string;
  location?: string;
  description: string;
  breakPage?: boolean;
}

export interface Publication {
  id?: string;
  title: string;
  link?: string;
  date?: string;
  breakPage?: boolean;
}

export interface Volunteering {
  id?: string;
  role: string;
  organization: string;
  topic?: string;
  breakPage?: boolean;
}

export interface Language {
  id?: string;
  name: string;
  proficiency: string;
}

export interface Training {
  id?: string;
  name: string;
  breakPage?: boolean;
}

export interface Reference {
  id?: string;
  name: string;
  title: string;
  company: string;
  phone?: string;
  email?: string;
}

export interface Certification {
  id?: string;
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

// Deliberately a bare string, not a closed union: the set of offered models is
// admin-editable data in the ChatModel table now, so any union here would be
// stale the moment an admin adds a model. The DB allow-list check in
// src/server/ai/registry is what keeps an arbitrary id out of a provider SDK.
export type AIModel = string;

export interface AIConfig {
  provider: AIProvider;
  model: AIModel;
}

// Wire shape of GET /api/chat-models. `provider` is the lowercase wire value,
// not the uppercase DB enum.
export interface ChatModelOption {
  id: string;
  provider: AIProvider;
  modelId: string;
  displayName: string;
  isDefault: boolean;
  sortOrder: number;
}

export type AiActionKey = 'PARSE_RESUME' | 'REFINE_RESUME' | 'EVALUATE_RESUME';
export type AiProviderKey = 'GOOGLE' | 'OPENAI';

export interface ThemeConfig {
  primaryColor: string; // Hex or Tailwind class
  fontFamily: string;
  backgroundColor: string; // For Sidebar
}
