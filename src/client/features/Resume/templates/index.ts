export { ModernTemplate } from './ModernTemplate';
export { ExecutiveAtsTemplate } from './ExecutiveAtsTemplate';
export { CompactTemplate } from './CompactTemplate';
export { CambodiaFormalTemplate } from './CambodiaFormalTemplate';
export type { ResumeTemplateProps } from './ModernTemplate';

import { ModernTemplate, type ResumeTemplateProps } from './ModernTemplate';
import { ExecutiveAtsTemplate } from './ExecutiveAtsTemplate';
import { CompactTemplate } from './CompactTemplate';
import { CambodiaFormalTemplate } from './CambodiaFormalTemplate';
import type { ResumeTemplateId } from '@/shared/types';

export const TEMPLATE_COMPONENTS: Record<ResumeTemplateId, React.ComponentType<ResumeTemplateProps>> = {
  modern: ModernTemplate,
  executive: ExecutiveAtsTemplate,
  compact: CompactTemplate,
  cambodia: CambodiaFormalTemplate,
};
