"use client";

import React from 'react';
import type { ResumeData, ThemeConfig, ResumeDensity } from '@/shared/types';
import { useTranslations } from '@/client/hooks/useTranslations';

export interface ResumeTemplateProps {
  resumeData: ResumeData;
  theme: ThemeConfig;
  sectionOrder: string[];
  density?: ResumeDensity;
}

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

export const CompactTemplate: React.FC<ResumeTemplateProps> = ({
  resumeData,
  theme,
  sectionOrder,
  density = 'compact',
}) => {
  const { t } = useTranslations('editor');
  const {
    personalInfo,
    education = [],
    experience = [],
    skills = [],
    certifications = [],
    publications = [],
    summary,
    volunteering = [],
    languages = [],
    otherTraining = [],
    references = [],
  } = resumeData;

  const densitySpacing = {
    compact: 'p-6 space-y-3.5 text-xs leading-snug',
    standard: 'p-8 space-y-5 text-xs leading-normal',
    spacious: 'p-10 space-y-6 text-sm leading-relaxed',
  }[density];

  const sectionHeaderClass = "text-xs font-black uppercase tracking-wider flex items-center gap-2 mb-2 pb-1 border-b";

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!summary) return null;
        return (
          <section key="summary" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.profile}
            </h2>
            <p className="text-slate-700 text-xs">{summary}</p>
          </section>
        );

      case 'experience':
        if (!hasData(experience)) return null;
        return (
          <section key="experience">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.experience}
            </h2>
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className={`space-y-1 ${exp.breakPage ? 'print:break-after-page' : ''}`}
                >
                  <div className="flex justify-between items-baseline flex-wrap gap-1" data-print-keep>
                    <div>
                      <span className="font-bold text-slate-900">{exp.role}</span>
                      {exp.company && <span className="font-semibold text-slate-700"> @ {exp.company}</span>}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {exp.dates} {exp.location && `• ${exp.location}`}
                    </span>
                  </div>
                  {exp.description && (
                    <div
                      className="text-slate-700 text-xs prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-0.5"
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'skills':
        if (!hasData(skills)) return null;
        return (
          <section key="skills" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );

      case 'education':
        if (!hasData(education)) return null;
        return (
          <section key="education" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.education}
            </h2>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex justify-between items-baseline flex-wrap gap-1">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    {edu.school && <span className="text-slate-600">, {edu.school}</span>}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'certifications':
        if (!hasData(certifications)) return null;
        return (
          <section key="certifications" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.certifications}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {certifications.map((c, idx) => (
                <div key={c.id || idx} className="flex justify-between text-[11px]">
                  <span className="font-medium text-slate-800 truncate">{c.name}</span>
                  <span className="text-slate-500 shrink-0 ml-2">{c.year || c.expireDate}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'publications':
        if (!hasData(publications)) return null;
        return (
          <section key="publications" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.publications}
            </h2>
            <div className="space-y-1 text-xs">
              {publications.map((pub, idx) => (
                <div key={pub.id || idx} className="flex justify-between">
                  <span className="font-medium text-slate-800">{pub.title}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{pub.date}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'languages':
        if (!hasData(languages)) return null;
        return (
          <section key="languages" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.languages}
            </h2>
            <div className="flex flex-wrap gap-3 text-xs">
              {languages.map((l, idx) => (
                <span key={idx} className="text-slate-700">
                  <strong className="font-semibold">{l.name}:</strong> {l.proficiency}
                </span>
              ))}
            </div>
          </section>
        );

      case 'volunteering':
        if (!hasData(volunteering)) return null;
        return (
          <section key="volunteering" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.volunteering}
            </h2>
            <div className="space-y-1 text-xs">
              {volunteering.map((v, idx) => (
                <div key={v.id || idx} className="flex justify-between">
                  <span className="font-medium">{v.role} ({v.organization})</span>
                  <span className="text-slate-500 text-[11px]">{v.topic}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'otherTraining':
        if (!hasData(otherTraining)) return null;
        return (
          <section key="otherTraining" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.otherTraining}
            </h2>
            <div className="space-y-0.5 text-xs text-slate-700">
              {otherTraining.map((tr, idx) => (
                <div key={tr.id || idx}>• {tr.name}</div>
              ))}
            </div>
          </section>
        );

      case 'references':
        if (!hasData(references)) return null;
        return (
          <section key="references" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.references}
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {references.map((r, idx) => (
                <div key={r.id || idx} className="p-1.5 bg-slate-50 rounded border border-slate-200">
                  <p className="font-bold text-slate-900">{r.name}</p>
                  <p className="text-slate-600 text-[11px]">{r.title} • {r.company}</p>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto"
      id="resume-preview"
      style={{ fontFamily: theme.fontFamily }}
    >
      <div className={`w-full max-w-4xl mx-auto ${densitySpacing}`}>
        
        {/* Compact Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b-2 break-inside-avoid" style={{ borderColor: theme.primaryColor }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.primaryColor }}>
              {personalInfo?.name || t.preview.yourName}
            </h1>
            {personalInfo?.title && (
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-0.5">
                {personalInfo.title}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-slate-600 sm:text-right">
            {personalInfo?.email && <span>{personalInfo.email}</span>}
            {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo?.address && <span>• {personalInfo.address}</span>}
            {personalInfo?.linkedin && <span>• {personalInfo.linkedin}</span>}
          </div>
        </header>

        {/* Stacked Sections */}
        <div className="space-y-4">
          {sectionOrder.map(renderSection)}
        </div>

      </div>
    </div>
  );
};
