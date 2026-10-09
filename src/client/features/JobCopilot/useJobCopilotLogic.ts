"use client";

import { useState, useCallback, useEffect } from 'react';
import { useResumeStore, type ServerResumeSnapshot } from '@/client/store/resume-store';
import { useLocaleStore } from '@/client/store/locale-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import { handleInsufficientCoins, useCoinStore } from '@/client/store/coin-store';
import type { EvaluationResult } from '@/client/views/Evaluation/useEvaluationLogic';
import type { ResumeDTO } from '@/shared/types/persistence';

const JD_STORAGE_KEY = 'cv-builder-job-description';

function snapshotFromDTO(dto: ResumeDTO): ServerResumeSnapshot {
  return {
    id: dto.id,
    version: dto.version,
    title: dto.title,
    data: dto.data,
    sectionOrder: dto.sectionOrder,
    theme: dto.theme,
    updatedAt: dto.updatedAt,
  };
}

export function useJobCopilotLogic() {
  const { resumeData, setResumeData, aiConfig, remoteResumeId, title, sectionOrder, theme, applyServerSnapshot } = useResumeStore();
  const { locale } = useLocaleStore();
  const { t } = useTranslations('jobCopilot');
  const { t: tCoins } = useTranslations('coins');
  const applyResponseHeaders = useCoinStore((state) => state.applyResponseHeaders);

  const [jobDescription, setJobDescription] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);

  // Load persisted JD from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(JD_STORAGE_KEY);
    if (stored && !stored.startsWith('[PDF]')) {
      setJobDescription(stored);
    }
  }, []);

  // Analyze keywords when evaluation result arrives
  useEffect(() => {
    if (!result) return;

    // Extract skills gap from result gaps or JD text
    const currentSkills = (resumeData.skills || []).map((s) => s.toLowerCase());
    
    // Parse keywords from JD and evaluate match
    const jdWords = jobDescription
      .replace(/[^\w\s\+\#\.\-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const commonSkillsCatalog = [
      'React', 'React.js', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python',
      'Java', 'Go', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'SQL', 'PostgreSQL',
      'MongoDB', 'GraphQL', 'REST APIs', 'CI/CD', 'Git', 'Agile', 'Scrum', 'TailwindCSS',
      'CSS3', 'HTML5', 'Redux', 'Zustand', 'Prisma', 'Microservices', 'Jest', 'Cypress',
      'TDD', 'Figma', 'UI/UX', 'System Design', 'Linux', 'Security', 'Performance Optimization'
    ];

    const foundInJd = commonSkillsCatalog.filter((skill) =>
      jobDescription.toLowerCase().includes(skill.toLowerCase())
    );

    const matched: string[] = [];
    const missing: string[] = [];

    foundInJd.forEach((skill) => {
      if (currentSkills.some((s) => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s))) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    // Also include gaps directly recommended by AI
    if (result.gaps && result.gaps.length > 0) {
      result.gaps.forEach((gap) => {
        if (gap.length < 30 && !missing.includes(gap) && !matched.includes(gap)) {
          missing.push(gap);
        }
      });
    }

    setMatchedKeywords(matched);
    setMissingKeywords(missing);
  }, [result, jobDescription, resumeData.skills]);

  const handleEvaluate = useCallback(async () => {
    if (!jobDescription.trim()) return;

    setIsEvaluating(true);
    setError(null);
    localStorage.setItem(JD_STORAGE_KEY, jobDescription);

    try {
      const formData = new FormData();
      formData.append('resumeData', JSON.stringify(resumeData));
      formData.append('locale', locale);
      formData.append('provider', aiConfig.provider);
      formData.append('model', aiConfig.model);
      if (remoteResumeId) formData.append('resumeId', remoteResumeId);
      formData.append('jobDescription', jobDescription);

      const res = await fetch('/api/evaluate-resume', {
        method: 'POST',
        body: formData,
      });

      if (await handleInsufficientCoins(res)) {
        setError(tCoins.insufficient);
        return;
      }

      if (res.status === 401) {
        setError(tCoins.signInRequired);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Evaluation failed');
      }

      applyResponseHeaders(res);
      const evalData: EvaluationResult = await res.json();
      setResult(evalData);
    } catch (err: unknown) {
      console.error('Job match evaluation error:', err);
      setError(t.placeholder);
    } finally {
      setIsEvaluating(false);
    }
  }, [jobDescription, resumeData, locale, aiConfig, remoteResumeId, applyResponseHeaders, t, tCoins]);

  const handleAddSkillToResume = useCallback(
    (skillToAdd: string) => {
      const existing = resumeData.skills || [];
      if (!existing.some((s) => s.toLowerCase() === skillToAdd.toLowerCase())) {
        setResumeData({
          ...resumeData,
          skills: [...existing, skillToAdd],
        });
      }
    },
    [resumeData, setResumeData]
  );

  const handleForkResume = useCallback(async () => {
    setIsForking(true);
    try {
      const tailoredTitle = `${title || 'Resume'} (Tailored)`.slice(0, 100);
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tailoredTitle,
          data: resumeData,
          sectionOrder,
          theme,
          isDefault: false,
        }),
      });

      if (!res.ok) throw new Error('Failed to create copy');
      const { resume } = (await res.json()) as { resume: ResumeDTO };
      applyServerSnapshot(snapshotFromDTO(resume));
    } catch (err) {
      console.error('Fork resume error:', err);
    } finally {
      setIsForking(false);
    }
  }, [title, resumeData, sectionOrder, theme, applyServerSnapshot]);

  return {
    jobDescription,
    setJobDescription,
    isEvaluating,
    isForking,
    error,
    result,
    matchedKeywords,
    missingKeywords,
    handleEvaluate,
    handleAddSkillToResume,
    handleForkResume,
  };
}
