
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GOOGLE: 'google',
} as const;

export const AI_MODELS = {
  [AI_PROVIDERS.OPENAI]: [
    // { id: 'gpt-4o', name: 'GPT-4o (Smartest)' },
    // { id: 'gpt-3.5-turbo', name: 'GPT-3.5 (Fast)' },
  ],
  [AI_PROVIDERS.GOOGLE]: [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast & Smart)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Advanced)' },
  ],
} as const;

export const GEMINI_MODEL_IDS = {
  FLASH_PREVIEW: 'gemini-3-flash-preview',
  PRO_PREVIEW: 'gemini-3-pro-preview',
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
  { name: 'Sans', value: 'var(--font-sans)' },
  { name: 'Serif', value: 'var(--font-serif)' },
  { name: 'Mono', value: 'var(--font-mono)' },
];

export const RESUME_SECTIONS = {
  INGEST: 'ingest',
  CUSTOMIZE: 'customize',
  EDIT: 'edit',
} as const;

export const INITIAL_RESUME_DATA = {
  personalInfo: {
    name: "Your Name",
    title: "Your Title",
    email: "email@example.com",
    phone: "(555) 555-5555",
    address: "City, State",
  },
  summary: "",
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  publications: [],
  volunteering: [],
  languages: [],
  otherTraining: [],
  references: [],
} as const;

export const INITIAL_SECTION_ORDER = ['summary', 'experience', 'education', 'skills', 'certifications', 'publications', 'volunteering', 'languages', 'otherTraining', 'references'];

export const INITIAL_THEME = {
  primaryColor: "#1e40af", // Blue
  backgroundColor: "#f3f4f6", // Light Gray for Sidebar
  fontFamily: "var(--font-sans)",
} as const;

export const INITIAL_AI_CONFIG = {
  provider: AI_PROVIDERS.GOOGLE,
  model: GEMINI_MODEL_IDS.FLASH_PREVIEW,
} as const;

// PDF Export Configuration
export const PDF_EXPORT_CONFIG = {
  CANVAS_SCALE: 2,
  ORIENTATION: 'portrait' as const,
  UNIT: 'mm' as const,
  FORMAT: 'a4' as const,
  A4_WIDTH_MM: 210,
  IMAGE_FORMAT: 'PNG' as const,
  IMAGE_MIME_TYPE: 'image/png' as const,
} as const;

// File Parsing Configuration
export const FILE_PARSING = {
  SUPPORTED_MIME_TYPES: {
    PDF: 'application/pdf',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    TXT: 'text/plain',
  },
  ENCODING: 'utf-8' as const,
} as const;

// AI Configuration
export const AI_CONFIG = {
  TEMPERATURE_PARSING: 0,
  TEMPERATURE_REFINEMENT: 0.7,
  RESPONSE_FORMAT_JSON: 'json_object' as const,
  RESPONSE_FORMAT_TEXT: 'text' as const,
  MAX_TOKENS_DEFAULT: 10_000,
  MAX_OUTPUT_TOKENS: 10_000,
} as const;

// API Error Messages (internal)
export const API_ERROR_MESSAGES = {
  NO_FILE_UPLOADED: 'No file uploaded',
  UNSUPPORTED_FILE_FORMAT: 'Unsupported file format',
  PDF_PARSING_NOT_SUPPORTED: 'PDF parsing is not supported on this server environment',
  GEMINI_API_KEY_NOT_SET: 'GEMINI_API_KEY is not set',
  OPENAI_API_KEY_NOT_SET: 'OPENAI_API_KEY is not set',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  NO_CONTENT_FROM_AI: 'No content from AI',
  GEMINI_FAILED: 'Gemini failed',
  FAILED_TO_PARSE_OPENAI: 'Failed to parse with OpenAI',
  FAILED_TO_PARSE_GEMINI: 'Failed to parse with Gemini',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Editor Configuration
export const EDITOR_CONFIG = {
  DRAG_ACTIVATION_DISTANCE: 8,
  ICON_SIZE_SMALL: 12,
  ICON_SIZE_MEDIUM: 14,
  ICON_SIZE_LARGE: 16,
  ICON_SIZE_XL: 20,
  MIN_HEIGHT_SUMMARY: '120px',
  MIN_HEIGHT_BULLETS: '150px',
  MIN_HEIGHT_DESCRIPTION: '60px',
  MIN_HEIGHT_SKILLS: '100px',
  MIN_HEIGHT_TRAINING: '80px',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  REFINE_RESUME: '/api/refine-resume',
  PARSE_RESUME: '/api/parse-resume',
} as const;

// Request Timeouts (in milliseconds)
export const REQUEST_TIMEOUTS = {
  PARSE_RESUME: 60_000, // 60 seconds for AI parsing
  REFINE_CONTENT: 30_000, // 30 seconds for refinement
} as const;
