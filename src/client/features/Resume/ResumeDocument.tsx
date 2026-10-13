"use client";

import { useMemo } from 'react';
import type { ResumeData, SupportedLocale, ThemeConfig } from '@/shared/types';
import { buildResumeView } from '@/shared/lib/resume-view';
import { resolveDensity, resolveTemplateId } from '@/shared/config/resume-layout';
import { getDictionary, useTranslations } from '@/client/hooks/useTranslations';
import { TEMPLATE_COMPONENTS } from './templates';

export type ResumeDocumentProps = {
  resumeData: ResumeData;
  theme: ThemeConfig;
  sectionOrder: string[];
  /** See `ResumeTemplateProps.printable`. */
  printable: boolean;
  /**
   * Language for the section headings. Defaults to the viewer's UI language; a shared
   * link pins it to the owner's, so a Khmer CV is not shown with English headings.
   */
  locale?: SupportedLocale;
};

/**
 * A resume drawn with the template the user chose - the one rendering path shared by
 * the live preview (and so the print/PDF) and the resume-list thumbnails. The DOCX
 * export reads the same `buildResumeView` result and the same template id/density.
 */
export const ResumeDocument = ({
  resumeData,
  theme,
  sectionOrder,
  printable,
  locale,
}: ResumeDocumentProps) => {
  const { t } = useTranslations('editor');
  const labels = locale ? getDictionary(locale).editor.preview : t.preview;
  const view = useMemo(
    () => buildResumeView(resumeData, sectionOrder, labels),
    [resumeData, sectionOrder, labels]
  );
  const Template = TEMPLATE_COMPONENTS[resolveTemplateId(theme)];

  return <Template view={view} theme={theme} density={resolveDensity(theme)} printable={printable} />;
};
