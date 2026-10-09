import type { ResumeDensity, ResumeTemplateId, ThemeConfig } from '@/shared/types';

/**
 * Layout numbers the preview templates and the DOCX renderers both read, so the
 * spacing a user picks (density) cannot change in one output and not the other.
 *
 * The templates consume these as CSS custom properties (`layoutVars`) referenced from
 * Tailwind arbitrary values such as `p-[var(--rv-pad)]`; the DOCX renderers convert
 * the same numbers to twips. All values are CSS px at 96dpi unless named otherwise.
 *
 * Fixed per-element styling (a heading's `text-sm`, an entry's `mb-2`) still lives as
 * Tailwind classes in the components, mirrored by commented constants in
 * `features/Resume/docx`. What lives here is what varies at runtime or is shared by
 * more than one file.
 */

// ---------------------------------------------------------------------------
// Page geometry - mirrors `@page` in app/globals.css. Change both together.
// ---------------------------------------------------------------------------

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
/**
 * `@page { margin: 12mm 0 }`, with `@page :first { margin-top: 0 }` so the first
 * sheet's header can sit at the top edge. Sides are 0 so backgrounds stay full-bleed.
 */
export const PAGE_MARGIN_Y_MM = 12;

export const mmToPx = (mm: number) => (mm * 96) / 25.4;

/** Usable content height of printed page `index` (0-based), in CSS px. */
export const printablePageHeightPx = (index: number) =>
  mmToPx(PAGE_HEIGHT_MM - (index === 0 ? PAGE_MARGIN_Y_MM : 2 * PAGE_MARGIN_Y_MM));

// ---------------------------------------------------------------------------
// Template + density resolution - one rule for every renderer
// ---------------------------------------------------------------------------

export const RESUME_TEMPLATE_IDS: readonly ResumeTemplateId[] = ['modern', 'executive', 'compact', 'cambodia'];

export const resolveTemplateId = (theme: ThemeConfig): ResumeTemplateId =>
  theme.templateId && RESUME_TEMPLATE_IDS.includes(theme.templateId) ? theme.templateId : 'modern';

export const resolveDensity = (theme: ThemeConfig): ResumeDensity => theme.density ?? 'standard';

// ---------------------------------------------------------------------------
// Modern (two-column)
// ---------------------------------------------------------------------------

export type ModernLayout = {
  /** aside `py-*` */
  sidebarPadY: number;
  /** aside `px-*` */
  sidebarPadX: number;
  /** aside `gap-*`: between the photo spacer, Contact, and the section stack. */
  sidebarGap: number;
  /** main `p-*` */
  mainPad: number;
  /** main `gap-*`: added on top of each section's own `mb-10`. */
  mainGap: number;
};

export const MODERN_LAYOUT: Record<ResumeDensity, ModernLayout> = {
  compact: { sidebarPadY: 20, sidebarPadX: 16, sidebarGap: 20, mainPad: 20, mainGap: 20 },
  standard: { sidebarPadY: 32, sidebarPadX: 24, sidebarGap: 28, mainPad: 32, mainGap: 28 },
  spacious: { sidebarPadY: 40, sidebarPadX: 32, sidebarGap: 36, mainPad: 40, mainGap: 36 },
};

/** Modern's density-independent geometry. */
export const MODERN_FIXED = {
  /** aside `w-[32%]`; also the print sidebar strip in globals.css. */
  sidebarWidthPct: 32,
  /** ResumeHeader `h-40`. */
  headerHeight: 160,
  /** Header name block `px-8`. */
  headerPadX: 32,
  /** The aside's empty block the overlapping avatar sits in. */
  photoSpacer: 64,
  /** Gap between sidebar sections (below Contact). */
  sidebarSectionGap: 24,
  /** `mb-10` on Summary/Experience/Education. */
  mainSectionMargin: 40,
} as const;

// ---------------------------------------------------------------------------
// Single-column templates (Executive, Compact, Cambodia)
// ---------------------------------------------------------------------------

export type StackedTemplateId = Exclude<ResumeTemplateId, 'modern'>;

export type StackedLayout = {
  /** Page padding, `p-*` on the template body. */
  pad: number;
  /** Header-to-sections gap, `space-y-*` on the template body. */
  gap: number;
  /** Body text size inherited by anything that does not set its own. */
  fontSize: number;
  /** Unitless line-height inherited with it (Tailwind's `text-*` / `leading-*`). */
  leading: number;
};

const layout = (pad: number, gap: number, fontSize: number, leading: number): StackedLayout => ({
  pad,
  gap,
  fontSize,
  leading,
});

// Tailwind's own line-height ratios, so a density reads like the class it replaced.
const XS = 16 / 12;
const SM = 20 / 14;
const BASE = 1.5;

export const STACKED_LAYOUT: Record<StackedTemplateId, Record<ResumeDensity, StackedLayout>> = {
  executive: {
    compact: layout(32, 16, 12, XS),
    standard: layout(40, 24, 14, SM),
    spacious: layout(48, 32, 16, BASE),
  },
  compact: {
    compact: layout(24, 14, 12, 1.375), // leading-snug
    standard: layout(32, 20, 12, 1.5), // leading-normal
    spacious: layout(40, 24, 14, 1.625), // leading-relaxed
  },
  cambodia: {
    compact: layout(24, 16, 12, XS),
    standard: layout(32, 24, 14, SM),
    spacious: layout(40, 28, 16, BASE),
  },
};

/** Gap between sections inside the stack (`space-y-*` on the section list). */
export const STACKED_SECTION_GAP: Record<StackedTemplateId, number> = {
  executive: 24,
  compact: 16,
  cambodia: 20,
};

// ---------------------------------------------------------------------------
// CSS custom properties
// ---------------------------------------------------------------------------

/** Custom properties for the root of a template; dynamic per density, so set inline. */
export const modernLayoutVars = (l: ModernLayout) =>
  ({
    '--rv-sidebar-pad-y': `${l.sidebarPadY}px`,
    '--rv-sidebar-pad-x': `${l.sidebarPadX}px`,
    '--rv-sidebar-gap': `${l.sidebarGap}px`,
    '--rv-main-pad': `${l.mainPad}px`,
    '--rv-main-gap': `${l.mainGap}px`,
    '--rv-photo-spacer': `${MODERN_FIXED.photoSpacer}px`,
    '--rv-sidebar-section-gap': `${MODERN_FIXED.sidebarSectionGap}px`,
  }) as Record<`--${string}`, string>;

export const stackedLayoutVars = (l: StackedLayout, sectionGap: number) =>
  ({
    '--rv-pad': `${l.pad}px`,
    '--rv-gap': `${l.gap}px`,
    '--rv-font': `${l.fontSize}px`,
    '--rv-leading': `${l.leading}`,
    '--rv-section-gap': `${sectionGap}px`,
  }) as Record<`--${string}`, string>;
