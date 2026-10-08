'use client';

import { memo } from 'react';
import type { BasicResumeData } from '@/shared/types/basic-resume';
import type { ThemeConfig } from '@/shared/types';
import {
  basicSectionHasContent,
  visibleBasicEducation,
  visibleBasicExperience,
  visibleBasicInterests,
  visibleBasicLanguages,
} from '@/shared/lib/basic-resume';
import { useTranslations } from '@/client/hooks/useTranslations';

import {
  BasicLanguagesSection,
  BasicPersonalSection,
  BasicPositionLine,
  BasicResumeHeader,
  BasicSectionHeading,
  BasicTextSection,
  BasicYearListSection,
  type BasicPersonalRow,
} from './components';

export type BasicResumePreviewProps = {
  data: BasicResumeData;
  theme: ThemeConfig;
};

/**
 * The Cambodian short-form CV (ប្រវត្តិរូបសង្ខេប), rendered on a single A4 page.
 *
 * Driven entirely by props rather than by `useResumeStore`, because that store
 * holds the professional resume's shape and the two must never be able to reach
 * each other. Everything below the label lookup is passed down; the
 * sub-components never read a store or a context themselves.
 */
const BasicResumePreviewComponent = ({ data, theme }: BasicResumePreviewProps) => {
  const { t } = useTranslations('basicResume');

  // Built in the order the reference document uses, and filtered here rather
  // than in the component: a declined answer must not reach print as a label
  // with a blank beside it.
  const personalRows: BasicPersonalRow[] = (
    [
      ['nationality', data.personal.nationality],
      ['gender', data.personal.gender],
      ['dateOfBirth', data.personal.dateOfBirth],
      ['placeOfBirth', data.personal.placeOfBirth],
      ['maritalStatus', data.personal.maritalStatus],
      ['health', data.personal.health],
    ] as const
  )
    .filter(([, value]) => value.trim())
    .map(([key, value]) => ({ label: t.personal[key], value }));

  const education = visibleBasicEducation(data);
  const experience = visibleBasicExperience(data);
  const languages = visibleBasicLanguages(data);
  const interests = visibleBasicInterests(data);

  return (
    <div
      id="basic-resume-preview"
      className="w-full min-h-[1122px] bg-white text-black px-14 py-12 print:px-14 print:py-10 print:shadow-none"
      style={{ fontFamily: theme.fontFamily }}
    >
      <BasicResumeHeader
        documentTitle={t.documentTitle}
        nameLabel={t.nameLabel}
        fullName={data.fullName}
        address={data.contact.address}
        phone={data.contact.phone}
        email={data.contact.email}
        phoneLabel={t.phoneLabel}
        photoUrl={data.photoUrl}
        photoAlt={t.photoAlt}
        primaryColor={theme.primaryColor}
      />

      {/* Every section is omitted entirely when empty -- never rendered as a
          bare heading. An interrupted interview has to come out looking like a
          shorter CV, not a broken one. */}
      {basicSectionHasContent(data, 'personal') && (
        <section>
          <BasicSectionHeading title={t.sections.personal} />
          <BasicPersonalSection rows={personalRows} />
        </section>
      )}

      {basicSectionHasContent(data, 'positionSought') && (
        <section>
          <BasicPositionLine
            label={t.sections.positionSought}
            position={data.positionSought}
            primaryColor={theme.primaryColor}
          />
        </section>
      )}

      {basicSectionHasContent(data, 'education') && (
        <section>
          <BasicSectionHeading title={t.sections.education} />
          <BasicYearListSection entries={education} separator=":" />
        </section>
      )}

      {basicSectionHasContent(data, 'experience') && (
        <section>
          <BasicSectionHeading title={t.sections.experience} />
          <BasicYearListSection entries={experience} />
        </section>
      )}

      {basicSectionHasContent(data, 'languages') && (
        <section>
          <BasicSectionHeading title={t.sections.languages} />
          <BasicLanguagesSection languages={languages} />
        </section>
      )}

      {basicSectionHasContent(data, 'interests') && (
        <section>
          <BasicSectionHeading title={t.sections.interests} />
          <BasicTextSection text={interests.join(', ')} indented />
        </section>
      )}

      {basicSectionHasContent(data, 'personalStatement') && (
        <section>
          <BasicSectionHeading title={t.sections.personalStatement} />
          <BasicTextSection text={data.personalStatement} />
        </section>
      )}
    </div>
  );
};

export const BasicResumePreview = memo(BasicResumePreviewComponent);
