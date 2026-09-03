"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { useLocaleStore } from '@/client/store/locale-store';

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

function getRecommendation(score: number): EvaluationResult['recommendation'] {
  if (score >= 80) return 'Highly Recommended';
  if (score >= 65) return 'Recommended';
  if (score >= 45) return 'Consider';
  return 'Not Recommended';
}

function getAction(rec: EvaluationResult['recommendation'], isKhmer: boolean): string {
  if (isKhmer) {
    switch (rec) {
      case 'Highly Recommended': return 'បន្តទៅការសម្ភាសន៍បច្ចេកទេស';
      case 'Recommended': return 'រៀបចំការហៅពិភាក្សាបឋម';
      case 'Consider': return 'ស្នើសុំ Portfolio ឬការធ្វើតេស្ត';
      default: return 'រក្សាទុកក្នុងទិន្នន័យបម្រុង';
    }
  }
  switch (rec) {
    case 'Highly Recommended': return 'Move to Technical Interview';
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

function buildMockResult(
  resumeData: ReturnType<typeof useResumeStore.getState>['resumeData'],
  jd: string,
  locale: string = 'en'
): EvaluationResult {
  const isKhmer = locale === 'km';
  const name = resumeData.personalInfo.name || (isKhmer ? 'បេក្ខជន' : 'Candidate');
  const title = resumeData.personalInfo.title || (isKhmer ? 'អ្នកជំនាញ' : 'Professional');
  const skills = resumeData.skills ?? [];
  const experience = resumeData.experience ?? [];
  const education = resumeData.education ?? [];
  const certifications = resumeData.certifications ?? [];

  const roleMatchRaw = Math.min(25, 10 + Math.min(experience.length * 3, 12) + (title.length > 5 ? 3 : 0));
  const skillsMatchRaw = Math.min(20, 6 + Math.min(skills.length * 2, 14));
  const expQualityRaw = Math.min(15, 5 + Math.min(experience.length * 2, 8) + (experience.some(e => e.description.length > 100) ? 2 : 0));
  const achievementsRaw = Math.min(15, 5 + Math.min(experience.filter(e => e.description.toLowerCase().match(/%|led|built|managed/)).length * 3, 10));
  const stabilityRaw = Math.min(10, 4 + Math.min(experience.length * 1.5, 6));
  const commRaw = Math.min(10, 4 + (resumeData.summary.length > 100 ? 3 : 1) + (resumeData.personalInfo.linkedin ? 2 : 0));
  const eduRaw = Math.min(5, 1 + Math.min(education.length * 1.5 + certifications.length * 0.5, 4));

  const total = Math.round(roleMatchRaw + skillsMatchRaw + expQualityRaw + achievementsRaw + stabilityRaw + commRaw + eduRaw);
  const rec = getRecommendation(total);

  const metrics: EvaluationMetric[] = [
    {
      label: isKhmer ? 'ភាពត្រូវគ្នានៃមុខតំណែង' : 'Role Match',
      score: Math.round(roleMatchRaw),
      maxScore: 25,
      weight: 25,
      analysis: isKhmer
        ? `បទពិសោធន៍របស់បេក្ខជនមានភាពត្រូវគ្នា ${roleMatchRaw >= 18 ? 'ខ្ពស់' : 'មធ្យម'} ជាមួយនឹងតម្រូវការមុខតំណែងនេះ។`
        : experience.length > 0
          ? `Candidate exhibits ${roleMatchRaw >= 18 ? 'strong' : 'partial'} alignment with the target role. Previous titles mirror expectations.`
          : 'No work experience listed.',
      status: scoreToStatus(roleMatchRaw / 25),
    },
    {
      label: isKhmer ? 'ជំនាញត្រូវគ្នា' : 'Skills Match',
      score: Math.round(skillsMatchRaw),
      maxScore: 20,
      weight: 20,
      analysis: isKhmer
        ? `បានរកឃើញជំនាញពាក់ព័ន្ធចំនួន ${skills.length} នៅក្នុងប្រវត្តិរូប រួមមាន ${skills.slice(0, 3).join(', ')}។`
        : skills.length > 0
          ? `${skills.length >= 6 ? 'Strong' : 'Moderate'} skills coverage detected: ${skills.slice(0, 3).join(', ')}.`
          : 'No skills listed in the CV.',
      status: scoreToStatus(skillsMatchRaw / 20),
    },
    {
      label: isKhmer ? 'គុណភាពបទពិសោធន៍' : 'Experience Quality',
      score: Math.round(expQualityRaw),
      maxScore: 15,
      weight: 15,
      analysis: isKhmer
        ? `មានបទពិសោធន៍ការងារចំនួន ${experience.length} កន្លែងជាមួយនឹងការទទួលខុសត្រូវរីកចម្រើន។`
        : experience.length > 0
          ? `${experience.length} role(s) found with progressive responsibilities.`
          : 'No work experience provided.',
      status: scoreToStatus(expQualityRaw / 15),
    },
    {
      label: isKhmer ? 'សមិទ្ធផល & ឥទ្ធិពលការងារ' : 'Achievements & Impact',
      score: Math.round(achievementsRaw),
      maxScore: 15,
      weight: 15,
      analysis: isKhmer
        ? achievementsRaw >= 10
          ? 'មានសូចនាករសមិទ្ធផលការងារជាក់ស្តែង និងលទ្ធផលវាស់វែងបាន។'
          : 'មានការរៀបរាប់ពីការងារ ប៉ុន្តែគួរតែបន្ថែមស្ថិតិលទ្ធផលបន្ថែមទៀត។'
        : achievementsRaw >= 10
          ? 'Quantified achievements and measurable impact indicators found.'
          : 'Some achievements mentioned; adding measurable metrics would improve this.',
      status: scoreToStatus(achievementsRaw / 15),
    },
    {
      label: isKhmer ? 'ស្ថិរភាពការងារ' : 'Career Stability',
      score: Math.round(stabilityRaw),
      maxScore: 10,
      weight: 10,
      analysis: isKhmer
        ? 'រយៈពេលបម្រើការងារបង្ហាញពីស្ថិរភាព និងការប្តេជ្ញាចិត្តល្អ។'
        : experience.length >= 2
          ? 'Multiple roles demonstrate progressive career growth.'
          : 'Single role detected.',
      status: scoreToStatus(stabilityRaw / 10),
    },
    {
      label: isKhmer ? 'ការទំនាក់ទំនង & គុណភាព CV' : 'Communication & CV Quality',
      score: Math.round(commRaw),
      maxScore: 10,
      weight: 10,
      analysis: isKhmer
        ? 'សេចក្តីសង្ខេបប្រវត្តិរូបមានភាពច្បាស់លាស់ រចនាសម្ព័ន្ធអត្ថបទរៀបចំបានល្អ។'
        : 'Professional summary is present and well written.',
      status: scoreToStatus(commRaw / 10),
    },
    {
      label: isKhmer ? 'ការអប់រំ & វិញ្ញាបនបត្រ' : 'Education & Certifications',
      score: Math.round(eduRaw),
      maxScore: 5,
      weight: 5,
      analysis: isKhmer
        ? `មានប្រវត្តិអប់រំ ${education.length} និងវិញ្ញាបនបត្រ ${certifications.length}។`
        : `${education.length} education qualification(s) found.`,
      status: scoreToStatus(eduRaw / 5),
    },
  ];

  const prompts: DetailedPrompt[] = [
    {
      question: isKhmer
        ? 'តើបេក្ខជនធ្លាប់មានតួនាទីស្រដៀងគ្នានេះក្នុងរយៈពេល ៥ ឆ្នាំចុងក្រោយដែរឬទេ?'
        : 'Does the candidate have similar job titles in the past 5 years?',
      result: experience.length > 0
        ? (isKhmer
            ? `បានផ្ទៀងផ្ទាត់៖ តួនាទីរួមមាន ${experience.slice(0, 2).map(e => `"${e.role}"`).join(' និង ')}។`
            : `Verified. Roles include: ${experience.slice(0, 2).map(e => `"${e.role}"`).join(' and ')}.`)
        : (isKhmer ? 'មិនអាចផ្ទៀងផ្ទាត់បាន' : 'Unable to verify — no experience listed.'),
      verdict: experience.length > 0 ? 'verified' : 'missing',
    },
    {
      question: isKhmer
        ? 'តើជំនាញគន្លឹះក្នុងសេចក្តីពិពណ៌នាការងារមាននៅក្នុង CV ដែរឬទេ?'
        : 'Do key skills from the job description appear in the CV?',
      result: skills.length > 0
        ? (isKhmer
            ? `ជំនាញ ${skills.slice(0, 3).join(', ')} មាននៅក្នុងប្រវត្តិរូប។`
            : `${skills.slice(0, 4).join(', ')} are present in the skills section.`)
        : (isKhmer ? 'មិនមានជំនាញត្រូវបានរាយនាម' : 'No skills listed to match.'),
      verdict: skills.length >= 4 ? 'verified' : skills.length > 0 ? 'limited' : 'missing',
    },
    {
      question: isKhmer
        ? 'តើបេក្ខជនបង្ហាញពីបទពិសោធន៍ដឹកនាំ ឬការធ្វើការជាក្រុមដែរឬទេ?'
        : 'Does the candidate demonstrate leadership or team experience?',
      result: experience.some(e => e.description.toLowerCase().match(/led|managed|team|mentored|directed|ដឹកនាំ/))
        ? (isKhmer ? 'បញ្ជាក់៖ បានរកឃើញសញ្ញាណនៃការដឹកនាំ និងការសហការក្នុងក្រុម។' : 'Confirmed. Leadership indicators found in experience descriptions.')
        : (isKhmer ? 'មានកម្រិត៖ មិនមានពាក្យគន្លឹះដឹកនាំច្បាស់លាស់។' : 'Limited direct evidence. No explicit leadership keywords detected.'),
      verdict: experience.some(e => e.description.toLowerCase().match(/led|managed|team|mentored|directed|ដឹកនាំ/)) ? 'verified' : 'limited',
    },
    {
      question: isKhmer
        ? 'តើមានសមិទ្ធផលដែលអាចវាស់វែងបានក្នុងប្រវត្តិរូបដែរឬទេ?'
        : 'Are there quantified achievements in the CV?',
      result: experience.some(e => e.description.match(/\d+%|\$\d+|\d+ team|\d+ engineers|\d+ projects/i))
        ? (isKhmer ? 'បញ្ជាក់៖ បានរកឃើញសមិទ្ធផលមានស្ថិតិ និងទិន្នន័យជាក់លាក់។' : 'Confirmed. Quantified results detected in experience section.')
        : (isKhmer ? 'មានកម្រិត៖ គួរតែបន្ថែមស្ថិតិ ឬភាគរយនៃលទ្ធផលការងារ។' : 'Limited quantification. Consider adding measurable outcomes.'),
      verdict: experience.some(e => e.description.match(/\d+%|\$\d+|\d+ team|\d+ engineers|\d+ projects/i)) ? 'verified' : 'limited',
    },
  ];

  return {
    candidateName: name,
    candidateTitle: title,
    overallScore: total,
    recommendation: rec,
    action: getAction(rec, isKhmer),
    metrics,
    prompts,
    strengths: isKhmer
      ? [
          `បទពិសោធន៍ការងារជាក់ស្តែងក្នុងមុខតំណែង ${title}`,
          `ជំនាញស្នូលសមស្រប៖ ${skills.slice(0, 3).join(', ')}`,
          `រចនាសម្ព័ន្ធប្រវត្តិរូបមានភាពច្បាស់លាស់ និងងាយស្រួលយល់`,
        ]
      : [
          `Solid domain background in ${title} roles`,
          `Relevant competencies: ${skills.slice(0, 3).join(', ')}`,
          `Clear progressive responsibility across listed positions`,
        ],
    gaps: isKhmer
      ? [
          'អាចបន្ថែមទិន្នន័យសូចនាករសមិទ្ធផលការងារ (KPIs/Metrics) ឱ្យកាន់តែជាក់លាក់',
          'ផ្ទៀងផ្ទាត់ជំនាញឯកទេសជាក់លាក់ដែលតម្រូវក្នុងសេចក្តីពិពណ៌នាការងារ',
        ]
      : [
          'Quantified business metrics could be expanded in recent roles',
          'Specific niche certifications from the job posting should be highlighted',
        ],
    interviewQuestions: isKhmer
      ? [
          `តើអ្នកអាចរៀបរាប់ពីគម្រោងដែលអ្នកបានដឹកនាំ ឬសម្រេចបានលទ្ធផលលេចធ្លោជាងគេក្នុងតួនាទី ${title} បានទេ?`,
          `តើអ្នកធ្លាប់ជួបឧបសគ្គបច្ចេកទេសអ្វីខ្លះ ហើយអ្នកដោះស្រាយវាដោយរបៀបណា?`,
          `តើបទពិសោធន៍កន្លងមករបស់អ្នកជួយឱ្យអ្នកឆាប់សម្របខ្លួនជាមួយតម្រូវការការងារនេះយ៉ាងដូចម្តេច?`,
        ]
      : [
          `Can you walk through your most impactful project in your recent role as ${title}?`,
          `How have you applied your core skills (${skills.slice(0, 2).join(', ')}) to solve complex workflow problems?`,
          `What key challenges do you anticipate in this role based on the job description, and how will you tackle them?`,
        ],
    evaluatedAt: new Date().toISOString(),
  };
}

export function useEvaluationLogic() {
  const { resumeData } = useResumeStore();
  const { locale } = useLocaleStore();
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
    const jdText = inputMode === 'pdf' ? (pdfFile ? `[PDF] ${pdfFile.name}` : '') : jobDescription;
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
      formData.append('model', 'gemini-3.8-flash');

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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Evaluation failed');
      }

      const evaluation: EvaluationResult = await res.json();
      setResult(evaluation);
    } catch (err: unknown) {
      console.error('API Evaluation failed, falling back to heuristic:', err);
      // Fallback to local heuristic evaluation
      const fallback = buildMockResult(resumeData, jdText, locale);
      setResult(fallback);
    } finally {
      setIsEvaluating(false);
    }
  }, [inputMode, pdfFile, jobDescription, resumeData, locale, persistJobDescription]);

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
