export { ModernTemplate } from './ModernTemplate';
export { ExecutiveAtsTemplate } from './ExecutiveAtsTemplate';
export { CompactTemplate } from './CompactTemplate';
export { CambodiaFormalTemplate } from './CambodiaFormalTemplate';
export type { ResumeTemplateProps } from './types';

import type { ComponentType } from 'react';
import type { ResumeTemplateId } from '@/shared/types';
import { ModernTemplate } from './ModernTemplate';
import { ExecutiveAtsTemplate } from './ExecutiveAtsTemplate';
import { CompactTemplate } from './CompactTemplate';
import { CambodiaFormalTemplate } from './CambodiaFormalTemplate';
import type { ResumeTemplateProps } from './types';

/** Keyed like `DOCX_RENDERERS` in `../docx`: a template without a Word renderer cannot compile. */
export const TEMPLATE_COMPONENTS: Record<ResumeTemplateId, ComponentType<ResumeTemplateProps>> = {
  modern: ModernTemplate,
  executive: ExecutiveAtsTemplate,
  compact: CompactTemplate,
  cambodia: CambodiaFormalTemplate,
};
