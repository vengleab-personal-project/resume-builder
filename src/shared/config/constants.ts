import type { AiActionKey, AiProviderKey } from '@/shared/types';

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GOOGLE: 'google',
} as const;

// Seed data and offline fallback — NOT the source of truth. The ChatModel table
// is, and src/server/ai/registry reads it. These values are only used to seed an
// empty database and to keep AI features working when Postgres is unreachable.
export const FALLBACK_CHAT_MODELS: readonly {
  provider: AiProviderKey;
  modelId: string;
  displayName: string;
  isDefault: boolean;
  sortOrder: number;
}[] = [
  {
    provider: 'GOOGLE',
    modelId: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash (Fast & Smart)',
    isDefault: true,
    sortOrder: 0,
  },
  {
    provider: 'GOOGLE',
    modelId: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash (Fast & Smart)',
    isDefault: false,
    sortOrder: 1,
  },
  {
    provider: 'GOOGLE',
    modelId: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro (Advanced)',
    isDefault: false,
    sortOrder: 2,
  },
];

// Inherited (model-agnostic) coin cost per action, used to seed the ActionCost
// rows whose chatModelId is NULL and as the last-resort value when the registry
// cannot be read at all.
export const FALLBACK_ACTION_COSTS: Readonly<Record<AiActionKey, number>> = {
  PARSE_RESUME: 1,
  REFINE_RESUME: 1,
  EVALUATE_RESUME: 2,
  // One whole interview: up to 30 turns of speech-to-text, extraction and
  // spoken output, charged once at session start. Materially more expensive to
  // serve than the single-shot actions above, priced to stay affordable to the
  // entry-level job seeker the basic CV exists for.
  VOICE_INTERVIEW: 5,
};

export const DEFAULT_ACTION_COIN_COST = 1;

// --- Voice interview -------------------------------------------------------

// Speech-to-text and text-to-speech model ids live here as constants rather
// than as admin-editable ChatModel rows, unlike every other model this app
// uses. That is a deliberate, bounded exception: the registry resolves exactly
// one model per action and cannot express a three-model pipeline, and making
// these editable would let an admin point TTS at a model that returns no audio
// and break the product with nothing to validate it. The env overrides below
// keep a model rename a config change rather than a deploy.
export const VOICE_MODEL_IDS = {
  // Audio in, text out. Any current flash model handles this.
  STT: 'gemini-3.8-flash',
  // Audio OUT, which is the capability the legacy SDK cannot reach at all and
  // the reason @google/genai is installed alongside it.
  TTS: 'gemini-2.5-flash-preview-tts',
} as const;

// Every one of these is enforced server-side, before any model call. Client-side
// equivalents are UX; these are the cost control. A single VOICE_INTERVIEW debit
// covers a whole session, so the session has to be bounded or the charge is
// unbounded.
export const VOICE_INTERVIEW_LIMITS = {
  // 15 questions plus at most one follow-up each.
  MAX_TURNS: 30,
  MAX_AUDIO_SECONDS: 60,
  MAX_AUDIO_BYTES: 5 * 1024 * 1024,
  SESSION_TTL_SECONDS: 30 * 60,
} as const;

export const VOICE_AUDIO = {
  // MediaRecorder gives webm/opus on Chrome and Firefox and mp4 on Safari, so
  // both are accepted and the type is read off the blob, never assumed.
  ACCEPTED_MIME_PREFIXES: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'],
  // What Gemini TTS actually returns: raw headerless PCM, which no browser will
  // play. gemini-voice.ts wraps it before it leaves the server.
  TTS_SAMPLE_RATE: 24000,
  TTS_BITS_PER_SAMPLE: 16,
  TTS_CHANNELS: 1,
  // A warm, neutral prebuilt voice. Gemini's voice list is not locale-specific;
  // the spoken language follows the text it is given.
  TTS_VOICE: 'Kore',
} as const;

export const GEMINI_MODEL_IDS = {
  FLASH_PREVIEW_3_8: 'gemini-3.8-flash',
  FLASH_PREVIEW: 'gemini-3-flash-preview',
  PRO_PREVIEW: 'gemini-3-pro-preview',
} as const;

export const DEFAULT_AI_CONFIG = {
  PROVIDER: AI_PROVIDERS.GOOGLE,
  MODEL: GEMINI_MODEL_IDS.FLASH_PREVIEW_3_8,
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
  model: GEMINI_MODEL_IDS.FLASH_PREVIEW_3_8,
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
