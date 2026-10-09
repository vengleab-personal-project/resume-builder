"use client";

import { certificationDate, ResumeViewSection } from '@/shared/lib/resume-view';
import { STACKED_LAYOUT, STACKED_SECTION_GAP, stackedLayoutVars } from '@/shared/config/resume-layout';
import { RichText } from '../components';
import type { ResumeTemplateProps } from './types';

/**
 * Dense single-column layout. Mirrored for Word by `docx/stacked.ts` (`COMPACT`):
 * a class change here needs the matching change there.
 */
export const CompactTemplate = ({ view, theme, density, printable }: ResumeTemplateProps) => {
  const { personalInfo, displayName } = view;

  const heading = (title: string) => (
    <h2
      className="text-xs font-black uppercase tracking-wider flex items-center gap-2 mb-2 pb-1 border-b"
      style={{ color: theme.primaryColor, borderColor: '#e2e8f0' }}
    >
      <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.primaryColor }} />
      {title}
    </h2>
  );

  const renderSection = (section: ResumeViewSection) => {
    switch (section.id) {
      case 'summary':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <RichText html={section.content} className="text-slate-700 text-xs" />
          </section>
        );

      case 'experience':
        return (
          <section key={section.id}>
            {heading(section.title)}
            <div className="space-y-3">
              {section.content.map((exp, idx) => (
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
                    <RichText
                      html={exp.description}
                      className="text-slate-700 text-xs prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-0.5"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'skills':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="flex flex-wrap gap-1.5">
              {section.content.map((skill, idx) => (
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
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-2">
              {section.content.map((edu, idx) => (
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
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {section.content.map((cert, idx) => (
                <div key={cert.id || idx} className="flex justify-between text-[11px]">
                  <span className="font-medium text-slate-800 truncate">{cert.name}</span>
                  <span className="text-slate-500 shrink-0 ml-2">{certificationDate(cert)}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'publications':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-1 text-xs">
              {section.content.map((pub, idx) => (
                <div key={pub.id || idx} className="flex justify-between gap-2">
                  <span className="font-medium text-slate-800">{pub.title}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{pub.date}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'languages':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="flex flex-wrap gap-3 text-xs">
              {section.content.map((lang, idx) => (
                <span key={lang.id || idx} className="text-slate-700">
                  <strong className="font-semibold">{lang.name}:</strong> {lang.proficiency}
                </span>
              ))}
            </div>
          </section>
        );

      case 'volunteering':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-1 text-xs">
              {section.content.map((vol, idx) => (
                <div key={vol.id || idx} className="flex justify-between gap-2">
                  <span className="font-medium">
                    {vol.role}
                    {vol.organization && ` (${vol.organization})`}
                  </span>
                  <span className="text-slate-500 text-[11px]">{vol.topic}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'otherTraining':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-0.5 text-xs text-slate-700">
              {section.content.map((tr, idx) => (
                <div key={tr.id || idx}>
                  • <RichText inline html={tr.name} />
                </div>
              ))}
            </div>
          </section>
        );

      case 'references':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {section.content.map((ref, idx) => (
                <div key={ref.id || idx} className="p-1.5 bg-slate-50 rounded border border-slate-200">
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p className="text-slate-600 text-[11px]">{[ref.title, ref.company].filter(Boolean).join(' • ')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
    }
  };

  const contacts = [personalInfo.email, personalInfo.phone, personalInfo.address, personalInfo.linkedin].filter(
    Boolean
  );

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto"
      id={printable ? 'resume-preview' : undefined}
      style={{
        fontFamily: theme.fontFamily,
        ...stackedLayoutVars(STACKED_LAYOUT.compact[density], STACKED_SECTION_GAP.compact),
      }}
    >
      <div className="w-full max-w-4xl mx-auto p-[var(--rv-pad)] space-y-[var(--rv-gap)] text-[length:var(--rv-font)] leading-[var(--rv-leading)]">

        {/* Compact Header */}
        <header className="flex flex-row justify-between items-center gap-3 pb-3 border-b-2 break-inside-avoid" style={{ borderColor: theme.primaryColor }}>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.primaryColor }}>
              {displayName}
            </h1>
            {personalInfo.title && (
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-0.5">
                {personalInfo.title}
              </p>
            )}
          </div>

          <div className="text-[11px] font-medium text-slate-600 text-right">
            {contacts.join(' • ')}
          </div>
        </header>

        {/* Stacked Sections */}
        <div className="space-y-[var(--rv-section-gap)]">
          {view.sections.map(renderSection)}
        </div>

      </div>
    </div>
  );
};
