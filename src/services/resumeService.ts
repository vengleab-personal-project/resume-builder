import { AIConfig, ResumeData } from '@/types';
import { REQUEST_TIMEOUTS, API_ENDPOINTS } from '@/config/constants';

export const parseResume = async (
  input: File | string, 
  config: AIConfig,
  abortSignal?: AbortSignal
): Promise<ResumeData> => {
  const formData = new FormData();
  
  if (typeof input === 'string') {
    formData.append("text", input);
  } else {
    formData.append("file", input);
  }
  
  formData.append("provider", config.provider);
  formData.append("model", config.model);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUTS.PARSE_RESUME);

  // Link external abort signal if provided
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(API_ENDPOINTS.PARSE_RESUME, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to parse resume');
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out or was cancelled. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const refineResumeField = async (
  field: string, 
  content: string, 
  suggestion: string,
  config: AIConfig
): Promise<{ refinedContent: string }> => {
  const response = await fetch('/api/refine-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, content, suggestion, config }),
  });

  if (!response.ok) {
    throw new Error('Failed to refine content');
  }

  return response.json();
};
