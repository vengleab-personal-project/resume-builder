"use client";

import React from 'react';
import type { ResumeData, ThemeConfig, ResumeDensity } from '@/shared/types';
import { useTranslations } from '@/client/hooks/useTranslations';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export interface ResumeTemplateProps {
  resumeData: ResumeData;
  theme: ThemeConfig;
  sectionOrder: string[];
  density?: ResumeDensity;
}

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

export const ExecutiveAtsTemplate: React.FC<ResumeTemplateProps> = ({
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
    compact: 'p-8 space-y-4 text-xs',
    standard: 'p-10 space-y-6 text-sm',
    spacious: 'p-12 space-y-8 text-base',
  }[density];

  const sectionHeadingClass = "text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 pb-1 mb-3";

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!summary) return null;
        return (
          <section key="summary" className="break-inside-avoid">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.profile}
            </h2>
            <p className="text-slate-700 leading-relaxed text-justify">
              {summary}
            </p>
          </section>
        );

      case 'experience':
        if (!hasData(experience)) return null;
        return (
          <section key="experience">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
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
                      <span className="font-bold text-slate-900">{exp.role}</span>
                      {exp.company && <span className="text-slate-600 font-medium"> — {exp.company}</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {exp.dates} {exp.location && `| ${exp.location}`}
                    </div>
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
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.education}
            </h2>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="space-y-1">
                  <div className="flex justify-between items-baseline flex-wrap gap-1">
                    <div>
                      <span className="font-bold text-slate-900">{edu.degree}</span>
                      {edu.school && <span className="text-slate-600 font-medium">, {edu.school}</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {edu.year} {edu.location && `| ${edu.location}`}
                    </div>
                  </div>
                  {edu.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{edu.description}</p>
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
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.skills}
            </h2>
            <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-xs text-slate-700">
              {skills.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center">
                  <span className="font-medium">{skill}</span>
                  {idx < skills.length - 1 && <span className="text-slate-300 ml-2">•</span>}
                </span>
              ))}
            </div>
          </section>
        );

      case 'certifications':
        if (!hasData(certifications)) return null;
        return (
          <section key="certifications" className="break-inside-avoid">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.certifications}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {certifications.map((cert, idx) => (
                <div key={cert.id || idx} className="flex justify-between">
                  <span className="font-semibold text-slate-800">{cert.name}</span>
                  <span className="text-slate-500">{cert.year || cert.expireDate}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'publications':
        if (!hasData(publications)) return null;
        return (
          <section key="publications" className="break-inside-avoid">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.publications}
            </h2>
            <div className="space-y-2 text-xs">
              {publications.map((pub, idx) => (
                <div key={pub.id || idx} className="flex justify-between items-baseline gap-2">
                  <span className="font-medium text-slate-800">{pub.title}</span>
                  {pub.date && <span className="text-slate-500 flex-shrink-0">{pub.date}</span>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'languages':
        if (!hasData(languages)) return null;
        return (
          <section key="languages" className="break-inside-avoid">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.languages}
            </h2>
            <div className="flex flex-wrap gap-4 text-xs">
              {languages.map((lang, idx) => (
                <div key={lang.id || idx} className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{lang.name}:</span>
                  <span className="text-slate-600">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'volunteering':
        if (!hasData(volunteering)) return null;
        return (
          <section key="volunteering" className="break-inside-avoid">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.volunteering}
            </h2>
            <div className="space-y-2 text-xs">
              {volunteering.map((vol, idx) => (
                <div key={vol.id || idx} className="flex justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{vol.role}</span>
                    {vol.organization && <span className="text-slate-600"> — {vol.organization}</span>}
                  </div>
                  {vol.topic && <span className="text-slate-500">{vol.topic}</span>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'otherTraining':
        if (!hasData(otherTraining)) return null;
        return (
          <section key="otherTraining" className="break-inside-avoid">
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.otherTraining}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-700">
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
            <h2 className={sectionHeadingClass} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              {t.preview.references}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {references.map((ref, idx) => (
                <div key={ref.id || idx} className="space-y-0.5">
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  <p className="text-slate-600">{ref.title} — {ref.company}</p>
                  {ref.email && <p className="text-slate-500">{ref.email}</p>}
                  {ref.phone && <p className="text-slate-500">{ref.phone}</p>}
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
        
        {/* Executive Header */}
        <header className="text-center border-b pb-5 break-inside-avoid" style={{ borderColor: theme.primaryColor }}>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1"
            style={{ color: theme.primaryColor }}
          >
            {personalInfo?.name || t.preview.yourName}
          </h1>
          {personalInfo?.title && (
            <p className="text-base font-semibold text-slate-700 tracking-wide mb-3 uppercase">
              {personalInfo.title}
            </p>
          )}

          {/* Contact Strip */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            {personalInfo?.email && (
              <span className="flex items-center gap-1">
                <Mail size={12} style={{ color: theme.primaryColor }} />
                {personalInfo.email}
              </span>
            )}
            {personalInfo?.phone && (
              <span className="flex items-center gap-1">
                <Phone size={12} style={{ color: theme.primaryColor }} />
                {personalInfo.phone}
              </span>
            )}
            {personalInfo?.address && (
              <span className="flex items-center gap-1">
                <MapPin size={12} style={{ color: theme.primaryColor }} />
                {personalInfo.address}
              </span>
            )}
            {personalInfo?.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin size={12} style={{ color: theme.primaryColor }} />
                {personalInfo.linkedin}
              </span>
            )}
            {personalInfo?.website && (
              <span className="flex items-center gap-1">
                <Globe size={12} style={{ color: theme.primaryColor }} />
                {personalInfo.website}
              </span>
            )}
          </div>
        </header>

        {/* Stacked Sections */}
        <div className="space-y-6">
          {sectionOrder.map(renderSection)}
        </div>

      </div>
    </div>
  );
};
