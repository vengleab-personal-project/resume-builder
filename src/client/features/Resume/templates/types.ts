import type { ResumeDensity, ThemeConfig } from '@/shared/types';
import type { ResumeView } from '@/shared/lib/resume-view';

export type ResumeTemplateProps = {
  /** What to show - built once by `buildResumeView`, shared with the DOCX export. */
  view: ResumeView;
  theme: ThemeConfig;
  density: ResumeDensity;
  /**
   * The live document that `window.print()` exports: it takes the `#resume-preview`
   * id the print rules in globals.css target, and Modern paints its sidebar colour into
   * the page margins. Thumbnails render the same template with this off.
   */
  printable: boolean;
};
