import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/server/services/parsingService';
import { getGeminiModel } from '@/server/integrations/gemini';
import { ENV } from '@/shared/config/env';
import { HTTP_STATUS } from '@/shared/config/constants';
import type { ResumeData } from '@/shared/types';

interface EvaluationMetric {
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  analysis: string;
  status: 'strong' | 'good' | 'moderate' | 'weak';
}

interface DetailedPrompt {
  question: string;
  result: string;
  verdict: 'verified' | 'limited' | 'missing';
}

interface EvaluationResponse {
  candidateName: string;
  candidateTitle: string;
  overallScore: number;
  recommendation: 'Highly Recommended' | 'Recommended' | 'Consider' | 'Not Recommended';
  action: string;
  metrics: EvaluationMetric[];
  prompts: DetailedPrompt[];
  strengths: string[];
  gaps: string[];
  interviewQuestions: string[];
  evaluatedAt: string;
}

function scoreToStatus(pct: number): EvaluationMetric['status'] {
  if (pct >= 0.8) return 'strong';
  if (pct >= 0.6) return 'good';
  if (pct >= 0.4) return 'moderate';
  return 'weak';
}

function getRecommendation(score: number): EvaluationResponse['recommendation'] {
  if (score >= 80) return 'Highly Recommended';
  if (score >= 65) return 'Recommended';
  if (score >= 45) return 'Consider';
  return 'Not Recommended';
}

function getAction(rec: EvaluationResponse['recommendation'], isKhmer: boolean): string {
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

function buildHeuristicEvaluation(
  resume: ResumeData,
  jd: string,
  isKhmer: boolean
): EvaluationResponse {
  const name = resume.personalInfo?.name || (isKhmer ? 'បេក្ខជន' : 'Candidate');
  const title = resume.personalInfo?.title || (isKhmer ? 'អ្នកជំនាញ' : 'Professional');
  const skills = resume.skills ?? [];
  const experience = resume.experience ?? [];
  const education = resume.education ?? [];
  const certifications = resume.certifications ?? [];

  const roleMatchRaw = Math.min(25, 10 + Math.min(experience.length * 3, 12) + (title.length > 5 ? 3 : 0));
  const skillsMatchRaw = Math.min(20, 6 + Math.min(skills.length * 2, 14));
  const expQualityRaw = Math.min(15, 5 + Math.min(experience.length * 2, 8) + (experience.some(e => (e.description || '').length > 100) ? 2 : 0));
  const achievementsRaw = Math.min(15, 5 + Math.min(experience.filter(e => (e.description || '').toLowerCase().match(/%|led|built|managed|increased/)).length * 3, 10));
  const stabilityRaw = Math.min(10, 4 + Math.min(experience.length * 1.5, 6));
  const commRaw = Math.min(10, 4 + ((resume.summary || '').length > 100 ? 3 : 1) + (resume.personalInfo?.linkedin ? 2 : 0));
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
        : `Candidate exhibits ${roleMatchRaw >= 18 ? 'strong' : 'partial'} alignment with target role expectations.`,
      status: scoreToStatus(roleMatchRaw / 25),
    },
    {
      label: isKhmer ? 'ជំនាញត្រូវគ្នា' : 'Skills Match',
      score: Math.round(skillsMatchRaw),
      maxScore: 20,
      weight: 20,
      analysis: isKhmer
        ? `បានរកឃើញជំនាញពាក់ព័ន្ធចំនួន ${skills.length} នៅក្នុងប្រវត្តិរូប រួមមាន ${skills.slice(0, 3).join(', ')}។`
        : `Detected ${skills.length} relevant skill(s) including ${skills.slice(0, 3).join(', ')}.`,
      status: scoreToStatus(skillsMatchRaw / 20),
    },
    {
      label: isKhmer ? 'គុណភាពបទពិសោធន៍' : 'Experience Quality',
      score: Math.round(expQualityRaw),
      maxScore: 15,
      weight: 15,
      analysis: isKhmer
        ? `មានបទពិសោធន៍ការងារចំនួន ${experience.length} កន្លែងជាមួយនឹងការទទួលខុសត្រូវរីកចម្រើនជាលំដាប់។`
        : `${experience.length} career role(s) found demonstrating progressive responsibility.`,
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
          : 'មានការរៀបរាប់ពីការងារ ប៉ុន្តែគួរតែបន្ថែមស្ថិតិ ឬទិន្នន័យជាក់លាក់បន្ថែមទៀត។'
        : achievementsRaw >= 10
          ? 'Quantified achievements and measurable business impact indicators detected.'
          : 'Some achievements mentioned; adding measurable metrics would strengthen this.',
      status: scoreToStatus(achievementsRaw / 15),
    },
    {
      label: isKhmer ? 'ស្ថិរភាពការងារ' : 'Career Stability',
      score: Math.round(stabilityRaw),
      maxScore: 10,
      weight: 10,
      analysis: isKhmer
        ? `រយៈពេលបម្រើការងារបង្ហាញពីស្ថិរភាព និងការប្តេជ្ញាចិត្តល្អ។`
        : 'Career trajectory shows reasonable role stability and retention.',
      status: scoreToStatus(stabilityRaw / 10),
    },
    {
      label: isKhmer ? 'ការទំនាក់ទំនង & គុណភាព CV' : 'Communication & CV Quality',
      score: Math.round(commRaw),
      maxScore: 10,
      weight: 10,
      analysis: isKhmer
        ? 'សេចក្តីសង្ខេបប្រវត្តិរូបមានភាពច្បាស់លាស់ រចនាសម្ព័ន្ធអត្ថបទរៀបចំបានល្អ។'
        : 'Professional summary is well structured with clear contact details.',
      status: scoreToStatus(commRaw / 10),
    },
    {
      label: isKhmer ? 'ការអប់រំ & វិញ្ញាបនបត្រ' : 'Education & Certifications',
      score: Math.round(eduRaw),
      maxScore: 5,
      weight: 5,
      analysis: isKhmer
        ? `មានប្រវត្តិអប់រំចំនួន ${education.length} និងវិញ្ញាបនបត្រចំនួន ${certifications.length}។`
        : `${education.length} education qualification(s) and ${certifications.length} certification(s) found.`,
      status: scoreToStatus(eduRaw / 5),
    },
  ];

  const prompts: DetailedPrompt[] = [
    {
      question: isKhmer
        ? 'តើបេក្ខជនធ្លាប់មានតួនាទីស្រដៀងគ្នានេះក្នុងរយៈពេល ៥ ឆ្នាំចុងក្រោយដែរឬទេ?'
        : 'Does candidate have similar job titles in the past 5 years?',
      result: experience.length > 0
        ? (isKhmer
            ? `បានផ្ទៀងផ្ទាត់៖ តួនាទីរួមមាន ${experience.slice(0, 2).map(e => `"${e.role}"`).join(' និង ')}។`
            : `Verified. Roles include: ${experience.slice(0, 2).map(e => `"${e.role}"`).join(' and ')}.`)
        : (isKhmer ? 'មិនអាចផ្ទៀងផ្ទាត់បាន — មិនមានបទពិសោធន៍' : 'Unable to verify — no experience listed.'),
      verdict: experience.length > 0 ? 'verified' : 'missing',
    },
    {
      question: isKhmer
        ? 'តើជំនាញគន្លឹះក្នុងសេចក្តីពិពណ៌នាការងារមាននៅក្នុង CV ដែរឬទេ?'
        : 'Do key skills from the job description appear in the CV?',
      result: skills.length > 0
        ? (isKhmer
            ? `ជំនាញ ${skills.slice(0, 3).join(', ')} និងជំនាញផ្សេងទៀតមានក្នុងប្រវត្តិរូប។`
            : `${skills.slice(0, 3).join(', ')} and other skills are present in the CV.`)
        : (isKhmer ? 'មិនមានជំនាញត្រូវបានរាយនាម' : 'No skills listed in CV.'),
      verdict: skills.length >= 4 ? 'verified' : skills.length > 0 ? 'limited' : 'missing',
    },
    {
      question: isKhmer
        ? 'តើបេក្ខជនបង្ហាញពីបទពិសោធន៍ដឹកនាំ ឬការធ្វើការជាក្រុមដែរឬទេ?'
        : 'Does candidate demonstrate leadership or team collaboration?',
      result: experience.some(e => (e.description || '').toLowerCase().match(/led|managed|team|mentored|ដឹកនាំ|ក្រុម/))
        ? (isKhmer ? 'បញ្ជាក់៖ បានរកឃើញសញ្ញាណនៃការដឹកនាំ និងការសហការក្នុងក្រុម។' : 'Confirmed. Leadership indicators detected in experience.')
        : (isKhmer ? 'មានកម្រិត៖ មិនមានពាក្យគន្លឹះដឹកនាំច្បាស់លាស់។' : 'Limited evidence. No explicit leadership keywords detected.'),
      verdict: experience.some(e => (e.description || '').toLowerCase().match(/led|managed|team|mentored|ដឹកនាំ|ក្រុម/)) ? 'verified' : 'limited',
    },
    {
      question: isKhmer
        ? 'តើមានសមិទ្ធផលដែលអាចវាស់វែងបានក្នុងប្រវត្តិរូបដែរឬទេ?'
        : 'Are there quantified achievements documented in the CV?',
      result: experience.some(e => (e.description || '').match(/\d+%|\$\d+|\d+ team|\d+ projects|\d+%/))
        ? (isKhmer ? 'បញ្ជាក់៖ បានរកឃើញសមិទ្ធផលមានស្ថិតិ និងទិន្នន័យវាស់វែងបាន។' : 'Confirmed. Quantified results detected in experience section.')
        : (isKhmer ? 'កម្រិតទាប៖ គួរតែបន្ថែមស្ថិតិ ឬភាគរយនៃលទ្ធផលការងារ។' : 'Limited quantification. Consider adding measurable outcomes.'),
      verdict: experience.some(e => (e.description || '').match(/\d+%|\$\d+|\d+ team|\d+ projects|\d+%/)) ? 'verified' : 'limited',
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
          `បទពិសោធន៍ការងាររឹងមាំក្នុងតួនាទី ${title}`,
          `ជំនាញបច្ចេកទេស និងវិជ្ជាជីវៈសមស្រប (${skills.slice(0, 3).join(', ')})`,
          `សមត្ថភាពរៀបចំ និងរចនាសម្ព័ន្ធប្រវត្តិរូបវិជ្ជាជីវៈ`,
        ]
      : [
          `Solid domain background in ${title} roles`,
          `Relevant competencies: ${skills.slice(0, 3).join(', ')}`,
          `Clear career progression across documented positions`,
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

export async function POST(req: NextRequest) {
  try {
    let resumeData: ResumeData | null = null;
    let jobDescription = '';
    let locale = 'en';
    let modelId = 'gemini-3.8-flash';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const resumeRaw = formData.get('resumeData') as string;
      if (resumeRaw) {
        try {
          resumeData = JSON.parse(resumeRaw);
        } catch {
          // ignore
        }
      }

      jobDescription = (formData.get('jobDescription') as string) || '';
      locale = (formData.get('locale') as string) || 'en';
      modelId = (formData.get('model') as string) || 'gemini-3.8-flash';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const extractedText = await extractTextFromFile(buffer, file.type);
        if (extractedText.trim()) {
          jobDescription = extractedText;
        }
      }
    } else {
      const body = await req.json();
      resumeData = body.resumeData;
      jobDescription = body.jobDescription || '';
      locale = body.locale || 'en';
      modelId = body.model || 'gemini-3.8-flash';
    }

    if (!resumeData) {
      return NextResponse.json({ error: 'Missing resume data' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    if (!jobDescription.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const isKhmer = locale === 'km';

    // If Gemini key is available, run real Gemini 3.8 Flash evaluation
    if (ENV.GEMINI_API_KEY) {
      try {
        const gemini = getGeminiModel(modelId);

        const prompt = `You are a Senior Talent Acquisition Executive & Technical Hiring Evaluator.
Analyze the candidate's Resume against the Target Job Description with high accuracy, objectivity, and actionable hiring intelligence.

TARGET JOB DESCRIPTION:
"""
${jobDescription.slice(0, 8000)}
"""

CANDIDATE RESUME:
"""
Name: ${resumeData.personalInfo?.name || 'N/A'}
Title: ${resumeData.personalInfo?.title || 'N/A'}
Summary: ${resumeData.summary || 'N/A'}
Skills: ${(resumeData.skills || []).join(', ')}
Experience: ${JSON.stringify(resumeData.experience || [])}
Education: ${JSON.stringify(resumeData.education || [])}
Certifications: ${JSON.stringify(resumeData.certifications || [])}
"""

LANGUAGE REQUIREMENT:
${isKhmer ? 'CRITICAL: Output all metric labels, analysis, action, prompt questions and results, strengths, gaps, and interviewQuestions in natural, formal Cambodian KHMER language (ភាសាខ្មែរ).' : 'Output all analysis in English.'}

Provide a comprehensive evaluation in strictly valid JSON matching this schema:
{
  "candidateName": "${resumeData.personalInfo?.name || 'Candidate'}",
  "candidateTitle": "${resumeData.personalInfo?.title || 'Professional'}",
  "overallScore": <integer 0-100>,
  "recommendation": <"Highly Recommended" | "Recommended" | "Consider" | "Not Recommended">,
  "action": <string describing recommended next step>,
  "metrics": [
    {
      "label": <string, e.g. "Role Match" / "ភាពត្រូវគ្នានៃមុខតំណែង">,
      "score": <number, max 25>,
      "maxScore": 25,
      "weight": 25,
      "analysis": <string, 2-3 sentences specific to candidate and JD>,
      "status": <"strong" | "good" | "moderate" | "weak">
    },
    {
      "label": <string, e.g. "Skills Match" / "ជំនាញត្រូវគ្នា">,
      "score": <number, max 20>,
      "maxScore": 20,
      "weight": 20,
      "analysis": <string>,
      "status": <"strong" | "good" | "moderate" | "weak">
    },
    {
      "label": <string, e.g. "Experience Quality" / "គុណភាពបទពិសោធន៍">,
      "score": <number, max 15>,
      "maxScore": 15,
      "weight": 15,
      "analysis": <string>,
      "status": <"strong" | "good" | "moderate" | "weak">
    },
    {
      "label": <string, e.g. "Achievements & Impact" / "សមិទ្ធផល & ឥទ្ធិពលការងារ">,
      "score": <number, max 15>,
      "maxScore": 15,
      "weight": 15,
      "analysis": <string>,
      "status": <"strong" | "good" | "moderate" | "weak">
    },
    {
      "label": <string, e.g. "Career Stability" / "ស្ថិរភាពការងារ">,
      "score": <number, max 10>,
      "maxScore": 10,
      "weight": 10,
      "analysis": <string>,
      "status": <"strong" | "good" | "moderate" | "weak">
    },
    {
      "label": <string, e.g. "Communication & CV Quality" / "ការទំនាក់ទំនង & គុណភាព CV">,
      "score": <number, max 10>,
      "maxScore": 10,
      "weight": 10,
      "analysis": <string>,
      "status": <"strong" | "good" | "moderate" | "weak">
    },
    {
      "label": <string, e.g. "Education & Certifications" / "ការអប់រំ & វិញ្ញាបនបត្រ">,
      "score": <number, max 5>,
      "maxScore": 5,
      "weight": 5,
      "analysis": <string>,
      "status": <"strong" | "good" | "moderate" | "weak">
    }
  ],
  "prompts": [
    {
      "question": <string verification question>,
      "result": <string specific evidence from CV>,
      "verdict": <"verified" | "limited" | "missing">
    }
  ],
  "strengths": [<string>, <string>, <string>],
  "gaps": [<string>, <string>],
  "interviewQuestions": [<string>, <string>, <string>]
}`;

        const result = await gemini.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        return NextResponse.json({
          ...parsed,
          evaluatedAt: new Date().toISOString(),
        });
      } catch (geminiError) {
        console.error('Gemini Evaluation failed, falling back to heuristic:', geminiError);
        // Fallback to heuristic evaluation on AI error
        const fallback = buildHeuristicEvaluation(resumeData, jobDescription, isKhmer);
        return NextResponse.json(fallback);
      }
    }

    // Heuristic fallback if no API key
    const fallbackResult = buildHeuristicEvaluation(resumeData, jobDescription, isKhmer);
    return NextResponse.json(fallbackResult);
  } catch (err: unknown) {
    console.error('Evaluate API Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error during evaluation' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
