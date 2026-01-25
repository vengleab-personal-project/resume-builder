import { AIConfig, ResumeData } from '@/types';

export const parseResume = async (file: File, config: AIConfig): Promise<ResumeData> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("provider", config.provider);
  formData.append("model", config.model);

  const res = await fetch("/api/parse-resume", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
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
