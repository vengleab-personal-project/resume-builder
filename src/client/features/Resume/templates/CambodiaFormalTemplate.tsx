"use client";

import { Mail, Phone, MapPin, User } from 'lucide-react';
import { certificationDate, ResumeViewSection } from '@/shared/lib/resume-view';
import { STACKED_LAYOUT, STACKED_SECTION_GAP, stackedLayoutVars } from '@/shared/config/resume-layout';
import { RichText } from '../components';
import type { ResumeTemplateProps } from './types';

/**
 * Cambodian formal CV with a 4x6 photo frame. Mirrored for Word by `docx/stacked.ts`
 * (`CAMBODIA`): a class change here needs the matching change there.
 */
export const CambodiaFormalTemplate = ({ view, theme, density, printable }: ResumeTemplateProps) => {
  const { personalInfo, displayName, labels } = view;

  const heading = (title: string) => (
    <h2
      className="text-sm font-bold uppercase tracking-wider pb-1 mb-3 border-b-2 flex items-center gap-2"
      style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}
    >
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
      {title}
    </h2>
  );

  const renderSection = (section: ResumeViewSection) => {
    switch (section.id) {
      case 'summary':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <RichText html={section.content} className="text-slate-800 leading-relaxed text-justify text-sm" />
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
                  <div className="flex justify-between items-baseline flex-wrap gap-1 print:break-after-avoid" data-print-keep>
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{exp.role}</span>
                      {exp.company && <span className="font-semibold text-slate-700"> — {exp.company}</span>}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {exp.dates} {exp.location && `(${exp.location})`}
                    </span>
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
                      <span className="font-bold text-slate-900 text-sm">{edu.degree}</span>
                      {edu.school && <span className="text-slate-700 font-medium"> — {edu.school}</span>}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{edu.year}</span>
                  </div>
                  {edu.description && <RichText html={edu.description} className="text-xs text-slate-600" />}
                </div>
              ))}
            </div>
          </section>
        );

      case 'skills':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="flex flex-wrap gap-2">
              {section.content.map((skill, idx) => (
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
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {section.content.map((lang, idx) => (
                <div key={lang.id || idx} className="p-2 rounded bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900">{lang.name}</p>
                  <p className="text-slate-600 text-[11px]">{lang.proficiency}</p>
                </div>
              ))}
            </div>
          </section>
        );

      case 'certifications':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-2 text-xs">
              {section.content.map((cert, idx) => (
                <div key={cert.id || idx} className="flex justify-between gap-2">
                  <span className="font-medium text-slate-900">
                    {cert.name}
                    {cert.issuer && ` (${cert.issuer})`}
                  </span>
                  <span className="text-slate-500 font-medium">{certificationDate(cert)}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'publications':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-1.5 text-xs">
              {section.content.map((pub, idx) => (
                <div key={pub.id || idx} className="flex justify-between gap-2">
                  <span className="font-medium text-slate-900">{pub.title}</span>
                  <span className="text-slate-500">{pub.date}</span>
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
                  <span className="font-medium text-slate-900">
                    {vol.role}
                    {vol.organization && ` (${vol.organization})`}
                  </span>
                  <span className="text-slate-500">{vol.topic}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'otherTraining':
        return (
          <section key={section.id} className="break-inside-avoid">
            {heading(section.title)}
            <div className="space-y-1 text-xs">
              {section.content.map((tr, idx) => (
                <div key={tr.id || idx} className="text-slate-800">
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
                <div key={ref.id || idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p className="text-slate-700 font-medium text-[11px]">
                      {[ref.title, ref.company].filter(Boolean).join(' — ')}
                    </p>
                  )}
                  {ref.phone && <p className="text-slate-500 text-[11px]">{ref.phone}</p>}
                  {ref.email && <p className="text-slate-500 text-[11px]">{ref.email}</p>}
                </div>
              ))}
            </div>
          </section>
        );
    }
  };

  const contacts = [
    { key: 'phone', value: personalInfo.phone, Icon: Phone },
    { key: 'email', value: personalInfo.email, Icon: Mail },
    { key: 'address', value: personalInfo.address, Icon: MapPin },
  ].filter((contact) => contact.value);

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto"
      id={printable ? 'resume-preview' : undefined}
      style={{
        fontFamily: theme.fontFamily,
        ...stackedLayoutVars(STACKED_LAYOUT.cambodia[density], STACKED_SECTION_GAP.cambodia),
      }}
    >
      <div className="w-full max-w-4xl mx-auto p-[var(--rv-pad)] space-y-[var(--rv-gap)] text-[length:var(--rv-font)] leading-[var(--rv-leading)]">

        {/* Cambodian Formal Header with Photo Frame */}
        <header className="flex justify-between items-start gap-6 pb-6 border-b-2 break-inside-avoid" style={{ borderColor: theme.primaryColor }}>

          <div className="space-y-2 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {displayName}
            </h1>
            {personalInfo.title && (
              <p className="text-sm font-semibold tracking-wide" style={{ color: theme.primaryColor }}>
                {personalInfo.title}
              </p>
            )}

            {/* Personal Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-xs text-slate-700">
              {contacts.map(({ key, value, Icon }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Icon size={13} style={{ color: theme.primaryColor }} />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Frame */}
          <div className="w-28 h-36 rounded-md border-2 p-1 bg-white flex-shrink-0 shadow-sm" style={{ borderColor: theme.primaryColor }}>
            {personalInfo.photoUrl ? (
              <img
                src={personalInfo.photoUrl}
                alt="Profile"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded flex flex-col items-center justify-center text-slate-400 text-xs">
                <User size={28} className="mb-1 text-slate-300" />
                <span>{labels.photoPlaceholder}</span>
              </div>
            )}
          </div>

        </header>

        {/* Stacked Sections */}
        <div className="space-y-[var(--rv-section-gap)] pt-2">
          {view.sections.map(renderSection)}
        </div>

      </div>
    </div>
  );
};
