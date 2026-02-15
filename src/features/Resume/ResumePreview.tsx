"use client";

import { useResumeStore } from '@/store/resume-store';
import { useTranslations } from '@/hooks/useTranslations';

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

const hasData = (arr: unknown[] | undefined) => arr && arr.filter(Boolean).length > 0;

export const ResumePreview = () => {
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
  const sidebarSectionIds = ['skills', 'certifications', 'volunteering', 'languages', 'otherTraining', 'references', 'publications'];
  const mainSectionIds = ['summary', 'experience', 'education'];

  // Filter and sort sections based on sectionOrder
  const sortedSidebarSections = sectionOrder.filter(id => sidebarSectionIds.includes(id));
  const sortedMainSections = sectionOrder.filter(id => mainSectionIds.includes(id));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return summary ? <SummarySection key="summary" summary={summary} title={t('preview.profile')} /> : null;
      case 'experience':
        return hasData(experience) ? (
          <ExperienceSection
            key="experience"
            experience={experience}
            primaryColor={theme.primaryColor}
            title={t('preview.experience')}
          />
        ) : null;
      case 'education':
        return hasData(education) ? (
          <EducationSection
            key="education"
            education={education}
            primaryColor={theme.primaryColor}
            title={t('preview.education')}
          />
        ) : null;
      case 'skills':
        return hasData(skills) ? <SkillsSection key="skills" skills={skills} title={t('preview.skills')} /> : null;
      case 'certifications':
        return hasData(certifications) ? (
          <CertificationsSection
            key="certifications"
            certifications={certifications}
            primaryColor={theme.primaryColor}
            title={t('preview.certifications')}
          />
        ) : null;
      case 'volunteering':
        return hasData(volunteering) ? <VolunteeringSection key="volunteering" volunteering={volunteering} title={t('preview.volunteering')} /> : null;
      case 'languages':
        return hasData(languages) ? <LanguagesSection key="languages" languages={languages} title={t('preview.languages')} /> : null;
      case 'otherTraining':
        return hasData(otherTraining) ? <OtherTrainingSection key="otherTraining" otherTraining={otherTraining} title={t('preview.otherTraining')} /> : null;
      case 'references':
        return hasData(references) ? <ReferencesSection key="references" references={references} title={t('preview.references')} /> : null;
      case 'publications':
        return hasData(publications) ? (
          <PublicationsSection
            key="publications"
            publications={publications}
            title={t('preview.publications')}
            viewLabel={t('preview.view')}
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
        namePlaceholder={t('preview.yourName')}
      />

      {/* Main Content Area (2 Columns) */}
      <div className="flex flex-1 relative">

        {/* Sidebar (Left) */}
        <aside
          className="w-[32%] py-8 px-6 flex flex-col gap-8 shrink-0 relative z-0"
          style={{ backgroundColor: theme.backgroundColor, WebkitPrintColorAdjust: 'exact' }}
        >
          {/* Spacer for Photo overlap */}
          <div className="h-20" />

          <ContactSection
            personalInfo={personalInfo}
            primaryColor={theme.primaryColor}
            title={t('preview.contact')}
          />

          {sortedSidebarSections.map(renderSection)}

          {/* Sidebar Background Extension for Print */}
          <div
            className="absolute inset-y-0 left-0 w-full -z-10 bg-inherit print:fixed print:left-0 print:h-screen print:w-[32%]"
            style={{ backgroundColor: theme.backgroundColor, WebkitPrintColorAdjust: 'exact' }}
          />
        </aside>

        {/* Main Content (Right) */}
        <main className="flex-1 p-8 pb-16 bg-white shrink-0 relative z-0">
          {sortedMainSections.map(renderSection)}

          {/* White Background Extension for Print */}
          <div
            className="absolute inset-0 -z-10 bg-white print:fixed print:left-[32%] print:right-0 print:top-0 print:bottom-0 print:h-[200vh]"
            style={{ WebkitPrintColorAdjust: 'exact' }}
          />
        </main>
      </div>
    </div>
  );
};
