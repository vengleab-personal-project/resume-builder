
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GOOGLE: 'google',
} as const;

export const AI_MODELS = {
  [AI_PROVIDERS.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4o (Smartest)' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 (Fast)' },
  ],
  [AI_PROVIDERS.GOOGLE]: [
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Fast & Smart)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
} as const;

export const DEFAULT_AI_CONFIG = {
  PROVIDER: AI_PROVIDERS.OPENAI,
  MODEL: 'gpt-4o',
} as const;

export const FILE_LIMITS = {
  ACCEPTED_TYPES: ['.pdf', '.docx', '.txt'],
  MAX_SIZE_MB: 10,
} as const;

export const THEME_COLORS = [
  { name: 'Slate', value: '#1e293b' },
  { name: 'Blue', value: '#1e40af' },
  { name: 'Indigo', value: '#3730a3' },
  { name: 'Emerald', value: '#064e3b' },
  { name: 'Red', value: '#991b1b' },
  { name: 'Purple', value: '#6b21a8' },
  { name: 'Black', value: '#000000' },
];

export const THEME_FONTS = [
  { name: 'Sans', value: 'font-sans' },
  { name: 'Serif', value: 'font-serif' },
  { name: 'Mono', value: 'font-mono' },
];

export const RESUME_SECTIONS = {
  INGEST: 'ingest',
  CUSTOMIZE: 'customize',
  EDIT: 'edit',
} as const;
