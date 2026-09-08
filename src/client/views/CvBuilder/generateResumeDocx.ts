import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeightRule,
  HorizontalPositionRelativeFrom,
  ImageRun,
  IParagraphOptions,
  LevelFormat,
  LineRuleType,
  Packer,
  Paragraph,
  ParagraphChild,
  ShadingType,
  Tab,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  TextWrappingType,
  VerticalAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';

import { Certification, ResumeData, ThemeConfig } from '@/shared/types';

import {
  AVATAR_SHADOW_PAD,
  DOT_SIZE,
  HEADING_BADGE_SIZE,
  PngAsset,
  renderAvatar,
  renderIcon,
  renderIconBadge,
  renderSwatch,
  renderTimelineDot,
} from './docxAssets';

/**
 * Renders the resume as a .docx that mirrors the printed preview (`ResumePreview`)
 * as closely as Word's layout model allows.
 *
 * Every measurement here is derived from the Tailwind classes on the components in
 * `features/Resume`, converted from CSS pixels at 96dpi. The two must stay in step: if
 * a class changes over there, change the matching constant here.
 */

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/** CSS px -> twips (1440 per inch, 96 CSS px per inch). */
const tw = (cssPx: number) => Math.round(cssPx * 15);
/** CSS px font-size -> half-points, the unit docx `size` uses. */
const hp = (cssPx: number) => Math.round(cssPx * 1.5);
/** CSS px -> whole points, the unit OOXML uses for a border's distance from text. */
const ptSpace = (cssPx: number) => Math.max(0, Math.floor(cssPx * 0.75));
/** CSS px -> eighths of a point, the unit docx `size` uses on a border. */
const borderSize = (cssPx: number) => Math.max(2, Math.round(cssPx * 6));
/** CSS px -> EMU, for floating image offsets. */
const emu = (cssPx: number) => Math.round(cssPx * 9525);

/**
 * A fixed line box, the way CSS `line-height` behaves.
 *
 * This has to be exact rather than `atLeast`: the default theme font is a Khmer face
 * with a natural line height of ~1.87em, so `atLeast` would let every line grow well
 * past the `line-height` the preview lays out with and the two would drift apart down
 * the page. CSS `line-height` is a fixed box too, so exact is also the faithful mapping.
 */
const exactLine = (linePx: number) => ({
  line: tw(linePx),
  lineRule: LineRuleType.EXACT,
});

// ---------------------------------------------------------------------------
// Type scale - Tailwind's font-size/line-height pairs, in CSS px
// ---------------------------------------------------------------------------

const TEXT_XS = { size: hp(12), linePx: 16 };
const TEXT_SM = { size: hp(14), linePx: 20 };
const TEXT_LG = { size: hp(18), linePx: 28 };
const TEXT_XL = { size: hp(20), linePx: 28 };
const TEXT_4XL = { size: hp(36), linePx: 40 };
/** `text-md` is not a Tailwind class, so it falls through to the inherited 16px/1.5. */
const TEXT_INHERITED = { size: hp(16), linePx: 24 };

/**
 * `text-xs` sets a unitless line-height, so arbitrary sizes nested inside it (the
 * `text-[10px]` and `text-[11px]` details in the sidebar) inherit the same ratio.
 */
const xsRatio = (cssPx: number) => ({ size: hp(cssPx), linePx: cssPx * (4 / 3) });

// ---------------------------------------------------------------------------
// Page geometry - the preview page is `w-[210mm] min-h-[297mm]` (A4)
// ---------------------------------------------------------------------------

const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const PAGE_WIDTH_PX = (210 / 25.4) * 96;

const SIDEBAR_PX = PAGE_WIDTH_PX * 0.32; // aside w-[32%]
const SIDEBAR_WIDTH = tw(SIDEBAR_PX);
const MAIN_WIDTH = PAGE_WIDTH - SIDEBAR_WIDTH;

const HEADER_HEIGHT_PX = 160; // header h-40
const HEADER_PAD_X_PX = 32; // header name block px-8

const MAIN_CELL_MARGIN = { top: tw(32), bottom: tw(64), left: tw(32), right: tw(32) }; // main p-8 pb-16
const SIDEBAR_CELL_MARGIN = { top: tw(32), bottom: tw(32), left: tw(24), right: tw(24) }; // aside py-8 px-6

/** Usable width of the main column. */
const MAIN_CONTENT_WIDTH = MAIN_WIDTH - MAIN_CELL_MARGIN.left - MAIN_CELL_MARGIN.right;

const SIDEBAR_SECTION_GAP_PX = 32; // aside gap-8
const MAIN_SECTION_GAP_PX = 40; // section mb-10
const SIDEBAR_PHOTO_SPACER_PX = 80; // aside's `h-20` photo spacer

const CONTACT_ICON_PX = 14; // ContactSection `size={14}`
const CONTACT_GAP_PX = 12; // ContactSection `gap-3`
const HEADING_GAP_PX = 12; // MainSectionHeading `gap-3`

// The preview draws a 2px slate-200 rule at x=13px inside a `pl-2` wrapper, hangs 12px
// dots centred on it, and indents item text by `pl-2 + pl-6` = 32px.
//
// A paragraph border cannot reproduce that: renderers disagree on whether it is
// measured from the paragraph indent or from the first line, and segments only merge
// when every paragraph carries an identical border. So the gutter is a nested table -
// a rule column whose edge draws the line, a column holding the dots, then the text.
const TIMELINE_TEXT_PX = 32;
const TIMELINE_RULE_PX = 14; // centre of the rule, and of the dots
const DOT_TOP_PX = 6; // dot `top-1.5`
const DESC_BULLET_TEXT_PX = 16; // description `[&_ul]:ml-4`, relative to the text column

/** Width of the timeline's text column, i.e. the main column less the gutter. */
const TIMELINE_TEXT_WIDTH = MAIN_CONTENT_WIDTH - tw(TIMELINE_TEXT_PX);

// ---------------------------------------------------------------------------
// Palette (Tailwind slate)
// ---------------------------------------------------------------------------

const SLATE_900 = '0F172A';
const SLATE_800 = '1E293B';
const SLATE_700 = '334155';
const SLATE_600 = '475569';
const SLATE_500 = '64748B';
const SLATE_300 = 'CBD5E1';
const SLATE_200 = 'E2E8F0';
const SLATE_100 = 'F1F5F9';
const WHITE = 'FFFFFF';

const FONT_MAP: Record<string, string> = {
  'var(--font-sans)': 'Khmer OS Content',
  'var(--font-serif)': 'Georgia',
  'var(--font-mono)': 'Courier New',
};

/** Canvas font stacks matching `globals.css`, used when painting the avatar initial. */
const CANVAS_FONT_MAP: Record<string, string> = {
  'var(--font-sans)': "'Khmer OS Content', 'Kantumruy Pro', system-ui, sans-serif",
  'var(--font-serif)': "Georgia, 'Times New Roman', serif",
  'var(--font-mono)': "'Courier New', Courier, monospace",
};

const toHex = (color: string) => color.replace('#', '').toUpperCase();

/**
 * Flattens a Tailwind `opacity-*` text colour against its backdrop. Word has no text
 * opacity, so the preview's translucent slate is pre-mixed here instead.
 */
const fade = (fg: string, bg: string, alpha: number) => {
  const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [fr, fg2, fb] = channels(fg);
  const [br, bg2, bb] = channels(bg);
  const mix = (a: number, b: number) =>
    Math.round(a * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  return `${mix(fr, br)}${mix(fg2, bg2)}${mix(fb, bb)}`.toUpperCase();
};

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

const isKhmer = (str?: string) => Boolean(str && /[ក-៿᧠-᧿]/.test(str));

/** `uppercase` and `tracking-*` are dropped for Khmer, matching the preview. */
const cased = (text: string) => (isKhmer(text) ? text : text.toUpperCase());
const tracked = (text: string, spacing: number) => (isKhmer(text) ? undefined : spacing);

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: WHITE } as const;
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
/** Word defaults `insideHorizontal`/`insideVertical` to a visible rule, so clear them too. */
const NO_TABLE_BORDERS = { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

const BULLET_REF = 'preview-bullet';
/** A real `<w:tab/>`; a literal tab inside `<w:t>` is not a tab stop in Word. */
const tab = (): ParagraphChild => new TextRun({ children: [new Tab()] });

const normalizeCertification = (cert: Certification | string): Certification =>
  typeof cert === 'string' ? { name: cert } : cert;

const image = (asset: PngAsset) =>
  new ImageRun({
    type: 'png',
    data: asset.data,
    transformation: { width: asset.width, height: asset.height },
  });

/** An empty paragraph that adds no height of its own. */
const spacerParagraph = () =>
  new Paragraph({ spacing: { before: 0, after: 0, ...exactLine(1) }, run: { size: 2 } });

// ---------------------------------------------------------------------------
// Paragraph plumbing
// ---------------------------------------------------------------------------

/**
 * Sections are assembled as plain option objects rather than `Paragraph`s so the
 * trailing gap (Tailwind's `space-y-*` / `gap-*`, which never applies after the last
 * child) can be attached once a block is known to be last.
 */
type Spec = IParagraphOptions;

const withAfter = (spec: Spec, afterPx: number): Spec => ({
  ...spec,
  spacing: { ...spec.spacing, after: tw(afterPx) },
});

const withBefore = (spec: Spec, beforePx: number): Spec => ({
  ...spec,
  spacing: { ...spec.spacing, before: tw(beforePx) },
});

const breakBefore =
  (shouldBreak?: boolean) =>
  (spec: Spec): Spec =>
    shouldBreak ? { ...spec, pageBreakBefore: true } : spec;

/** Puts `gapPx` after each block but the last, like `space-y-*`. */
const spaced = (blocks: Spec[][], gapPx: number | ((idx: number) => number)): Spec[][] =>
  blocks.map((block, idx) => {
    if (!block.length || idx === blocks.length - 1) return block;
    const gap = typeof gapPx === 'number' ? gapPx : gapPx(idx);
    return [...block.slice(0, -1), withAfter(block[block.length - 1], gap)];
  });

const stack = (blocks: Spec[][], gapPx: number): Spec[] => spaced(blocks, gapPx).flat();

/** Joins sections, spacing them by putting `gapPx` before each heading but the first. */
const joinSections = (sections: Spec[][], gapPx: number): Spec[] =>
  sections
    .filter((section) => section.length > 0)
    .flatMap((section, idx) =>
      idx === 0 ? section : [withBefore(section[0], gapPx), ...section.slice(1)]
    );

type LineOptions = {
  text?: string;
  children?: ParagraphChild[];
  bold?: boolean;
  italics?: boolean;
  size: number;
  /** Line height in CSS px, from the element's type scale or `leading-*`. */
  linePx: number;
  color: string;
  /** Letter-spacing in twips, from `tracking-*`. */
  characterSpacing?: number;
  afterPx?: number;
};

const line = (opts: LineOptions): Spec => ({
  spacing: { after: tw(opts.afterPx ?? 0), ...exactLine(opts.linePx) },
  children:
    opts.children ??
    [
      new TextRun({
        text: opts.text ?? '',
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size,
        color: opts.color,
        characterSpacing: opts.characterSpacing,
      }),
    ],
});

// ---------------------------------------------------------------------------
// Rich text (RichTextEditor / AI output) -> paragraphs
// ---------------------------------------------------------------------------

type RichTextStyle = {
  size: number;
  color: string;
  /** Line height in CSS px, from the container's type scale or `leading-*`. */
  linePx: number;
  /**
   * `<ul>` marker geometry. Tailwind's preflight strips list styling, so markers only
   * appear where a component re-adds `list-disc` - which today is only the Experience
   * description. Leave undefined to render list items as plain lines, which is what
   * the preview does for `<ol>` (including Quill's `<ol><li data-list="bullet">`).
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
const htmlToRuns = (html: string, size: number, color: string): ParagraphChild[] => {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return Array.from(doc.body.childNodes).flatMap((node) => inlineRuns(node, size, color, NO_FORMAT));
};

const BLOCK_TAGS = ['li', 'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];

/**
 * Walks a rich-text fragment into paragraph specs. Preflight zeroes the margins on
 * `p`, `h1`-`h6`, `blockquote`, `ul` and `ol`, so blocks stack with no gap unless the
 * container adds one - hence `after: 0` everywhere below.
 */
const htmlToSpecs = (html: string, style: RichTextStyle): Spec[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const specs: Spec[] = [];

  const spacing = { after: 0, ...exactLine(style.linePx) };

  const push = (children: ParagraphChild[]) => {
    if (children.length) specs.push({ spacing, children });
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
      // Only a real `<ul>` picks up the `list-disc` the Experience section adds; Quill
      // 2 writes bullet lists as `<ol><li data-list="bullet">`, which the preview
      // renders without markers because preflight has already cleared `list-style`.
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

// ---------------------------------------------------------------------------
// Rasterised assets
// ---------------------------------------------------------------------------

type Assets = {
  avatar: PngAsset;
  phone: PngAsset;
  mail: PngAsset;
  mapPin: PngAsset;
  linkedin: PngAsset;
  globe: PngAsset;
  briefcase: PngAsset;
  graduationCap: PngAsset;
  externalLink: PngAsset;
  dot: PngAsset;
  sidebarBand: PngAsset;
};

const buildAssets = async (
  accentHex: string,
  sidebarHex: string,
  photoUrl: string | undefined,
  initial: string,
  canvasFont: string
): Promise<Assets> => {
  const [
    avatar,
    phone,
    mail,
    mapPin,
    linkedin,
    globe,
    briefcase,
    graduationCap,
    externalLink,
    dot,
    sidebarBand,
  ] = await Promise.all([
      renderAvatar(photoUrl, initial, canvasFont),
      // Phone carries `fill-current`, so it is filled as well as stroked.
      renderIcon('phone', CONTACT_ICON_PX, accentHex, true),
      renderIcon('mail', CONTACT_ICON_PX, accentHex),
      renderIcon('mapPin', CONTACT_ICON_PX, accentHex),
      renderIcon('linkedin', CONTACT_ICON_PX, accentHex),
      renderIcon('globe', CONTACT_ICON_PX, accentHex),
      renderIconBadge('briefcase', accentHex),
      renderIconBadge('graduationCap', accentHex),
      renderIcon('externalLink', 10, accentHex),
      renderTimelineDot(accentHex),
      renderSwatch(sidebarHex),
    ]);
  return {
    avatar, phone, mail, mapPin, linkedin, globe, briefcase, graduationCap, externalLink, dot,
    sidebarBand,
  };
};

// ---------------------------------------------------------------------------
// Headings and shared blocks
// ---------------------------------------------------------------------------

/** `SidebarSectionHeading`: text-sm bold uppercase tracking-[0.15em], rule below. */
const sidebarHeading = (title: string): Spec => ({
  spacing: { after: tw(16), ...exactLine(TEXT_SM.linePx) }, // mb-4
  border: {
    bottom: { style: BorderStyle.SINGLE, size: borderSize(2), color: SLATE_300, space: ptSpace(4) },
  },
  children: [
    new TextRun({
      text: cased(title),
      bold: true,
      size: TEXT_SM.size,
      characterSpacing: tracked(title, tw(0.15 * 14)),
      color: SLATE_800,
    }),
  ],
});

/** `MainSectionHeading`: icon chip, gap-3, text-lg bold uppercase tracking-[0.2em]. */
const mainHeading = (title: string, accent: string, badge: PngAsset): Spec => {
  const textLeftPx = HEADING_BADGE_SIZE + HEADING_GAP_PX;
  return {
    // `flex items-center` makes the chip, not the text, set the row height.
    spacing: { after: tw(24), ...exactLine(HEADING_BADGE_SIZE) }, // mb-6
    indent: { left: tw(textLeftPx), hanging: tw(textLeftPx) },
    tabStops: [{ type: TabStopType.LEFT, position: tw(textLeftPx) }],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: borderSize(2), color: accent, space: ptSpace(8) }, // pb-2
    },
    children: [
      image(badge),
      tab(),
      new TextRun({
        text: cased(title),
        bold: true,
        size: TEXT_LG.size,
        characterSpacing: tracked(title, tw(0.2 * 18)),
        color: accent,
      }),
    ],
  };
};

/** `SummarySection`'s heading, which uses neither the accent colour nor an icon. */
const summaryHeading = (title: string): Spec => ({
  spacing: { after: tw(16), ...exactLine(TEXT_LG.linePx) }, // mb-4
  border: {
    // section `pt-4 border-t border-slate-100`
    top: { style: BorderStyle.SINGLE, size: borderSize(1), color: SLATE_100, space: ptSpace(16) },
  },
  children: [
    new TextRun({
      text: cased(title),
      bold: true,
      size: TEXT_LG.size,
      characterSpacing: tracked(title, tw(0.2 * 18)),
      color: SLATE_800,
    }),
  ],
});

/** A `list-disc list-outside ml-4` item with `pl-1`, as used by the sidebar lists. */
const sidebarBullet = (children: ParagraphChild[], linePx: number): Spec => ({
  numbering: { reference: BULLET_REF, level: 0 },
  run: { size: TEXT_XS.size, color: SLATE_700 },
  indent: { left: tw(20), hanging: tw(10) },
  spacing: { after: 0, ...exactLine(linePx) },
  children,
});

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

const SIDEBAR_SECTION_IDS = [
  'skills',
  'certifications',
  'volunteering',
  'languages',
  'otherTraining',
  'references',
  'publications',
];
const MAIN_SECTION_IDS = ['summary', 'experience', 'education'];

/** Main-column sections mix paragraphs with the timeline's nested tables. */
type MainBlock = Spec | Table;

export const generateResumeDocx = async (
  resumeData: ResumeData,
  theme: ThemeConfig,
  sectionOrder: string[],
  sectionTitles: Record<string, string>
): Promise<Blob> => {
  const {
    personalInfo,
    summary,
    experience = [],
    education = [],
    skills = [],
    certifications = [],
    publications = [],
    volunteering = [],
    languages = [],
    otherTraining = [],
    references = [],
  } = resumeData;

  const accent = toHex(theme.primaryColor);
  const sidebarBg = toHex(theme.backgroundColor);
  const font = FONT_MAP[theme.fontFamily] ?? 'Arial';
  const canvasFont = CANVAS_FONT_MAP[theme.fontFamily] ?? 'sans-serif';

  const displayName = personalInfo.name || sectionTitles.yourName || 'Your Name';
  const assets = await buildAssets(
    theme.primaryColor,
    theme.backgroundColor,
    personalInfo.photoUrl,
    personalInfo.name?.charAt(0) || '?',
    canvasFont
  );

  // Sidebar text sits on the themed background, so its `opacity-*` tones mix with it.
  const sidebarFade = (alpha: number) => fade(SLATE_700, sidebarBg, alpha);

  const sortedSidebar = sectionOrder.filter((id) => SIDEBAR_SECTION_IDS.includes(id));
  const sortedMain = sectionOrder.filter((id) => MAIN_SECTION_IDS.includes(id));

  // ---- Sidebar -----------------------------------------------------------

  const contactRow = (icon: PngAsset, children: ParagraphChild[]): Spec => ({
    indent: {
      left: tw(CONTACT_ICON_PX + CONTACT_GAP_PX),
      hanging: tw(CONTACT_ICON_PX + CONTACT_GAP_PX),
    },
    tabStops: [{ type: TabStopType.LEFT, position: tw(CONTACT_ICON_PX + CONTACT_GAP_PX) }],
    run: { size: TEXT_XS.size },
    spacing: { after: 0, ...exactLine(TEXT_XS.linePx) },
    children: [image(icon), tab(), ...children],
  });

  const contactText = (text: string) =>
    new TextRun({ text, size: TEXT_XS.size, color: SLATE_700 });

  const contactLink = (text: string) =>
    new ExternalHyperlink({
      link: `https://${text.replace(/^https?:\/\//, '')}`,
      children: [contactText(text)],
    });

  const contactSection = (): Spec[] => {
    const rows: Spec[][] = [];
    if (personalInfo.phone) rows.push([contactRow(assets.phone, [contactText(personalInfo.phone)])]);
    if (personalInfo.email) rows.push([contactRow(assets.mail, [contactText(personalInfo.email)])]);
    if (personalInfo.address)
      rows.push([contactRow(assets.mapPin, [contactText(personalInfo.address)])]);
    if (personalInfo.linkedin)
      rows.push([contactRow(assets.linkedin, [contactLink(personalInfo.linkedin)])]);
    if (personalInfo.website)
      rows.push([contactRow(assets.globe, [contactLink(personalInfo.website)])]);
    return [sidebarHeading(sectionTitles.contact), ...stack(rows, CONTACT_GAP_PX)];
  };

  const renderSidebarSection = (id: string): Spec[] => {
    switch (id) {
      case 'skills': {
        if (!hasData(skills)) return [];
        const items = skills.filter(Boolean).map((skill) => [
          // li: text-xs font-medium leading-snug
          sidebarBullet([new TextRun({ text: skill, size: TEXT_XS.size, color: SLATE_700 })], 12 * 1.375),
        ]);
        return [sidebarHeading(sectionTitles.skills), ...stack(items, 8)]; // space-y-2
      }

      case 'certifications': {
        if (!hasData(certifications)) return [];
        // Older saved resumes store certifications as plain strings, like the preview allows.
        const items = certifications
          .filter(Boolean)
          .map(normalizeCertification)
          .map((cert) => {
            const meta = cert.expireDate
              ? `Expire: ${cert.expireDate}`
              : cert.year
                ? `Year: ${cert.year}`
                : '';
            return [
              line({ text: cert.name, bold: true, ...TEXT_SM, color: accent, afterPx: 2 }),
              ...(cert.issuer
                ? [
                    line({
                      text: cert.issuer,
                      italics: true,
                      ...TEXT_XS,
                      color: sidebarFade(0.9),
                      afterPx: 2,
                    }),
                  ]
                : []),
              ...(meta ? [line({ text: meta, ...xsRatio(10), color: sidebarFade(0.75) })] : []),
            ];
          });
        return [sidebarHeading(sectionTitles.certifications), ...stack(items, 16)]; // space-y-4
      }

      case 'volunteering': {
        if (!hasData(volunteering)) return [];
        const items = volunteering.filter(Boolean).map((vol) => [
          line({ text: vol.role, bold: true, ...TEXT_SM, color: SLATE_700, afterPx: 2 }),
          ...(vol.organization
            ? [
                line({
                  text: vol.organization,
                  bold: true,
                  ...TEXT_XS,
                  color: sidebarFade(0.9),
                  afterPx: 2,
                }),
              ]
            : []),
          ...(vol.topic
            ? [line({ text: `Topic: ${vol.topic}`, italics: true, ...TEXT_XS, color: sidebarFade(0.8) })]
            : []),
        ]);
        return [sidebarHeading(sectionTitles.volunteering), ...stack(items, 16)]; // space-y-4
      }

      case 'languages': {
        if (!hasData(languages)) return [];
        const items = languages.filter(Boolean).map((lang) => [
          sidebarBullet(
            [
              new TextRun({ text: lang.name, bold: true, size: TEXT_XS.size, color: SLATE_700 }),
              ...(lang.proficiency
                ? [new TextRun({ text: ` (${lang.proficiency})`, size: TEXT_XS.size, color: SLATE_700 })]
                : []),
            ],
            TEXT_XS.linePx
          ),
        ]);
        return [sidebarHeading(sectionTitles.languages), ...stack(items, 8)]; // space-y-2
      }

      case 'otherTraining': {
        if (!hasData(otherTraining)) return [];
        const items = otherTraining.filter(Boolean).map((training) => {
          const content = typeof training === 'string' ? training : training.name;
          return [sidebarBullet(htmlToRuns(content, TEXT_XS.size, SLATE_700), TEXT_XS.linePx)];
        });
        return [sidebarHeading(sectionTitles.otherTraining), ...stack(items, 8)]; // space-y-2
      }

      case 'references': {
        if (!hasData(references)) return [];
        const detail = (label: string, value: string) => {
          const style = xsRatio(11);
          return line({
            ...style,
            color: sidebarFade(0.8),
            afterPx: 2, // space-y-0.5
            children: [
              new TextRun({ text: `${label}: `, bold: true, size: style.size, color: sidebarFade(0.8) }),
              new TextRun({ text: value, size: style.size, color: sidebarFade(0.8) }),
            ],
          });
        };
        const items = references.filter(Boolean).map((ref) => [
          line({ text: ref.name, bold: true, ...TEXT_SM, color: SLATE_700, afterPx: 2 }),
          ...(ref.title || ref.company
            ? [
                line({
                  text: [ref.title, ref.company].filter(Boolean).join(' | '),
                  ...TEXT_XS,
                  color: sidebarFade(0.9),
                  afterPx: 4,
                }),
              ]
            : []),
          ...(ref.phone ? [detail('Phone', ref.phone)] : []),
          ...(ref.email ? [detail('Email', ref.email)] : []),
        ]);
        return [sidebarHeading(sectionTitles.references), ...stack(items, 16)]; // space-y-4
      }

      case 'publications': {
        if (!hasData(publications)) return [];
        const linkStyle = xsRatio(10);
        const items = publications.filter(Boolean).map((pub) => [
          line({ text: pub.title, bold: true, ...TEXT_XS, color: SLATE_700 }),
          ...(pub.date ? [line({ text: pub.date, ...xsRatio(10), color: sidebarFade(0.75) })] : []),
          ...(pub.link
            ? [
                {
                  spacing: { before: tw(2), after: 0, ...exactLine(linkStyle.linePx) }, // mt-0.5
                  children: [
                    new ExternalHyperlink({
                      link: pub.link,
                      children: [
                        new TextRun({
                          text: `${sectionTitles.view} `,
                          size: linkStyle.size,
                          color: sidebarFade(0.8),
                          underline: {},
                        }),
                        image(assets.externalLink),
                      ],
                    }),
                  ],
                } satisfies Spec,
              ]
            : []),
        ]);
        return [sidebarHeading(sectionTitles.publications), ...stack(items, 8)]; // space-y-2
      }

      default:
        return [];
    }
  };

  // ---- Main column -------------------------------------------------------

  /** The `justify-between` title row: title left, dates pushed to the right margin. */
  const timelineTitle = (
    title: string,
    dates: string | undefined,
    afterPx: number
  ): Spec => ({
    tabStops: [{ type: TabStopType.RIGHT, position: TIMELINE_TEXT_WIDTH }],
    spacing: { after: tw(afterPx), ...exactLine(18 * 1.25) }, // h3 leading-tight
    children: [
      new TextRun({ text: title, bold: true, size: TEXT_LG.size, color: SLATE_900 }),
      // Non-breaking spaces keep the date on one line, like `whitespace-nowrap`.
      ...(dates
        ? [
            tab(),
            new TextRun({
              text: dates.replace(/ /g, ' '),
              bold: true,
              size: TEXT_SM.size,
              color: accent,
            }),
          ]
        : []),
    ],
  });

  /**
   * The timeline dot, centred on the rule. It has to float: an inline image would be
   * clipped at the cell edge, and the rule - being a cell border - paints over cell
   * content, whereas a floating image draws above it like the preview's `z-10`.
   */
  const dotParagraph = (): Paragraph =>
    new Paragraph({
      spacing: { before: 0, after: 0, ...exactLine(1) },
      run: { size: 2 },
      children: [
        new ImageRun({
          type: 'png',
          data: assets.dot.data,
          transformation: { width: assets.dot.width, height: assets.dot.height },
          floating: {
            horizontalPosition: {
              relative: HorizontalPositionRelativeFrom.COLUMN,
              offset: -emu(DOT_SIZE / 2),
            },
            verticalPosition: {
              relative: VerticalPositionRelativeFrom.PARAGRAPH,
              offset: emu(DOT_TOP_PX),
            },
            allowOverlap: true,
            layoutInCell: true,
            behindDocument: false,
            wrap: { type: TextWrappingType.NONE },
            zIndex: 3,
          },
        }),
      ],
    });

  /**
   * Lays the timeline out as a nested table: a rule column whose right edge draws the
   * 2px slate-200 line, a dot column, then the item text. One row per item keeps the
   * rule unbroken, and the item gap lives inside the row so the line runs through it.
   */
  const timelineTable = (items: Spec[][]): Table =>
    new Table({
      width: { size: MAIN_CONTENT_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: [
        tw(TIMELINE_RULE_PX),
        tw(TIMELINE_TEXT_PX - TIMELINE_RULE_PX),
        TIMELINE_TEXT_WIDTH,
      ],
      borders: NO_TABLE_BORDERS,
      rows: items.map(
        (item) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: tw(TIMELINE_RULE_PX), type: WidthType.DXA },
                margins: ZERO_MARGINS,
                borders: {
                  ...NO_BORDERS,
                  right: { style: BorderStyle.SINGLE, size: borderSize(2), color: SLATE_200 },
                },
                children: [spacerParagraph()],
              }),
              new TableCell({
                width: { size: tw(TIMELINE_TEXT_PX - TIMELINE_RULE_PX), type: WidthType.DXA },
                margins: ZERO_MARGINS,
                borders: NO_BORDERS,
                children: [dotParagraph()],
              }),
              new TableCell({
                width: { size: TIMELINE_TEXT_WIDTH, type: WidthType.DXA },
                margins: ZERO_MARGINS,
                borders: NO_BORDERS,
                children: item.map((spec) => new Paragraph(spec)),
              }),
            ],
          })
      ),
    });

  const renderMainSection = (id: string): MainBlock[] => {
    switch (id) {
      case 'summary': {
        if (!summary) return [];
        return [
          summaryHeading(sectionTitles.profile),
          // text-sm leading-7 text-slate-600; `prose` is inert (no typography plugin).
          ...htmlToSpecs(summary, { size: TEXT_SM.size, color: SLATE_600, linePx: 28 }),
        ];
      }

      case 'experience': {
        if (!hasData(experience)) return [];
        const entries = experience.filter(Boolean);
        const items = entries.map((exp, idx) => [
          // `print:break-after-page` becomes a break before the next row, which Word
          // honours inside a table where an inline page break is unreliable.
          breakBefore(entries[idx - 1]?.breakPage)(
            timelineTitle(exp.company + (exp.location ? ` - ${exp.location}` : ''), exp.dates, 8) // mb-2
          ),
          line({
            text: cased(exp.role),
            bold: true,
            ...TEXT_INHERITED,
            color: fade(SLATE_700, WHITE, 0.9), // opacity-90
            characterSpacing: tracked(exp.role, tw(0.025 * 16)), // tracking-wide
            afterPx: 8, // mb-2
          }),
          ...htmlToSpecs(exp.description, {
            size: TEXT_SM.size,
            color: SLATE_600,
            linePx: 14 * 1.625, // leading-relaxed
            bullets: { textPx: DESC_BULLET_TEXT_PX, hangingPx: 12, gapPx: 6 }, // ml-4, space-y-1.5
          }),
        ]);
        return [
          mainHeading(sectionTitles.experience, accent, assets.briefcase),
          // space-y-8; a breaking entry's `mb-8` is the same 32px, so it collapses away
          timelineTable(spaced(items, 32)),
        ];
      }

      case 'education': {
        if (!hasData(education)) return [];
        const entries = education.filter(Boolean);
        const items = entries.map((edu, idx) => [
          breakBefore(entries[idx - 1]?.breakPage)(timelineTitle(edu.degree, edu.year, 4)), // mb-1
          line({
            text: edu.school + (edu.location ? `, ${edu.location}` : ''),
            ...TEXT_SM,
            color: SLATE_600,
            afterPx: 4, // mb-1, collapsing with the description's mt-1
          }),
          ...(edu.description
            ? htmlToSpecs(edu.description, { ...TEXT_SM, color: SLATE_500 })
            : []),
        ]);
        return [
          mainHeading(sectionTitles.education, accent, assets.graduationCap),
          // space-y-6, or the wider `mb-8` where an entry breaks the page
          timelineTable(spaced(items, (idx) => (entries[idx].breakPage ? 32 : 24))),
        ];
      }

      default:
        return [];
    }
  };

  /**
   * Joins main sections. A section whose last entry breaks the page pushes the next
   * section's heading onto a new page, the way `break-after-page` does in the preview.
   */
  const joinMainSections = (sections: MainBlock[][], gapPx: number): MainBlock[] => {
    const present = sections
      .map((blocks, idx) => ({ blocks, id: sortedMain[idx] }))
      .filter((section) => section.blocks.length > 0);
    const breaksAfter = (id: string) =>
      id === 'experience'
        ? Boolean(experience.filter(Boolean).at(-1)?.breakPage)
        : id === 'education'
          ? Boolean(education.filter(Boolean).at(-1)?.breakPage)
          : false;

    return present.flatMap(({ blocks }, idx) => {
      if (idx === 0) return blocks;
      const [first, ...rest] = blocks;
      // Every section leads with its heading paragraph, so the gap always has a home.
      if (first instanceof Table) return blocks;
      return [breakBefore(breaksAfter(present[idx - 1].id))(withBefore(first, gapPx)), ...rest];
    });
  };

  // ---- Assembly ----------------------------------------------------------

  const sidebarSpecs: Spec[] = [
    // aside's `h-20` spacer, which the overlapping avatar sits in.
    {
      spacing: {
        after: tw(SIDEBAR_SECTION_GAP_PX),
        ...exactLine(SIDEBAR_PHOTO_SPACER_PX),
      },
      children: [],
    },
    ...joinSections(
      [contactSection(), ...sortedSidebar.map(renderSidebarSection)],
      SIDEBAR_SECTION_GAP_PX
    ),
  ];

  const mainBlocks = joinMainSections(sortedMain.map(renderMainSection), MAIN_SECTION_GAP_PX);

  const toParagraphs = (specs: Spec[]) => specs.map((spec) => new Paragraph(spec));
  const toMainChildren = (blocks: MainBlock[]) => {
    const children = blocks.map((block) => (block instanceof Table ? block : new Paragraph(block)));
    // OOXML requires a paragraph after a table, including as a cell's last child.
    return children.length && children[children.length - 1] instanceof Table
      ? [...children, spacerParagraph()]
      : children;
  };

  const headerCellProps = {
    borders: NO_BORDERS,
    shading: { type: ShadingType.SOLID, color: accent, fill: accent },
    verticalAlign: VerticalAlign.CENTER,
    margins: ZERO_MARGINS,
  };

  // The avatar overlaps the header band and the sidebar below it, so it is anchored to
  // the page rather than flowing inside a cell - mirroring the preview's absolute
  // `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/6` placement.
  const avatarLeftPx = SIDEBAR_PX / 2 - assets.avatar.width / 2;
  const avatarTopPx = HEADER_HEIGHT_PX / 2 - HEADER_HEIGHT_PX / 6 - AVATAR_SHADOW_PAD;
  const avatarRun = new ImageRun({
    type: 'png',
    data: assets.avatar.data,
    transformation: { width: assets.avatar.width, height: assets.avatar.height },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.PAGE,
        offset: emu(avatarLeftPx),
      },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: emu(avatarTopPx) },
      allowOverlap: true,
      layoutInCell: false,
      behindDocument: false,
      wrap: { type: TextWrappingType.NONE },
      zIndex: 5,
    },
  });

  /**
   * The sidebar's background band, standing in for the preview's `print:fixed left-0
   * h-screen w-[32%]` extension so the tint reaches the foot of the page even when the
   * content stops short of it. Drawn behind everything, so the accent header band and
   * the sidebar cell's own shading still paint over the top of it.
   *
   * Anchored in the body rather than in a page header: a header would repeat the band
   * on continuation pages, but it also reserves a line of its own at the top of every
   * page, which would shift the whole layout down. So on a resume that runs past one
   * page, later pages keep the tint only as far as their content reaches.
   */
  const sidebarBandRun = new ImageRun({
    type: 'png',
    data: assets.sidebarBand.data,
    transformation: { width: SIDEBAR_PX, height: PAGE_HEIGHT / 15 },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
      allowOverlap: true,
      layoutInCell: false,
      behindDocument: true,
      wrap: { type: TextWrappingType.NONE },
      zIndex: 0,
    },
  });

  // One table for the whole page: adjacent tables get merged by Word, and a shared
  // column grid is what keeps the header band aligned with the columns beneath it.
  const layoutTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [SIDEBAR_WIDTH, MAIN_WIDTH],
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        height: { value: tw(HEADER_HEIGHT_PX), rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            ...headerCellProps,
            width: { size: SIDEBAR_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0, ...exactLine(1) },
                run: { size: 2 },
                children: [sidebarBandRun, avatarRun],
              }),
            ],
          }),
          new TableCell({
            ...headerCellProps,
            width: { size: MAIN_WIDTH, type: WidthType.DXA },
            margins: { ...ZERO_MARGINS, left: tw(HEADER_PAD_X_PX), right: tw(HEADER_PAD_X_PX) },
            children: toParagraphs([
              line({
                text: cased(displayName),
                bold: true,
                ...TEXT_4XL, // text-4xl font-extrabold
                color: WHITE,
                characterSpacing: tracked(displayName, tw(0.025 * 36)), // tracking-wide
                afterPx: 8, // mb-2
              }),
              ...(personalInfo.title
                ? [
                    line({
                      text: personalInfo.title,
                      ...TEXT_XL,
                      color: fade(WHITE, accent, 0.9), // opacity-90
                    }),
                  ]
                : []),
            ]),
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: SIDEBAR_WIDTH, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: NO_BORDERS,
            shading: { type: ShadingType.SOLID, color: sidebarBg, fill: sidebarBg },
            margins: SIDEBAR_CELL_MARGIN,
            children: toParagraphs(sidebarSpecs),
          }),
          new TableCell({
            width: { size: MAIN_WIDTH, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: NO_BORDERS,
            margins: MAIN_CELL_MARGIN,
            children: mainBlocks.length ? toMainChildren(mainBlocks) : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: TEXT_INHERITED.size, color: SLATE_700 },
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
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0, gutter: 0 },
          },
        },
        // The closing paragraph OOXML requires after a body-level table.
        children: [layoutTable, spacerParagraph()],
      },
    ],
  });

  return Packer.toBlob(document);
};
