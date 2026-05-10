"use client";

import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { EvaluationResult } from './useEvaluationLogic';

interface EvaluationResultPanelProps {
  result: EvaluationResult;
  onReevaluate: () => void;
}

const STATUS_COLORS = {
  strong: 'bg-emerald-500',
  good: 'bg-indigo-500',
  moderate: 'bg-amber-500',
  weak: 'bg-red-400',
} as const;

const STATUS_TRACK_COLORS = {
  strong: 'bg-emerald-100',
  good: 'bg-indigo-100',
  moderate: 'bg-amber-100',
  weak: 'bg-red-100',
} as const;

const RECOMMENDATION_STYLES: Record<EvaluationResult['recommendation'], string> = {
  'Highly Recommended': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Recommended': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  'Consider': 'bg-amber-100 text-amber-800 border border-amber-200',
  'Not Recommended': 'bg-red-100 text-red-800 border border-red-200',
};

const VERDICT_ICONS = {
  verified: <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />,
  limited: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />,
  missing: <XCircle size={14} className="text-red-400 flex-shrink-0" />,
} as const;

const VERDICT_BADGE_STYLES = {
  verified: 'bg-emerald-50 text-emerald-700',
  limited: 'bg-amber-50 text-amber-700',
  missing: 'bg-red-50 text-red-700',
} as const;

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : score >= 45 ? '#f59e0b' : '#f87171';

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

export function EvaluationResultPanel({ result, onReevaluate }: EvaluationResultPanelProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <ScoreRing score={result.overallScore} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RECOMMENDATION_STYLES[result.recommendation]}`}>
                {result.recommendation}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 truncate">{result.candidateName}</h3>
            <p className="text-sm text-slate-500">{result.candidateTitle}</p>
            <div className="mt-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-500" />
              <span className="text-sm font-medium text-slate-700">
                Recommended action:{' '}
                <span className="text-indigo-600">{result.action}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Metrics & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Evaluation Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Evaluation Breakdown
          </h4>
          <div className="flex flex-col gap-5">
            {result.metrics.map(metric => {
              const pct = (metric.score / metric.maxScore) * 100;
              return (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-800">{metric.label}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {metric.score}
                      <span className="text-slate-400 font-normal">/{metric.maxScore}</span>
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full ${STATUS_TRACK_COLORS[metric.status]}`}>
                    <div
                      className={`h-full rounded-full ${STATUS_COLORS[metric.status]} transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-600">AI Analysis: </span>
                    {metric.analysis}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Radar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h4 className="text-sm font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Technical Proficiency
          </h4>
          <div className="flex-1 w-full min-h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.metrics.map(m => ({ label: m.label, scorePct: (m.score / m.maxScore) * 100 }))}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="scorePct"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="#eff6ff"
                  fillOpacity={0.8}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed prompts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
          Detailed Evaluation Checks
        </h4>
        <p className="text-xs text-slate-400 mb-4">AI verification against job requirements</p>
        <div className="flex flex-col divide-y divide-slate-100">
          {result.prompts.map((prompt, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-2 mb-1">
                {VERDICT_ICONS[prompt.verdict]}
                <p className="text-xs font-medium text-slate-700 leading-snug">{prompt.question}</p>
                <span className={`ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${VERDICT_BADGE_STYLES[prompt.verdict]}`}>
                  {prompt.verdict}
                </span>
              </div>
              <p className="text-xs text-slate-500 ml-5 leading-relaxed">{prompt.result}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3">
        <button
          id="btn-reevaluate"
          onClick={onReevaluate}
          className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          Edit Job Description
        </button>
        <button
          id="btn-copy-result"
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2))}
          className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all"
        >
          Copy Report
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Evaluated {new Date(result.evaluatedAt).toLocaleString()}
      </p>
    </div>
  );
}
