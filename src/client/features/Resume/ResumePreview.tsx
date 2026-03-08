"use client";

import React, { memo, useMemo } from 'react';
import { useResumeStore } from '@/client/store/resume-store';
import { useTranslations } from '@/client/hooks/useTranslations';

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
} from './components';

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

const ResumePreviewComponent = () => {
  const { resumeData, theme, sectionOrder } = useResumeStore();
  const {
    personalInfo,
    education,
    experience,
    skills,
    certifications,
    publications,
    summary,
    volunteering = [],
    languages = [],
    otherTraining = [],
    references = [],
  } = resumeData;
  const { t } = useTranslations('editor');

  // Define which sections go where
  const sidebarSectionIds = useMemo(() => ['skills', 'certifications', 'volunteering', 'languages', 'otherTraining', 'references', 'publications'], []);
  const mainSectionIds = useMemo(() => ['summary', 'experience', 'education'], []);

  // Filter and sort sections based on sectionOrder
  const sortedSidebarSections = useMemo(() => sectionOrder.filter(id => sidebarSectionIds.includes(id)), [sectionOrder, sidebarSectionIds]);
  const sortedMainSections = useMemo(() => sectionOrder.filter(id => mainSectionIds.includes(id)), [sectionOrder, mainSectionIds]);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return summary ? <SummarySection key="summary" summary={summary} title={t.preview.profile} /> : null;
      case 'experience':
        return hasData(experience) ? (
          <ExperienceSection
            key="experience"
            experience={experience}
            primaryColor={theme.primaryColor}
            title={t.preview.experience}
          />
        ) : null;
      case 'education':
        return hasData(education) ? (
          <EducationSection
            key="education"
            education={education}
            primaryColor={theme.primaryColor}
            title={t.preview.education}
          />
        ) : null;
      case 'skills':
        return hasData(skills) ? <SkillsSection key="skills" skills={skills} title={t.preview.skills} /> : null;
      case 'certifications':
        return hasData(certifications) ? (
          <CertificationsSection
            key="certifications"
            certifications={certifications}
            primaryColor={theme.primaryColor}
            title={t.preview.certifications}
          />
        ) : null;
      case 'volunteering':
        return hasData(volunteering) ? <VolunteeringSection key="volunteering" volunteering={volunteering} title={t.preview.volunteering} /> : null;
      case 'languages':
        return hasData(languages) ? <LanguagesSection key="languages" languages={languages} title={t.preview.languages} /> : null;
      case 'otherTraining':
        return hasData(otherTraining) ? <OtherTrainingSection key="otherTraining" otherTraining={otherTraining} title={t.preview.otherTraining} /> : null;
      case 'references':
        return hasData(references) ? <ReferencesSection key="references" references={references} title={t.preview.references} /> : null;
      case 'publications':
        return hasData(publications) ? (
          <PublicationsSection
            key="publications"
            publications={publications}
            title={t.preview.publications}
            viewLabel={t.preview.view}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto relative"
      id="resume-preview"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Top Blue Header Banner */}
      <ResumeHeader
        name={personalInfo?.name}
        title={personalInfo?.title}
        photoUrl={personalInfo?.photoUrl}
        primaryColor={theme.primaryColor}
        namePlaceholder={t.preview.yourName}
      />

      {/* Main Content Area (2 Columns) */}
      <div className="flex flex-1 relative">

        {/* Sidebar (Left) */}
        <aside
          className="w-[32%] py-8 px-6 flex flex-col gap-8 shrink-0 relative overflow-hidden"
          style={{ 
            backgroundColor: theme.backgroundColor,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            colorAdjust: 'exact',
          } as React.CSSProperties}
        >
          {/* Box shadow fallback */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              boxShadow: `inset 0 0 0 2000px ${theme.backgroundColor}`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              colorAdjust: 'exact',
            } as React.CSSProperties} 
          />
          
          {/* Spacer for Photo overlap */}
          <div className="h-20 relative z-10" />

          <div className="relative z-10">
            <ContactSection
              personalInfo={personalInfo}
              primaryColor={theme.primaryColor}
              title={t.preview.contact}
            />
          </div>

          <div className="relative z-10 flex flex-col gap-8">
            {sortedSidebarSections.map(renderSection)}
          </div>

          {/* Sidebar Background Extension for Print */}
          <div
            className="absolute inset-y-0 left-0 w-full bg-inherit print:fixed print:left-0 print:h-screen print:w-[32%] pointer-events-none"
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

        {/* Main Content (Right) */}
        <main className="flex-1 p-8 pb-16 bg-white min-w-0 relative z-0">
          {sortedMainSections.map(renderSection)}

          {/* White Background Extension for Print - starts below header (h-40 = 10rem = 160px) */}
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

export const ResumePreview = memo(ResumePreviewComponent);
