"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useResumeStore } from '@/client/store/resume-store';

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
  evaluatedAt: string;
}

const JD_STORAGE_KEY = 'cv-builder-job-description';

function getRecommendation(score: number): EvaluationResult['recommendation'] {
  if (score >= 80) return 'Highly Recommended';
  if (score >= 65) return 'Recommended';
  if (score >= 45) return 'Consider';
  return 'Not Recommended';
}

function getAction(rec: EvaluationResult['recommendation']): string {
  switch (rec) {
    case 'Highly Recommended': return 'Move to Interview';
    case 'Recommended': return 'Schedule Screening Call';
    case 'Consider': return 'Request Portfolio / Assessment';
    default: return 'Archive Application';
  }
}

function scoreToStatus(pct: number): EvaluationMetric['status'] {
  if (pct >= 0.8) return 'strong';
  if (pct >= 0.6) return 'good';
  if (pct >= 0.4) return 'moderate';
  return 'weak';
}

function buildMockResult(resumeData: ReturnType<typeof useResumeStore.getState>['resumeData'], jd: string): EvaluationResult {
  const name = resumeData.personalInfo.name || 'Candidate';
  const title = resumeData.personalInfo.title || 'Professional';
  const skills = resumeData.skills ?? [];
  const experience = resumeData.experience ?? [];
  const education = resumeData.education ?? [];
  const certifications = resumeData.certifications ?? [];

  // Heuristic scoring — replace with real AI call later
  const roleMatchRaw = Math.min(25, 10 + Math.min(experience.length * 3, 12) + (title.length > 5 ? 3 : 0));
  const skillsMatchRaw = Math.min(20, 6 + Math.min(skills.length * 2, 14));
  const expQualityRaw = Math.min(15, 5 + Math.min(experience.length * 2, 8) + (experience.some(e => e.description.length > 100) ? 2 : 0));
  const achievementsRaw = Math.min(15, 5 + Math.min(experience.filter(e => e.description.toLowerCase().includes('%') || e.description.toLowerCase().includes('led') || e.description.toLowerCase().includes('built')).length * 3, 10));
  const stabilityRaw = Math.min(10, 4 + Math.min(experience.length * 1.5, 6));
  const commRaw = Math.min(10, 4 + (resumeData.summary.length > 100 ? 3 : 1) + (resumeData.personalInfo.linkedin ? 2 : 0));
  const eduRaw = Math.min(5, 1 + Math.min(education.length * 1.5 + certifications.length * 0.5, 4));

  const total = Math.round(roleMatchRaw + skillsMatchRaw + expQualityRaw + achievementsRaw + stabilityRaw + commRaw + eduRaw);
  const rec = getRecommendation(total);

  const metrics: EvaluationMetric[] = [
    { label: 'Role Match', score: Math.round(roleMatchRaw), maxScore: 25, weight: 25, analysis: experience.length > 0 ? `Candidate exhibits ${roleMatchRaw >= 18 ? 'strong' : 'partial'} alignment with the target role. Previous titles and responsibilities ${roleMatchRaw >= 18 ? 'mirror' : 'partially match'} the target role's expectations.` : 'No work experience listed. Cannot verify role alignment.', status: scoreToStatus(roleMatchRaw / 25) },
    { label: 'Skills Match', score: Math.round(skillsMatchRaw), maxScore: 20, weight: 20, analysis: skills.length > 0 ? `${skills.length >= 8 ? 'Strong' : skills.length >= 4 ? 'Moderate' : 'Limited'} skills coverage detected. ${skills.slice(0, 3).join(', ')} ${skills.length > 3 ? 'and others ' : ''}appear in the CV.` : 'No skills listed in the CV.', status: scoreToStatus(skillsMatchRaw / 20) },
    { label: 'Experience Quality', score: Math.round(expQualityRaw), maxScore: 15, weight: 15, analysis: experience.length > 0 ? `${experience.length} role(s) found. ${expQualityRaw >= 11 ? 'High tenure stability and progressive responsibility detected.' : 'Experience entries present but depth of impact detail could be improved.'}` : 'No work experience provided.', status: scoreToStatus(expQualityRaw / 15) },
    { label: 'Achievements & Impact', score: Math.round(achievementsRaw), maxScore: 15, weight: 15, analysis: achievementsRaw >= 10 ? 'Quantified achievements and impact indicators found. Strong evidence of measurable results.' : achievementsRaw >= 6 ? 'Some achievements mentioned but could benefit from more quantification.' : 'Limited evidence of specific impact or quantified achievements.', status: scoreToStatus(achievementsRaw / 15) },
    { label: 'Career Stability', score: Math.round(stabilityRaw), maxScore: 10, weight: 10, analysis: experience.length >= 2 ? 'Multiple roles demonstrate progressive career growth.' : experience.length === 1 ? 'Single role detected. More history would improve this score.' : 'No employment history to evaluate.', status: scoreToStatus(stabilityRaw / 10) },
    { label: 'Communication & CV Quality', score: Math.round(commRaw), maxScore: 10, weight: 10, analysis: resumeData.summary.length > 80 ? 'Professional summary is present and informative. Contact details appear complete.' : 'Summary section is brief. Expanding it would improve communication scoring.', status: scoreToStatus(commRaw / 10) },
    { label: 'Education & Certifications', score: Math.round(eduRaw), maxScore: 5, weight: 5, analysis: education.length > 0 ? `${education.length} education entr${education.length > 1 ? 'ies' : 'y'} found.${certifications.length > 0 ? ` ${certifications.length} certification(s) detected.` : ''}` : 'No education history provided.', status: scoreToStatus(eduRaw / 5) },
  ];

  const prompts: DetailedPrompt[] = [
    { question: 'Does the candidate have similar job titles in the past 5 years?', result: experience.length > 0 ? `Verified. Roles include: ${experience.slice(0, 2).map(e => `"${e.role}"`).join(' and ')}.` : 'Unable to verify — no experience listed.', verdict: experience.length > 0 ? 'verified' : 'missing' },
    { question: 'Do key skills from the job description appear in the CV?', result: skills.length > 0 ? `${skills.slice(0, 4).join(', ')} ${skills.length > 4 ? 'and more are' : 'are'} present in the skills section.` : 'No skills listed to match against job description.', verdict: skills.length >= 4 ? 'verified' : skills.length > 0 ? 'limited' : 'missing' },
    { question: 'Does the candidate demonstrate leadership or team experience?', result: experience.some(e => e.description.toLowerCase().match(/led|managed|team|mentored|directed/)) ? 'Confirmed. Leadership indicators found in experience descriptions.' : 'Limited direct evidence. No explicit leadership keywords detected.', verdict: experience.some(e => e.description.toLowerCase().match(/led|managed|team|mentored|directed/)) ? 'verified' : 'limited' },
    { question: 'Are there quantified achievements in the CV?', result: experience.some(e => e.description.match(/\d+%|\$\d+|\d+ team|\d+ engineers|\d+ projects/i)) ? 'Confirmed. Quantified results detected in experience section.' : 'Limited quantification. Consider adding measurable outcomes.', verdict: experience.some(e => e.description.match(/\d+%|\$\d+|\d+ team|\d+ engineers|\d+ projects/i)) ? 'verified' : 'limited' },
  ];

  return {
    candidateName: name,
    candidateTitle: title,
    overallScore: total,
    recommendation: rec,
    action: getAction(rec),
    metrics,
    prompts,
    evaluatedAt: new Date().toISOString(),
  };
}

export function useEvaluationLogic() {
  const { resumeData } = useResumeStore();
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [jobDescription, setJobDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
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
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      // Store file name as indicator in localStorage
      localStorage.setItem(JD_STORAGE_KEY, `[PDF] ${file.name}`);
      setHasPersistedJD(true);
    }
  }, []);

  const handleEvaluate = useCallback(async () => {
    const jdText = inputMode === 'pdf' ? (pdfFile ? `[PDF] ${pdfFile.name}` : '') : jobDescription;
    if (!jdText.trim()) return;

    setIsEvaluating(true);
    persistJobDescription(jdText);

    // Simulate async evaluation (replace with real AI call)
    await new Promise(resolve => setTimeout(resolve, 1800));

    const evaluation = buildMockResult(resumeData, jdText);
    setResult(evaluation);
    setIsEvaluating(false);
  }, [inputMode, pdfFile, jobDescription, resumeData, persistJobDescription]);

  const canEvaluate = inputMode === 'text' ? jobDescription.trim().length > 20 : pdfFile !== null;

  return {
    inputMode,
    setInputMode,
    jobDescription,
    setJobDescription,
    pdfFile,
    setPdfFile,
    fileInputRef,
    handleFileChange,
    isEvaluating,
    result,
    setResult,
    hasPersistedJD,
    clearPersistedJD,
    handleEvaluate,
    canEvaluate,
    resumeData,
  };
}
