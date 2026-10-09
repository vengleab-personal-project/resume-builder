"use client";

import { useMemo } from 'react';
import type { ResumeData, ThemeConfig } from '@/shared/types';
import { buildResumeView } from '@/shared/lib/resume-view';
import { resolveDensity, resolveTemplateId } from '@/shared/config/resume-layout';
import { useTranslations } from '@/client/hooks/useTranslations';
import { TEMPLATE_COMPONENTS } from './templates';

export type ResumeDocumentProps = {
  resumeData: ResumeData;
  theme: ThemeConfig;
  sectionOrder: string[];
  /** See `ResumeTemplateProps.printable`. */
  printable: boolean;
};

/**
 * A resume drawn with the template the user chose - the one rendering path shared by
 * the live preview (and so the print/PDF) and the resume-list thumbnails. The DOCX
 * export reads the same `buildResumeView` result and the same template id/density.
 */
export const ResumeDocument = ({ resumeData, theme, sectionOrder, printable }: ResumeDocumentProps) => {
  const { t } = useTranslations('editor');
  const view = useMemo(
    () => buildResumeView(resumeData, sectionOrder, t.preview),
    [resumeData, sectionOrder, t.preview]
  );
  const Template = TEMPLATE_COMPONENTS[resolveTemplateId(theme)];

  return <Template view={view} theme={theme} density={resolveDensity(theme)} printable={printable} />;
};
