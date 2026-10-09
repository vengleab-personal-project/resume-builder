"use client";

import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { certificationDate, ResumeViewSection } from '@/shared/lib/resume-view';
import { STACKED_LAYOUT, STACKED_SECTION_GAP, stackedLayoutVars } from '@/shared/config/resume-layout';
import { RichText } from '../components';
import type { ResumeTemplateProps } from './types';

/**
 * Single-column, ATS-friendly. Mirrored for Word by `docx/stacked.ts` (`EXECUTIVE`):
 * a class change here needs the matching change there.
 */
export const ExecutiveAtsTemplate = ({ view, theme, density, printable }: ResumeTemplateProps) => {
  const { personalInfo, displayName } = view;
  const accent = { borderColor: theme.primaryColor, color: theme.primaryColor };

  const heading = (title: string) => (
    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 pb-1 mb-3" style={accent}>
      {title}
    </h2>
  );

  const renderSection = (section: ResumeViewSection) => {
    switch (section.id) {
      case 'summary':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <RichText html={section.content} className="text-slate-700 leading-relaxed text-justify" />
          </section>
        );

      case 'experience':
        return (
          <section key={section.id}>
            {heading(section.title)}
            <div className="space-y-4">
              {section.content.map((exp, idx) => (
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
                    <RichText
                      html={exp.description}
                      className="text-slate-700 text-xs leading-relaxed prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'education':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-3">
              {section.content.map((edu, idx) => (
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
                    <RichText html={edu.description} className="text-xs text-slate-600 leading-relaxed" />
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
            <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-xs text-slate-700">
              {section.content.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center">
                  <span className="font-medium">{skill}</span>
                  {idx < section.content.length - 1 && <span className="text-slate-300 ml-2">•</span>}
                </span>
              ))}
            </div>
          </section>
        );

      case 'certifications':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
              {section.content.map((cert, idx) => (
                <div key={cert.id || idx} className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">{cert.name}</span>
                  <span className="text-slate-500">{certificationDate(cert)}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'publications':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-2 text-xs">
              {section.content.map((pub, idx) => (
                <div key={pub.id || idx} className="flex justify-between items-baseline gap-2">
                  <span className="font-medium text-slate-800">{pub.title}</span>
                  {pub.date && <span className="text-slate-500 flex-shrink-0">{pub.date}</span>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'languages':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="flex flex-wrap gap-4 text-xs">
              {section.content.map((lang, idx) => (
                <div key={lang.id || idx} className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{lang.name}:</span>
                  <span className="text-slate-600">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'volunteering':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-2 text-xs">
              {section.content.map((vol, idx) => (
                <div key={vol.id || idx} className="flex justify-between gap-2">
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
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-1.5 text-xs text-slate-700">
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
            <div className="grid grid-cols-2 gap-3 text-xs">
              {section.content.map((ref, idx) => (
                <div key={ref.id || idx} className="space-y-0.5">
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p className="text-slate-600">{[ref.title, ref.company].filter(Boolean).join(' — ')}</p>
                  )}
                  {ref.email && <p className="text-slate-500">{ref.email}</p>}
                  {ref.phone && <p className="text-slate-500">{ref.phone}</p>}
                </div>
              ))}
            </div>
          </section>
        );
    }
  };

  const contacts = [
    { key: 'email', value: personalInfo.email, Icon: Mail },
    { key: 'phone', value: personalInfo.phone, Icon: Phone },
    { key: 'address', value: personalInfo.address, Icon: MapPin },
    { key: 'linkedin', value: personalInfo.linkedin, Icon: Linkedin },
    { key: 'website', value: personalInfo.website, Icon: Globe },
  ].filter((contact) => contact.value);

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto"
      id={printable ? 'resume-preview' : undefined}
      style={{
        fontFamily: theme.fontFamily,
        ...stackedLayoutVars(STACKED_LAYOUT.executive[density], STACKED_SECTION_GAP.executive),
      }}
    >
      <div className="w-full max-w-4xl mx-auto p-[var(--rv-pad)] space-y-[var(--rv-gap)] text-[length:var(--rv-font)] leading-[var(--rv-leading)]">

        {/* Executive Header */}
        <header className="text-center border-b pb-5 break-inside-avoid" style={{ borderColor: theme.primaryColor }}>
          <h1
            className="text-4xl font-extrabold tracking-tight mb-1"
            style={{ color: theme.primaryColor }}
          >
            {displayName}
          </h1>
          {personalInfo.title && (
            <p className="text-base font-semibold text-slate-700 tracking-wide mb-3 uppercase">
              {personalInfo.title}
            </p>
          )}

          {/* Contact Strip */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            {contacts.map(({ key, value, Icon }) => (
              <span key={key} className="flex items-center gap-1">
                <Icon size={12} style={{ color: theme.primaryColor }} />
                {value}
              </span>
            ))}
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
