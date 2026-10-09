import { Packer } from 'docx';

import type { ResumeTemplateId, ThemeConfig } from '@/shared/types';
import type { ResumeView } from '@/shared/lib/resume-view';
import { resolveDensity, resolveTemplateId } from '@/shared/config/resume-layout';

import type { DocxRenderer } from './common';
import { renderModernDocx } from './modern';
import { renderCambodiaDocx, renderCompactDocx, renderExecutiveDocx } from './stacked';

/**
 * One Word renderer per preview template, keyed exactly like `TEMPLATE_COMPONENTS`:
 * adding a template id without a renderer here is a compile error, so the DOCX can
 * never silently fall back to a different layout than the one on screen.
 */
export const DOCX_RENDERERS: Record<ResumeTemplateId, DocxRenderer> = {
  modern: renderModernDocx,
  executive: renderExecutiveDocx,
  compact: renderCompactDocx,
  cambodia: renderCambodiaDocx,
};

/**
 * Renders `view` as a .docx in the template and density the preview is showing,
 * resolved by the same rules (`resolveTemplateId` / `resolveDensity`).
 */
export const generateResumeDocx = async (view: ResumeView, theme: ThemeConfig): Promise<Blob> => {
  const render = DOCX_RENDERERS[resolveTemplateId(theme)];
  const document = await render(view, theme, resolveDensity(theme));
  return Packer.toBlob(document);
};
