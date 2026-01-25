
export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validate environment variables
Object.entries(ENV).forEach(([key, value]) => {
  if (!value && ENV.NODE_ENV === 'production') {
    console.warn(`Environment variable ${key} is missing!`);
  }
});
