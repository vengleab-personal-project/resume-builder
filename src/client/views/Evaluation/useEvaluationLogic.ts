"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { useLocaleStore } from '@/client/store/locale-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import { handleInsufficientCoins, useCoinStore } from '@/client/store/coin-store';
import { useEvaluationHistory } from './useEvaluationHistory';

export type InputMode = 'text' | 'pdf';

export interface EvaluationScore {
  roleMatch: number;
  skillsMatch: number;
  experienceQuality: number;
  achievementsImpact: number;
  careerStability: number;
  communicationQuality: number;
  educationCertifications: number;
  total: number;
}

export interface EvaluationMetric {
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  analysis: string;
  status: 'strong' | 'good' | 'moderate' | 'weak';
}

export interface DetailedPrompt {
  question: string;
  result: string;
  verdict: 'verified' | 'limited' | 'missing';
}

export interface EvaluationResult {
  candidateName: string;
  candidateTitle: string;
  overallScore: number;
  recommendation: 'Highly Recommended' | 'Recommended' | 'Consider' | 'Not Recommended';
  action: string;
  metrics: EvaluationMetric[];
  prompts: DetailedPrompt[];
  strengths?: string[];
  gaps?: string[];
  interviewQuestions?: string[];
  evaluatedAt: string;
}

const JD_STORAGE_KEY = 'cv-builder-job-description';

export function useEvaluationLogic() {
  const { resumeData, aiConfig, remoteResumeId } = useResumeStore();
  const { locale } = useLocaleStore();
  const { t } = useTranslations('evaluation');
  const { t: tCoins } = useTranslations('coins');
  const applyResponseHeaders = useCoinStore((state) => state.applyResponseHeaders);
  const history = useEvaluationHistory();
  // Destructured because both are stable identities; depending on the whole
  // `history` object would rebuild the callbacks below on every render.
  const { refresh: refreshHistory, fetchEntry: fetchHistoryEntry } = history;
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [jobDescription, setJobDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [hasPersistedJD, setHasPersistedJD] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted JD from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(JD_STORAGE_KEY);
    if (stored) {
      setJobDescription(stored);
      setHasPersistedJD(true);
    }
  }, []);

  const persistJobDescription = useCallback((jd: string) => {
    localStorage.setItem(JD_STORAGE_KEY, jd);
    setHasPersistedJD(true);
  }, []);

  const clearPersistedJD = useCallback(() => {
    localStorage.removeItem(JD_STORAGE_KEY);
    setJobDescription('');
    setPdfFile(null);
    setHasPersistedJD(false);
    setResult(null);
    setError(null);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      setPdfFile(file);
      localStorage.setItem(JD_STORAGE_KEY, `[PDF] ${file.name}`);
      setHasPersistedJD(true);
      setError(null);
    }
  }, []);

  const handleEvaluate = useCallback(async () => {
    if (inputMode === 'text' && !jobDescription.trim()) return;
    if (inputMode === 'pdf' && !pdfFile) return;

    setIsEvaluating(true);
    setError(null);

    if (inputMode === 'text') {
      persistJobDescription(jobDescription);
    }

    try {
      const formData = new FormData();
      formData.append('resumeData', JSON.stringify(resumeData));
      formData.append('locale', locale);
      formData.append('provider', aiConfig.provider);
      formData.append('model', aiConfig.model);
      // Links the stored EvaluationResult to the resume it scored, so history
      // survives the resume being edited afterwards.
      if (remoteResumeId) formData.append('resumeId', remoteResumeId);

      if (inputMode === 'pdf' && pdfFile) {
        formData.append('file', pdfFile);
        formData.append('jobDescription', '');
      } else {
        formData.append('jobDescription', jobDescription);
      }

      const res = await fetch('/api/evaluate-resume', {
        method: 'POST',
        body: formData,
      });

      // 402 is not a generic failure: the request was well formed and the user
      // simply cannot pay for it. Open the top-up modal instead of surfacing it
      // as "evaluation failed".
      if (await handleInsufficientCoins(res)) {
        setError(tCoins.insufficient);
        return;
      }

      if (res.status === 401) {
        setError(tCoins.signInRequired);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Evaluation failed');
      }

      applyResponseHeaders(res);

      const evaluation: EvaluationResult = await res.json();
      setResult(evaluation);
      // The server has just written this run to EvaluationResult, so the
      // history list is stale until it is re-read.
      refreshHistory();
    } catch (err: unknown) {
      // Deliberately no client-side heuristic fallback here. It duplicated the
      // server's buildHeuristicEvaluation and produced a result that looked
      // real but was never persisted, so a failure now surfaces as a failure.
      console.error('Evaluation failed:', err);
      setError(t.evaluationFailed);
    } finally {
      setIsEvaluating(false);
    }
  }, [inputMode, pdfFile, jobDescription, resumeData, locale, aiConfig, remoteResumeId, persistJobDescription, refreshHistory, t, tCoins, applyResponseHeaders]);

  const canEvaluate = inputMode === 'text' ? jobDescription.trim().length > 20 : pdfFile !== null;

  const openHistoryEntry = useCallback(
    async (id: string) => {
      const entry = await fetchHistoryEntry(id);
      if (!entry) {
        setError(t.history.failed);
        return;
      }
      setResult(entry.result as EvaluationResult);
      setError(null);
    },
    [fetchHistoryEntry, t]
  );

  return {
    history,
    openHistoryEntry,
    inputMode,
    setInputMode,
    jobDescription,
    setJobDescription,
    pdfFile,
    setPdfFile,
    fileInputRef,
    handleFileChange,
    isEvaluating,
    error,
    result,
    setResult,
    hasPersistedJD,
    clearPersistedJD,
    handleEvaluate,
    canEvaluate,
    resumeData,
  };
}
