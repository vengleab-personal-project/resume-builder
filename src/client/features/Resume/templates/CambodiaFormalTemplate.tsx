"use client";

import React from 'react';
import type { ResumeData, ThemeConfig, ResumeDensity } from '@/shared/types';
import { useTranslations } from '@/client/hooks/useTranslations';
import { Mail, Phone, MapPin, User } from 'lucide-react';

export interface ResumeTemplateProps {
  resumeData: ResumeData;
  theme: ThemeConfig;
  sectionOrder: string[];
  density?: ResumeDensity;
}

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

export const CambodiaFormalTemplate: React.FC<ResumeTemplateProps> = ({
  resumeData,
  theme,
  sectionOrder,
  density = 'standard',
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
    compact: 'p-6 space-y-4 text-xs',
    standard: 'p-8 space-y-6 text-sm',
    spacious: 'p-10 space-y-7 text-base',
  }[density];

  const sectionHeaderClass = "text-sm font-bold uppercase tracking-wider pb-1 mb-3 border-b-2 flex items-center gap-2";

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!summary) return null;
        return (
          <section key="summary" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.profile}
            </h2>
            <p className="text-slate-800 leading-relaxed text-justify text-xs sm:text-sm">
              {summary}
            </p>
          </section>
        );

      case 'experience':
        if (!hasData(experience)) return null;
        return (
          <section key="experience">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.experience}
            </h2>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className={`space-y-1.5 ${exp.breakPage ? 'print:break-after-page' : ''}`}
                >
                  <div className="flex justify-between items-baseline flex-wrap gap-1" data-print-keep>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{exp.role}</span>
                      {exp.company && <span className="font-semibold text-slate-700"> — {exp.company}</span>}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {exp.dates} {exp.location && `(${exp.location})`}
                    </span>
                  </div>
                  {exp.description && (
                    <div
                      className="text-slate-700 text-xs leading-relaxed prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1"
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'education':
        if (!hasData(education)) return null;
        return (
          <section key="education" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.education}
            </h2>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="space-y-1">
                  <div className="flex justify-between items-baseline flex-wrap gap-1">
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{edu.degree}</span>
                      {edu.school && <span className="text-slate-700 font-medium"> — {edu.school}</span>}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{edu.year}</span>
                  </div>
                  {edu.description && (
                    <p className="text-xs text-slate-600">{edu.description}</p>
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
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.skills}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md border text-slate-800 bg-slate-50 border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );

      case 'languages':
        if (!hasData(languages)) return null;
        return (
          <section key="languages" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.languages}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {languages.map((l, idx) => (
                <div key={l.id || idx} className="p-2 rounded bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900">{l.name}</p>
                  <p className="text-slate-600 text-[11px]">{l.proficiency}</p>
                </div>
              ))}
            </div>
          </section>
        );

      case 'certifications':
        if (!hasData(certifications)) return null;
        return (
          <section key="certifications" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.certifications}
            </h2>
            <div className="space-y-2 text-xs">
              {certifications.map((c, idx) => (
                <div key={c.id || idx} className="flex justify-between">
                  <span className="font-medium text-slate-900">{c.name} {c.issuer && `(${c.issuer})`}</span>
                  <span className="text-slate-500 font-medium">{c.year || c.expireDate}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'publications':
        if (!hasData(publications)) return null;
        return (
          <section key="publications" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.publications}
            </h2>
            <div className="space-y-1.5 text-xs">
              {publications.map((p, idx) => (
                <div key={p.id || idx} className="flex justify-between">
                  <span className="font-medium text-slate-900">{p.title}</span>
                  <span className="text-slate-500">{p.date}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'volunteering':
        if (!hasData(volunteering)) return null;
        return (
          <section key="volunteering" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.volunteering}
            </h2>
            <div className="space-y-2 text-xs">
              {volunteering.map((v, idx) => (
                <div key={v.id || idx} className="flex justify-between">
                  <span className="font-medium text-slate-900">{v.role} ({v.organization})</span>
                  <span className="text-slate-500">{v.topic}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'otherTraining':
        if (!hasData(otherTraining)) return null;
        return (
          <section key="otherTraining" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.otherTraining}
            </h2>
            <div className="space-y-1 text-xs">
              {otherTraining.map((tr, idx) => (
                <div key={tr.id || idx} className="text-slate-800">• {tr.name}</div>
              ))}
            </div>
          </section>
        );

      case 'references':
        if (!hasData(references)) return null;
        return (
          <section key="references" className="break-inside-avoid">
            <h2 className={sectionHeaderClass} style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              {t.preview.references}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {references.map((r, idx) => (
                <div key={r.id || idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="font-bold text-slate-900">{r.name}</p>
                  <p className="text-slate-700 font-medium text-[11px]">{r.title} — {r.company}</p>
                  {r.phone && <p className="text-slate-500 text-[11px]">{r.phone}</p>}
                  {r.email && <p className="text-slate-500 text-[11px]">{r.email}</p>}
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
        
        {/* Cambodian Formal Header with Photo Frame */}
        <header className="flex justify-between items-start gap-6 pb-6 border-b-2 break-inside-avoid" style={{ borderColor: theme.primaryColor }}>
          
          <div className="space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {personalInfo?.name || t.preview.yourName}
            </h1>
            {personalInfo?.title && (
              <p className="text-sm font-semibold tracking-wide" style={{ color: theme.primaryColor }}>
                {personalInfo.title}
              </p>
            )}

            {/* Personal Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-xs text-slate-700">
              {personalInfo?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={13} style={{ color: theme.primaryColor }} />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={13} style={{ color: theme.primaryColor }} />
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo?.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: theme.primaryColor }} />
                  <span>{personalInfo.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo Frame */}
          <div className="w-28 h-36 rounded-md border-2 p-1 bg-white flex-shrink-0 shadow-sm" style={{ borderColor: theme.primaryColor }}>
            {personalInfo?.photoUrl ? (
              <img
                src={personalInfo.photoUrl}
                alt="Profile"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded flex flex-col items-center justify-center text-slate-400 text-xs">
                <User size={28} className="mb-1 text-slate-300" />
                <span>Photo 4x6</span>
              </div>
            )}
          </div>

        </header>

        {/* Stacked Sections */}
        <div className="space-y-5 pt-2">
          {sectionOrder.map(renderSection)}
        </div>

      </div>
    </div>
  );
};
