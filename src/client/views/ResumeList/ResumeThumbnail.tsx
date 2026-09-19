"use client";

import React, { useEffect, useRef, useState } from 'react';
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
} from '@/client/features/Resume/components';
import type { ResumeDTO } from '@/shared/types/persistence';

// Matches an A4 page rendered at 96dpi -- the same box ResumePreview lays
// its content into, just scaled down to card size instead of print size.
const SOURCE_WIDTH = 794;
const SOURCE_HEIGHT = 1123;

const SIDEBAR_SECTION_IDS = ['skills', 'certifications', 'volunteering', 'languages', 'otherTraining', 'references', 'publications'];
const MAIN_SECTION_IDS = ['summary', 'experience', 'education'];

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

interface ResumeThumbnailProps {
  resumeId: string;
}

export function ResumeThumbnail({ resumeId }: ResumeThumbnailProps) {
  const { t: tResumeList } = useTranslations('resumeList');
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [resume, setResume] = useState<ResumeDTO | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/resumes/${resumeId}`, { credentials: 'same-origin' });
        if (!res.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const body = (await res.json()) as { resume: ResumeDTO };
        if (!cancelled) setResume(body.resume);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setScale(el.clientWidth / SOURCE_WIDTH);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
      style={{ aspectRatio: `${SOURCE_WIDTH} / ${SOURCE_HEIGHT}` }}
    >
      {!resume && !failed && <div className="absolute inset-0 animate-pulse bg-slate-100" />}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 px-4 text-center">
          {tResumeList.previewUnavailable}
        </div>
      )}

      {resume && scale > 0 && <ResumeThumbnailBody resume={resume} scale={scale} />}
    </div>
  );
}

function ResumeThumbnailBody({ resume, scale }: { resume: ResumeDTO; scale: number }) {
  const { t } = useTranslations('editor');
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
  } = resume.data;
  const { theme, sectionOrder } = resume;

  const sortedSidebarSections = sectionOrder.filter((id) => SIDEBAR_SECTION_IDS.includes(id));
  const sortedMainSections = sectionOrder.filter((id) => MAIN_SECTION_IDS.includes(id));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return summary ? <SummarySection key="summary" summary={summary} title={t.preview.profile} /> : null;
      case 'experience':
        return hasData(experience) ? (
          <ExperienceSection key="experience" experience={experience} primaryColor={theme.primaryColor} title={t.preview.experience} />
        ) : null;
      case 'education':
        return hasData(education) ? (
          <EducationSection key="education" education={education} primaryColor={theme.primaryColor} title={t.preview.education} />
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
        return hasData(volunteering) ? (
          <VolunteeringSection key="volunteering" volunteering={volunteering} title={t.preview.volunteering} />
        ) : null;
      case 'languages':
        return hasData(languages) ? <LanguagesSection key="languages" languages={languages} title={t.preview.languages} /> : null;
      case 'otherTraining':
        return hasData(otherTraining) ? (
          <OtherTrainingSection key="otherTraining" otherTraining={otherTraining} title={t.preview.otherTraining} />
        ) : null;
      case 'references':
        return hasData(references) ? <ReferencesSection key="references" references={references} title={t.preview.references} /> : null;
      case 'publications':
        return hasData(publications) ? (
          <PublicationsSection key="publications" publications={publications} title={t.preview.publications} viewLabel={t.preview.view} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white pointer-events-none"
      style={{ width: SOURCE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <div className="w-full flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <ResumeHeader
          name={personalInfo.name}
          title={personalInfo.title}
          photoUrl={personalInfo.photoUrl}
          primaryColor={theme.primaryColor}
          namePlaceholder={t.preview.yourName}
        />

        <div className="flex flex-1 relative">
          <aside
            className="w-[32%] py-8 px-6 flex flex-col gap-8 shrink-0 relative overflow-hidden"
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <div className="h-20 relative z-10" />
            <div className="relative z-10">
              <ContactSection personalInfo={personalInfo} primaryColor={theme.primaryColor} title={t.preview.contact} />
            </div>
            <div className="relative z-10 flex flex-col gap-8">{sortedSidebarSections.map(renderSection)}</div>
          </aside>

          <main className="flex-1 p-8 pb-16 bg-white min-w-0 relative z-0">{sortedMainSections.map(renderSection)}</main>
        </div>
      </div>
    </div>
  );
}
