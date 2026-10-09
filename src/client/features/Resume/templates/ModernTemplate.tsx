"use client";

import React from 'react';
import { MAIN_SECTION_IDS, ResumeViewSection, SIDEBAR_SECTION_IDS, sectionsIn } from '@/shared/lib/resume-view';
import { MODERN_LAYOUT, modernLayoutVars } from '@/shared/config/resume-layout';
import { usePrintSidebarBackground } from '../usePrintSidebarBackground';
import {
  ResumeHeader,
  ContactSection,
  SkillsSection,
  CertificationsSection,
  VolunteeringSection,
  LanguagesSection,
  OtherTrainingSection,
  ReferencesSection,
  PublicationsSection,
  EducationSection,
  ExperienceSection,
  SummarySection,
} from '../components';
import type { ResumeTemplateProps } from './types';

/**
 * The two-column template. Its spacing comes from `MODERN_LAYOUT` (via the `--rv-*`
 * custom properties on the root), which the DOCX export reads too - change a gap
 * there, not here.
 */
export const ModernTemplate = ({ view, theme, density, printable }: ResumeTemplateProps) => {
  usePrintSidebarBackground(theme.backgroundColor, printable);
  const { personalInfo, labels } = view;

  const sidebarSections = sectionsIn(view, SIDEBAR_SECTION_IDS);
  const mainSections = sectionsIn(view, MAIN_SECTION_IDS);

  const renderSection = (section: ResumeViewSection) => {
    switch (section.id) {
      case 'summary':
        return <SummarySection key={section.id} summary={section.content} title={section.title} />;
      case 'experience':
        return (
          <ExperienceSection
            key={section.id}
            experience={section.content}
            primaryColor={theme.primaryColor}
            title={section.title}
          />
        );
      case 'education':
        return (
          <EducationSection
            key={section.id}
            education={section.content}
            primaryColor={theme.primaryColor}
            title={section.title}
          />
        );
      case 'skills':
        return <SkillsSection key={section.id} skills={section.content} title={section.title} />;
      case 'certifications':
        return (
          <CertificationsSection
            key={section.id}
            certifications={section.content}
            primaryColor={theme.primaryColor}
            title={section.title}
            labels={labels}
          />
        );
      case 'volunteering':
        return (
          <VolunteeringSection
            key={section.id}
            volunteering={section.content}
            title={section.title}
            topicLabel={labels.topic}
          />
        );
      case 'languages':
        return <LanguagesSection key={section.id} languages={section.content} title={section.title} />;
      case 'otherTraining':
        return <OtherTrainingSection key={section.id} otherTraining={section.content} title={section.title} />;
      case 'references':
        return (
          <ReferencesSection
            key={section.id}
            references={section.content}
            title={section.title}
            phoneLabel={labels.phone}
            emailLabel={labels.email}
          />
        );
      case 'publications':
        return (
          <PublicationsSection
            key={section.id}
            publications={section.content}
            title={section.title}
            viewLabel={labels.view}
          />
        );
    }
  };

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto relative"
      id={printable ? 'resume-preview' : undefined}
      style={{ fontFamily: theme.fontFamily, ...modernLayoutVars(MODERN_LAYOUT[density]) }}
    >
      {/* Top Banner */}
      <ResumeHeader
        name={personalInfo.name}
        title={personalInfo.title}
        photoUrl={personalInfo.photoUrl}
        primaryColor={theme.primaryColor}
        namePlaceholder={labels.yourName}
      />

      {/* 2-Column Content */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
          className="w-[32%] flex flex-col shrink-0 relative overflow-hidden py-[var(--rv-sidebar-pad-y)] px-[var(--rv-sidebar-pad-x)] gap-[var(--rv-sidebar-gap)]"
          style={{
            backgroundColor: theme.backgroundColor,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            colorAdjust: 'exact',
          } as React.CSSProperties}
        >
          {/* Background fallback */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 2000px ${theme.backgroundColor}`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              colorAdjust: 'exact',
            } as React.CSSProperties}
          />

          {/* Spacer for photo overlap */}
          <div className="h-[var(--rv-photo-spacer)] relative z-10" />

          <div className="relative z-10">
            <ContactSection
              personalInfo={personalInfo}
              primaryColor={theme.primaryColor}
              title={labels.contact}
            />
          </div>

          <div className="relative z-10 flex flex-col gap-[var(--rv-sidebar-section-gap)]">
            {sidebarSections.map(renderSection)}
          </div>

          {/* Sidebar Background Extension for Print */}
          <div
            className="absolute inset-y-0 left-0 w-full bg-inherit print:fixed print:left-0 print:top-[-12mm] print:bottom-[-12mm] print:w-[32%] pointer-events-none"
            style={{
              backgroundColor: theme.backgroundColor,
              boxShadow: `inset 0 0 0 2000px ${theme.backgroundColor}`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              colorAdjust: 'exact',
              zIndex: -20,
            } as React.CSSProperties}
          />
        </aside>

        {/* Main Column */}
        <main className="flex-1 bg-white min-w-0 relative z-0 flex flex-col p-[var(--rv-main-pad)] gap-[var(--rv-main-gap)]">
          {mainSections.map(renderSection)}

          {/* White Background Extension for Print */}
          <div
            className="absolute inset-0 -z-10 bg-white print:fixed print:left-[32%] print:right-0 print:bottom-0 print:h-[200vh]"
            style={{
              WebkitPrintColorAdjust: 'exact',
              top: 0,
            }}
          />
        </main>
      </div>
    </div>
  );
};
