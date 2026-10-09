import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Header,
  ImageRun,
  IParagraphOptions,
  ISectionOptions,
  LevelFormat,
  LineRuleType,
  Paragraph,
  ParagraphChild,
  Tab,
  TextRun,
} from 'docx';

import type { ResumeDensity, ThemeConfig } from '@/shared/types';
import type { ResumeView } from '@/shared/lib/resume-view';
import { isKhmerText } from '@/shared/lib/resume-view';
import { mmToPx, PAGE_MARGIN_Y_MM } from '@/shared/config/resume-layout';

import type { PngAsset } from './assets';

/**
 * Building blocks shared by every template's Word renderer. Each renderer mirrors one
 * preview template in `../templates`; the numbers come from the Tailwind classes there
 * (converted from CSS px at 96dpi) and from `shared/config/resume-layout.ts`.
 */

/** Builds one template's .docx from the same view model and density as the preview. */
export type DocxRenderer = (view: ResumeView, theme: ThemeConfig, density: ResumeDensity) => Promise<Document>;

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/** CSS px -> twips (1440 per inch, 96 CSS px per inch). */
export const tw = (cssPx: number) => Math.round(cssPx * 15);
/** CSS px font-size -> half-points, the unit docx `size` uses. */
export const hp = (cssPx: number) => Math.round(cssPx * 1.5);
/** CSS px -> whole points, the unit OOXML uses for a border's distance from text. */
export const ptSpace = (cssPx: number) => Math.max(0, Math.floor(cssPx * 0.75));
/** CSS px -> eighths of a point, the unit docx `size` uses on a border. */
export const borderSize = (cssPx: number) => Math.max(2, Math.round(cssPx * 6));
/** CSS px -> EMU, for floating image offsets. */
export const emu = (cssPx: number) => Math.round(cssPx * 9525);

/**
 * A fixed line box, the way CSS `line-height` behaves.
 *
 * This has to be exact rather than `atLeast`: the default theme font is a Khmer face
 * with a natural line height of ~1.87em, so `atLeast` would let every line grow well
 * past the `line-height` the preview lays out with and the two would drift apart down
 * the page. CSS `line-height` is a fixed box too, so exact is also the faithful mapping.
 */
export const exactLine = (linePx: number) => ({
  line: tw(linePx),
  lineRule: LineRuleType.EXACT,
});

// ---------------------------------------------------------------------------
// Type scale - Tailwind's font-size/line-height pairs, in CSS px
// ---------------------------------------------------------------------------

export type TypeStyle = { size: number; linePx: number };

export const TEXT_XS: TypeStyle = { size: hp(12), linePx: 16 };
export const TEXT_SM: TypeStyle = { size: hp(14), linePx: 20 };
export const TEXT_BASE: TypeStyle = { size: hp(16), linePx: 24 };
export const TEXT_LG: TypeStyle = { size: hp(18), linePx: 28 };
export const TEXT_XL: TypeStyle = { size: hp(20), linePx: 28 };
export const TEXT_2XL: TypeStyle = { size: hp(24), linePx: 32 };
export const TEXT_3XL: TypeStyle = { size: hp(30), linePx: 36 };
export const TEXT_4XL: TypeStyle = { size: hp(36), linePx: 40 };

/**
 * An arbitrary size (`text-[11px]`) sets no line-height of its own, so it inherits the
 * unitless ratio of the nearest `text-*` / `leading-*` above it.
 */
export const sized = (cssPx: number, leading: number): TypeStyle => ({
  size: hp(cssPx),
  linePx: cssPx * leading,
});

/** Tailwind `text-xs`'s ratio, the usual parent of the `text-[10px]`/`text-[11px]` details. */
export const XS_LEADING = 4 / 3;

// ---------------------------------------------------------------------------
// Page geometry - A4, with the print stylesheet's page margins
// ---------------------------------------------------------------------------

export const PAGE_WIDTH = 11906;
export const PAGE_HEIGHT = 16838;
export const PAGE_WIDTH_PX = (210 / 25.4) * 96;
export const PAGE_HEIGHT_PX = (297 / 25.4) * 96;

const PAGE_MARGIN_Y_PX = mmToPx(PAGE_MARGIN_Y_MM);

/** An empty paragraph exactly `heightPx` tall, carrying any floating images given. */
const fixedHeightParagraph = (heightPx: number, children: ParagraphChild[] = []) =>
  new Paragraph({
    spacing: { before: 0, after: 0, ...exactLine(Math.max(heightPx, 0.1)) },
    run: { size: 2 },
    children,
  });

/**
 * Page setup reproducing the print stylesheet: `@page { margin: 12mm 0 }` with
 * `@page :first { margin-top: 0 }`, so Word paginates where the PDF does.
 *
 * Word has one top margin per section, so the different first-page top is done with
 * headers instead: the top margin is 0 and a header of exactly the wanted height pushes
 * the body down - `firstTopPx` on page one, 12mm on every later page. The headers also
 * anchor `background` (floating, behind the text) so it repeats on every page, the way
 * the print stylesheet's page background does.
 */
export const printSection = ({
  firstTopPx,
  sidePx,
  background = [],
  children,
}: {
  firstTopPx: number;
  sidePx: number;
  background?: ParagraphChild[];
  children: ISectionOptions['children'];
}): ISectionOptions => ({
  properties: {
    titlePage: true,
    page: {
      size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
      margin: {
        top: 0,
        bottom: tw(PAGE_MARGIN_Y_PX),
        left: tw(sidePx),
        right: tw(sidePx),
        header: 0,
        footer: 0,
        gutter: 0,
      },
    },
  },
  headers: {
    first: new Header({ children: [fixedHeightParagraph(firstTopPx, background)] }),
    default: new Header({ children: [fixedHeightParagraph(PAGE_MARGIN_Y_PX, background)] }),
  },
  children,
});

// ---------------------------------------------------------------------------
// Palette (Tailwind slate)
// ---------------------------------------------------------------------------

export const SLATE_900 = '0F172A';
export const SLATE_800 = '1E293B';
export const SLATE_700 = '334155';
export const SLATE_600 = '475569';
export const SLATE_500 = '64748B';
export const SLATE_400 = '94A3B8';
export const SLATE_300 = 'CBD5E1';
export const SLATE_200 = 'E2E8F0';
export const SLATE_100 = 'F1F5F9';
export const SLATE_50 = 'F8FAFC';
export const WHITE = 'FFFFFF';

const FONT_MAP: Record<string, string> = {
  'var(--font-sans)': 'Khmer OS Content',
  'var(--font-serif)': 'Georgia',
  'var(--font-mono)': 'Courier New',
};

/** Canvas font stacks matching `globals.css`, used when painting text into bitmaps. */
const CANVAS_FONT_MAP: Record<string, string> = {
  'var(--font-sans)': "'Khmer OS Content', 'Kantumruy Pro', system-ui, sans-serif",
  'var(--font-serif)': "Georgia, 'Times New Roman', serif",
  'var(--font-mono)': "'Courier New', Courier, monospace",
};

export const wordFont = (theme: ThemeConfig) => FONT_MAP[theme.fontFamily] ?? 'Arial';
export const canvasFont = (theme: ThemeConfig) => CANVAS_FONT_MAP[theme.fontFamily] ?? 'sans-serif';
/** Tailwind `font-mono`. */
export const MONO_FONT = 'Courier New';

export const toHex = (color: string) => color.replace('#', '').toUpperCase();

/**
 * Flattens a Tailwind `opacity-*` text colour against its backdrop. Word has no text
 * opacity, so the preview's translucent slate is pre-mixed here instead.
 */
export const fade = (fg: string, bg: string, alpha: number) => {
  const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [fr, fg2, fb] = channels(fg);
  const [br, bg2, bb] = channels(bg);
  const mix = (a: number, b: number) =>
    Math.round(a * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  return `${mix(fr, br)}${mix(fg2, bg2)}${mix(fb, bb)}`.toUpperCase();
};

/** `uppercase` and `tracking-*` are dropped for Khmer, matching the preview. */
export const cased = (text: string) => (isKhmerText(text) ? text : text.toUpperCase());
export const tracked = (text: string, spacing: number) => (isKhmerText(text) ? undefined : spacing);

export const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: WHITE } as const;
export const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
/** Word defaults `insideHorizontal`/`insideVertical` to a visible rule, so clear them too. */
export const NO_TABLE_BORDERS = { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

export const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

export const BULLET_REF = 'preview-bullet';
/** A real `<w:tab/>`; a literal tab inside `<w:t>` is not a tab stop in Word. */
export const tab = (): ParagraphChild => new TextRun({ children: [new Tab()] });

export const image = (asset: PngAsset) =>
  new ImageRun({
    type: 'png',
    data: asset.data,
    transformation: { width: asset.width, height: asset.height },
  });

/** An empty paragraph that adds no height of its own. */
export const spacerParagraph = () =>
  new Paragraph({ spacing: { before: 0, after: 0, ...exactLine(1) }, run: { size: 2 } });

/** Document defaults: the theme font, Tailwind's zero-margin reset, one bullet list. */
export const createDocument = (theme: ThemeConfig, sections: ISectionOptions[]) =>
  new Document({
    styles: {
      default: {
        document: {
          run: { font: wordFont(theme), size: TEXT_BASE.size, color: SLATE_700 },
          // Word's built-in Normal style adds space after every paragraph; the preview
          // relies on Tailwind's reset instead, so spacing is only ever explicit here.
          paragraph: { spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLET_REF,
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT },
          ],
        },
      ],
    },
    sections,
  });

// ---------------------------------------------------------------------------
// Paragraph plumbing
// ---------------------------------------------------------------------------

/**
 * Sections are assembled as plain option objects rather than `Paragraph`s so the
 * trailing gap (Tailwind's `space-y-*` / `gap-*`, which never applies after the last
 * child) can be attached once a block is known to be last.
 */
export type Spec = IParagraphOptions;

export const withAfter = (spec: Spec, afterPx: number): Spec => ({
  ...spec,
  spacing: { ...spec.spacing, after: tw(afterPx) },
});

export const withBefore = (spec: Spec, beforePx: number): Spec => ({
  ...spec,
  spacing: { ...spec.spacing, before: tw(beforePx) },
});

export const breakBefore =
  (shouldBreak?: boolean) =>
  (spec: Spec): Spec =>
    shouldBreak ? { ...spec, pageBreakBefore: true } : spec;

/** Keeps a heading or entry header on the same page as what follows (`break-after: avoid`). */
export const keepWithNext = (spec: Spec): Spec => ({ ...spec, keepNext: true, keepLines: true });

/** Puts `gapPx` after each block but the last, like `space-y-*`. */
export const spaced = (blocks: Spec[][], gapPx: number | ((idx: number) => number)): Spec[][] =>
  blocks.map((block, idx) => {
    if (!block.length || idx === blocks.length - 1) return block;
    const gap = typeof gapPx === 'number' ? gapPx : gapPx(idx);
    return [...block.slice(0, -1), withAfter(block[block.length - 1], gap)];
  });

export const stack = (blocks: Spec[][], gapPx: number): Spec[] => spaced(blocks, gapPx).flat();

/** Joins sections, spacing them by putting `gapPx` before each heading but the first. */
export const joinSections = (sections: Spec[][], gapPx: number): Spec[] =>
  sections
    .filter((section) => section.length > 0)
    .flatMap((section, idx) =>
      idx === 0 ? section : [withBefore(section[0], gapPx), ...section.slice(1)]
    );

export type LineOptions = {
  text?: string;
  children?: ParagraphChild[];
  bold?: boolean;
  italics?: boolean;
  size: number;
  /** Line height in CSS px, from the element's type scale or `leading-*`. */
  linePx: number;
  color: string;
  font?: string;
  /** Letter-spacing in twips, from `tracking-*`. */
  characterSpacing?: number;
  afterPx?: number;
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
};

export const line = (opts: LineOptions): Spec => ({
  spacing: { after: tw(opts.afterPx ?? 0), ...exactLine(opts.linePx) },
  alignment: opts.alignment,
  children:
    opts.children ??
    [
      new TextRun({
        text: opts.text ?? '',
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size,
        color: opts.color,
        font: opts.font,
        characterSpacing: opts.characterSpacing,
      }),
    ],
});

// ---------------------------------------------------------------------------
// Rich text (RichTextEditor / AI output) -> paragraphs
// ---------------------------------------------------------------------------

export type RichTextStyle = {
  size: number;
  color: string;
  /** Line height in CSS px, from the container's type scale or `leading-*`. */
  linePx: number;
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  /**
   * `<ul>` marker geometry. Tailwind's preflight strips list styling, so markers only
   * appear where a template re-adds `list-disc` on the description. Leave undefined to
   * render list items as plain lines, which is what the preview does for `<ol>`
   * (including Quill's `<ol><li data-list="bullet">`).
   */
  bullets?: { textPx: number; hangingPx: number; gapPx: number };
};

/** Collapses `&nbsp;` the way `normalizeHtmlSpaces` does before the preview renders. */
const plainText = (node: ChildNode) => (node.textContent || '').replace(/ /g, ' ');

type RunFormat = { bold: boolean; italics: boolean; underline: boolean };
const NO_FORMAT: RunFormat = { bold: false, italics: false, underline: false };

const inlineRuns = (
  node: ChildNode,
  size: number,
  color: string,
  format: RunFormat
): ParagraphChild[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = plainText(node);
    return text
      ? [
          new TextRun({
            text,
            bold: format.bold || undefined,
            italics: format.italics || undefined,
            underline: format.underline ? {} : undefined,
            size,
            color,
          }),
        ]
      : [];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'br') return [new TextRun({ text: '', break: 1 })];

  const next: RunFormat = {
    bold: format.bold || tag === 'strong' || tag === 'b',
    italics: format.italics || tag === 'em' || tag === 'i',
    underline: format.underline || tag === 'u',
  };
  const children = Array.from(el.childNodes).flatMap((child) =>
    inlineRuns(child, size, color, next)
  );

  // Preflight makes anchors inherit colour and decoration, so a link keeps the
  // surrounding text's styling and is only a link functionally.
  if (tag === 'a') {
    const href = el.getAttribute('href');
    if (href && children.length) return [new ExternalHyperlink({ link: href, children })];
  }
  return children;
};

/** Flattens an inline-only fragment into runs (Other Training entries). */
export const htmlToRuns = (html: string, size: number, color: string): ParagraphChild[] => {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return Array.from(doc.body.childNodes).flatMap((node) => inlineRuns(node, size, color, NO_FORMAT));
};

const BLOCK_TAGS = ['li', 'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];

/**
 * Walks a rich-text fragment into paragraph specs. Preflight zeroes the margins on
 * `p`, `h1`-`h6`, `blockquote`, `ul` and `ol`, so blocks stack with no gap unless the
 * container adds one - hence `after: 0` everywhere below.
 */
export const htmlToSpecs = (html: string, style: RichTextStyle): Spec[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const specs: Spec[] = [];

  const spacing = { after: 0, ...exactLine(style.linePx) };

  const push = (children: ParagraphChild[]) => {
    if (children.length) specs.push({ spacing, alignment: style.alignment, children });
  };

  const pushBullet = (children: ParagraphChild[], beforePx: number) => {
    const bullets = style.bullets;
    if (!children.length || !bullets) return;
    specs.push({
      numbering: { reference: BULLET_REF, level: 0 },
      // The marker takes its size and colour from the paragraph mark, not the runs.
      run: { size: style.size, color: style.color },
      indent: { left: tw(bullets.textPx), hanging: tw(bullets.hangingPx) },
      spacing: { ...spacing, before: beforePx ? tw(beforePx) : undefined },
      children,
    });
  };

  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (plainText(node).trim()) push(inlineRuns(node, style.size, style.color, NO_FORMAT));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'ul' || tag === 'ol') {
      // Only a real `<ul>` picks up the `list-disc` a template adds; Quill 2 writes
      // bullet lists as `<ol><li data-list="bullet">`, which the preview renders
      // without markers because preflight has already cleared `list-style`.
      const bulleted = tag === 'ul' && Boolean(style.bullets);
      Array.from(el.children).forEach((li, idx) => {
        const children = Array.from(li.childNodes).flatMap((child) =>
          inlineRuns(child, style.size, style.color, NO_FORMAT)
        );
        if (bulleted) pushBullet(children, idx === 0 ? 0 : (style.bullets?.gapPx ?? 0));
        else push(children);
      });
      return;
    }

    if (BLOCK_TAGS.includes(tag)) {
      push(
        Array.from(el.childNodes).flatMap((child) =>
          inlineRuns(child, style.size, style.color, NO_FORMAT)
        )
      );
      return;
    }

    // Bare inline content at block level - keep it on its own line.
    push(inlineRuns(node, style.size, style.color, NO_FORMAT));
  };

  Array.from(doc.body.childNodes).forEach(walk);
  return specs;
};
