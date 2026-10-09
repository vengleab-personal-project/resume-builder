import {
  AlignmentType,
  BorderStyle,
  HeightRule,
  IBorderOptions,
  Paragraph,
  ParagraphChild,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

import type { ThemeConfig } from '@/shared/types';
import {
  certificationDate,
  ResumeView,
  ResumeViewLabels,
  ResumeViewSection,
} from '@/shared/lib/resume-view';
import {
  STACKED_LAYOUT,
  STACKED_SECTION_GAP,
  StackedLayout,
  StackedTemplateId,
} from '@/shared/config/resume-layout';

import { PngAsset, renderIcon, renderMarker, renderPhotoFrame, IconName } from './assets';
import {
  borderSize,
  breakBefore,
  canvasFont,
  cased,
  createDocument,
  DocxRenderer,
  exactLine,
  hp,
  htmlToRuns,
  htmlToSpecs,
  image,
  keepWithNext,
  line,
  MONO_FONT,
  NO_BORDERS,
  NO_TABLE_BORDERS,
  PAGE_WIDTH,
  printSection,
  ptSpace,
  sized,
  SLATE_200,
  SLATE_300,
  SLATE_50,
  SLATE_100,
  SLATE_500,
  SLATE_600,
  SLATE_700,
  SLATE_800,
  SLATE_900,
  spacerParagraph,
  Spec,
  tab,
  TEXT_3XL,
  TEXT_4XL,
  TEXT_BASE,
  TEXT_SM,
  TEXT_XS,
  toHex,
  tracked,
  tw,
  TypeStyle,
  withAfter,
  withBefore,
  XS_LEADING,
  ZERO_MARGINS,
} from './common';

/**
 * Word renderers for the single-column templates (`ExecutiveAtsTemplate`,
 * `CompactTemplate`, `CambodiaFormalTemplate`).
 *
 * They share one skeleton - page setup from the print stylesheet, a header, then the
 * sections in the view's order - and differ in a `StackedStyle` each, which is that
 * template's classes translated to Word. Density (padding, gaps, body size) comes from
 * `STACKED_LAYOUT`, the table the templates' `--rv-*` properties are built from.
 */

/** A body block: a paragraph, or a table for grids, cards and two-column headers. */
type Block = Spec | Table;

type Ctx = {
  view: ResumeView;
  labels: ResumeViewLabels;
  accent: string;
  /** Text width between the page padding, in twips. */
  width: number;
  /** Inherited body text: the template body's size and line-height. */
  body: TypeStyle;
  /** The body's unitless line-height, for arbitrary sizes nested in it. */
  leading: number;
};

type StackedStyle = {
  /** Renders the header block(s), which end with the header's own bottom rule. */
  header: (ctx: Ctx, theme: ThemeConfig) => Promise<Block[]>;
  /** One section, heading included. */
  section: (section: ResumeViewSection, ctx: Ctx, marker: PngAsset | null) => Block[];
  /** Section heading marker (Compact's square, Cambodia's dot), if any. */
  marker?: { shape: 'square' | 'circle'; size: number };
  /** Extra space above the first section (`pt-*` on the section stack). */
  sectionsPadTop?: number;
};

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const run = (
  text: string,
  style: TypeStyle,
  color: string,
  extra: { bold?: boolean; italics?: boolean; font?: string; characterSpacing?: number } = {}
) => new TextRun({ text, size: style.size, color, ...extra });

/**
 * A `flex justify-between` row: `left` runs, then `right` pushed to the far edge with a
 * right tab. Word wraps the right part onto its own line when the two don't fit, the
 * way `flex-wrap` does.
 */
const splitRow = (
  left: ParagraphChild[],
  right: ParagraphChild[],
  width: number,
  linePx: number,
  afterPx = 0
): Spec => ({
  tabStops: [{ type: TabStopType.RIGHT, position: width }],
  spacing: { after: tw(afterPx), ...exactLine(linePx) },
  children: right.length ? [...left, tab(), ...right] : left,
});

/** `space-y-*` between entries that are each several paragraphs. */
const stackEntries = (entries: Spec[][], gapPx: number): Spec[] =>
  entries.flatMap((entry, idx) =>
    idx === entries.length - 1 || !entry.length
      ? entry
      : [...entry.slice(0, -1), withAfter(entry[entry.length - 1], gapPx)]
  );

/** A rich-text description under an entry, with the template's `[&>ul]` bullets. */
const description = (
  html: string | undefined,
  style: TypeStyle,
  color: string,
  bullets?: { textPx: number; gapPx: number },
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
): Spec[] =>
  html
    ? htmlToSpecs(html, {
        size: style.size,
        linePx: style.linePx,
        color,
        alignment,
        bullets: bullets && { textPx: bullets.textPx, hangingPx: 12, gapPx: bullets.gapPx },
      })
    : [];

/** A `• <html>` line, the way the templates list Other Training. */
const bulletLine = (html: string, style: TypeStyle, color: string): Spec => ({
  spacing: { after: 0, ...exactLine(style.linePx) },
  children: [run('• ', style, color), ...htmlToRuns(html, style.size, color)],
});

/**
 * Skills as `flex-wrap` chips: each a run with the chip's fill and border, separated by
 * the gap. `py-*` and the border sit outside the text, so the line box grows by them.
 */
const chips = (
  skills: string[],
  style: TypeStyle,
  chip: { color: string; fill: string; border: string; bold?: boolean; padX: number; padY: number; gapPx: number }
): Spec => {
  // Non-breaking spaces stand in for `px-*`; Word has no run padding.
  const pad = ' ';
  const children = skills.flatMap((skill, idx) => [
    ...(idx ? [new TextRun({ text: ' ', size: style.size })] : []),
    new TextRun({
      text: `${pad}${skill.replace(/ /g, ' ')}${pad}`,
      size: style.size,
      color: chip.color,
      bold: chip.bold,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: chip.fill },
      border: { style: BorderStyle.SINGLE, size: borderSize(1), color: chip.border, space: 0 },
    }),
  ]);
  return {
    spacing: { after: 0, ...exactLine(style.linePx + 2 * chip.padY + 2 + chip.gapPx) },
    children,
  };
};

/**
 * A CSS grid of `cols` columns with `gapPx` gutters. Cards (`card` set) get their own
 * fill and border, so the gutters are real empty columns/rows rather than cell margins
 * - a filled cell paints its margins too.
 */
const grid = (
  cells: Spec[][],
  cols: number,
  width: number,
  gapPx: number,
  card?: { fill: string; border: string; padPx: number }
): Table => {
  const gap = tw(gapPx);
  const colWidth = Math.floor((width - gap * (cols - 1)) / cols);
  const columnWidths = Array.from({ length: cols * 2 - 1 }, (_, i) => (i % 2 ? gap : colWidth));

  const cardBorder: IBorderOptions | undefined = card && {
    style: BorderStyle.SINGLE,
    size: borderSize(1),
    color: card.border,
  };

  const rows: TableRow[] = [];
  for (let start = 0; start < cells.length; start += cols) {
    if (start) {
      // Row gap: an empty spacer row, so filled cards don't touch.
      rows.push(
        new TableRow({
          height: { value: gap, rule: HeightRule.EXACT },
          children: columnWidths.map(
            (size) =>
              new TableCell({
                width: { size, type: WidthType.DXA },
                borders: NO_BORDERS,
                margins: ZERO_MARGINS,
                children: [spacerParagraph()],
              })
          ),
        })
      );
    }
    const rowCells = cells.slice(start, start + cols);
    rows.push(
      new TableRow({
        cantSplit: true,
        children: columnWidths.map((size, i) => {
          const content = i % 2 ? undefined : rowCells[i / 2];
          const filled = Boolean(card && content);
          return new TableCell({
            width: { size, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders:
              filled && cardBorder
                ? { top: cardBorder, bottom: cardBorder, left: cardBorder, right: cardBorder }
                : NO_BORDERS,
            shading: filled && card ? { type: ShadingType.CLEAR, color: 'auto', fill: card.fill } : undefined,
            margins:
              filled && card
                ? {
                    top: tw(card.padPx),
                    bottom: tw(card.padPx),
                    left: tw(card.padPx),
                    right: tw(card.padPx),
                  }
                : ZERO_MARGINS,
            children: content?.length ? content.map((spec) => new Paragraph(spec)) : [spacerParagraph()],
          });
        }),
      })
    );
  }

  return new Table({
    width: { size: width, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths,
    borders: NO_TABLE_BORDERS,
    rows,
  });
};

/** The usable width of one grid column, for right tabs inside a cell. */
const gridColumnWidth = (width: number, cols: number, gapPx: number, padPx = 0) =>
  Math.floor((width - tw(gapPx) * (cols - 1)) / cols) - 2 * tw(padPx);

/** A heading row: optional marker chip, `gap-2`, then the title - `flex items-center`. */
const headingSpec = (
  title: string,
  opts: {
    style: TypeStyle;
    color: string;
    bold?: boolean;
    trackingEm: number;
    marker: PngAsset | null;
    rule: { color: string; px: number; padPx: number };
    afterPx: number;
  }
): Spec => {
  const markerOffset = opts.marker ? opts.marker.width + 8 : 0;
  return keepWithNext({
    spacing: { after: tw(opts.afterPx), ...exactLine(opts.style.linePx) },
    indent: markerOffset ? { left: tw(markerOffset), hanging: tw(markerOffset) } : undefined,
    tabStops: markerOffset ? [{ type: TabStopType.LEFT, position: tw(markerOffset) }] : undefined,
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: borderSize(opts.rule.px),
        color: opts.rule.color,
        space: ptSpace(opts.rule.padPx),
      },
    },
    children: [
      ...(opts.marker ? [image(opts.marker), tab()] : []),
      new TextRun({
        text: cased(title),
        bold: opts.bold ?? true,
        size: opts.style.size,
        color: opts.color,
        characterSpacing: tracked(title, tw(opts.trackingEm * (opts.style.size / 1.5))),
      }),
    ],
  });
};

/**
 * `break-inside: avoid` on a whole section: every paragraph but the last keeps with
 * the next, and grid rows refuse to split.
 */
const keepTogether = (blocks: Block[]): Block[] =>
  blocks.map((block, idx) =>
    block instanceof Table || idx === blocks.length - 1 ? block : keepWithNext(block)
  );

/** Experience entries: `print:break-after-page` becomes a break before the next one. */
const withEntryBreaks = <T extends { breakPage?: boolean }>(entries: T[], specs: Spec[][]) =>
  specs.map((entry, idx) =>
    entry.length && entries[idx - 1]?.breakPage
      ? [breakBefore(true)(entry[0]), ...entry.slice(1)]
      : entry
  );

/** An inline run of `[icon] text` items, as the contact strips draw them. */
const iconItems = (
  items: { icon: PngAsset; text: string }[],
  style: TypeStyle,
  color: string,
  separator: string
): ParagraphChild[] =>
  items.flatMap((item, idx) => [
    ...(idx ? [run(separator, style, color)] : []),
    image(item.icon),
    run(` ${item.text}`, style, color),
  ]);

// ---------------------------------------------------------------------------
// Executive
// ---------------------------------------------------------------------------

const EXECUTIVE: StackedStyle = {
  async header({ view, accent }, theme) {
    const { personalInfo, displayName } = view;
    const contacts: { name: IconName; text?: string }[] = [
      { name: 'mail', text: personalInfo.email },
      { name: 'phone', text: personalInfo.phone },
      { name: 'mapPin', text: personalInfo.address },
      { name: 'linkedin', text: personalInfo.linkedin },
      { name: 'globe', text: personalInfo.website },
    ];
    const present = contacts.filter((c): c is { name: IconName; text: string } => Boolean(c.text));
    const icons = await Promise.all(present.map((c) => renderIcon(c.name, 12, theme.primaryColor)));

    const specs: Spec[] = [
      line({
        text: displayName,
        bold: true, // font-extrabold
        ...TEXT_4XL,
        color: accent,
        characterSpacing: tracked(displayName, tw(-0.025 * 36)), // tracking-tight
        alignment: AlignmentType.CENTER,
        afterPx: 4, // mb-1
      }),
      ...(personalInfo.title
        ? [
            line({
              text: cased(personalInfo.title),
              bold: true, // font-semibold
              ...TEXT_BASE,
              color: SLATE_700,
              characterSpacing: tracked(personalInfo.title, tw(0.025 * 16)), // tracking-wide
              alignment: AlignmentType.CENTER,
              afterPx: 12, // mb-3
            }),
          ]
        : []),
      ...(present.length
        ? [
            {
              alignment: AlignmentType.CENTER,
              spacing: { after: 0, ...exactLine(TEXT_XS.linePx + 4) }, // text-xs, gap-y-1
              children: iconItems(
                present.map((c, i) => ({ icon: icons[i], text: c.text })),
                TEXT_XS,
                SLATE_600,
                '  ' // gap-x-4
              ),
            } satisfies Spec,
          ]
        : []),
    ];
    // header `border-b pb-5`, accent
    const last = specs[specs.length - 1];
    specs[specs.length - 1] = {
      ...last,
      border: { bottom: { style: BorderStyle.SINGLE, size: borderSize(1), color: accent, space: ptSpace(20) } },
    };
    return specs;
  },

  section(section, ctx) {
    const { accent, width, body } = ctx;
    const heading = headingSpec(section.title, {
      style: TEXT_SM, // text-sm font-bold uppercase tracking-wider
      color: accent,
      trackingEm: 0.05,
      marker: null,
      rule: { color: accent, px: 2, padPx: 4 }, // border-b-2 pb-1
      afterPx: 12, // mb-3
    });
    const relaxedXs = { size: TEXT_XS.size, linePx: 12 * 1.625 };

    switch (section.id) {
      case 'summary':
        return keepTogether([
          heading,
          ...description(
            section.content,
            { size: body.size, linePx: (body.size / 1.5) * 1.625 }, // leading-relaxed
            SLATE_700,
            undefined,
            AlignmentType.JUSTIFIED
          ),
        ]);

      case 'experience': {
        const entries = section.content.map((exp) => [
          keepWithNext(
            splitRow(
              [
                run(exp.role, body, SLATE_900, { bold: true }),
                ...(exp.company ? [run(` — ${exp.company}`, body, SLATE_600)] : []),
              ],
              [run(`${exp.dates}${exp.location ? ` | ${exp.location}` : ''}`, TEXT_XS, SLATE_500)],
              width,
              body.linePx,
              exp.description ? 6 : 0 // space-y-1.5
            )
          ),
          ...description(exp.description, relaxedXs, SLATE_700, { textPx: 20, gapPx: 4 }), // pl-5 space-y-1
        ]);
        return [heading, ...stackEntries(withEntryBreaks(section.content, entries), 16)]; // space-y-4
      }

      case 'education': {
        const entries = section.content.map((edu) => [
          splitRow(
            [
              run(edu.degree, body, SLATE_900, { bold: true }),
              ...(edu.school ? [run(`, ${edu.school}`, body, SLATE_600)] : []),
            ],
            [run(`${edu.year}${edu.location ? ` | ${edu.location}` : ''}`, TEXT_XS, SLATE_500)],
            width,
            body.linePx,
            edu.description ? 4 : 0 // space-y-1
          ),
          ...description(edu.description, relaxedXs, SLATE_600),
        ]);
        return keepTogether([heading, ...stackEntries(entries, 12)]); // space-y-3
      }

      case 'skills':
        return keepTogether([
          heading,
          {
            spacing: { after: 0, ...exactLine(TEXT_XS.linePx + 6) }, // gap-y-1.5
            children: section.content.flatMap((skill, idx) => [
              ...(idx ? [run(' • ', TEXT_XS, SLATE_300)] : []), // ml-2 • gap-x-2
              run(skill, TEXT_XS, SLATE_700),
            ]),
          },
        ]);

      case 'certifications': {
        const colWidth = gridColumnWidth(width, 2, 8);
        const cells = section.content.map((cert) => [
          splitRow(
            [run(cert.name, TEXT_XS, SLATE_800, { bold: true })],
            [run(certificationDate(cert), TEXT_XS, SLATE_500)],
            colWidth,
            TEXT_XS.linePx
          ),
        ]);
        return [heading, grid(cells, 2, width, 8)]; // grid-cols-2 gap-2
      }

      case 'publications':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((pub) => [
              splitRow(
                [run(pub.title, TEXT_XS, SLATE_800)],
                pub.date ? [run(pub.date, TEXT_XS, SLATE_500)] : [],
                width,
                TEXT_XS.linePx
              ),
            ]),
            8 // space-y-2
          ),
        ]);

      case 'languages':
        return keepTogether([
          heading,
          {
            spacing: { after: 0, ...exactLine(TEXT_XS.linePx + 16) }, // flex-wrap gap-4
            children: section.content.flatMap((lang, idx) => [
              ...(idx ? [run('  ', TEXT_XS, SLATE_600)] : []),
              run(`${lang.name}:`, TEXT_XS, SLATE_800, { bold: true }),
              run(` ${lang.proficiency}`, TEXT_XS, SLATE_600),
            ]),
          },
        ]);

      case 'volunteering':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((vol) => [
              splitRow(
                [
                  run(vol.role, TEXT_XS, SLATE_800, { bold: true }),
                  ...(vol.organization ? [run(` — ${vol.organization}`, TEXT_XS, SLATE_600)] : []),
                ],
                vol.topic ? [run(vol.topic, TEXT_XS, SLATE_500)] : [],
                width,
                TEXT_XS.linePx
              ),
            ]),
            8 // space-y-2
          ),
        ]);

      case 'otherTraining':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((tr) => [bulletLine(tr.name, TEXT_XS, SLATE_700)]),
            6 // space-y-1.5
          ),
        ]);

      case 'references': {
        const cells = section.content.map((ref) => {
          const lines: Spec[] = [line({ text: ref.name, bold: true, ...TEXT_XS, color: SLATE_900 })];
          if (ref.title || ref.company)
            lines.push(line({ text: [ref.title, ref.company].filter(Boolean).join(' — '), ...TEXT_XS, color: SLATE_600 }));
          if (ref.email) lines.push(line({ text: ref.email, ...TEXT_XS, color: SLATE_500 }));
          if (ref.phone) lines.push(line({ text: ref.phone, ...TEXT_XS, color: SLATE_500 }));
          return stackEntries(lines.map((l) => [l]), 2); // space-y-0.5
        });
        return [heading, grid(cells, 2, width, 12)]; // grid-cols-2 gap-3
      }

      default:
        return [];
    }
  },
};

// ---------------------------------------------------------------------------
// Compact
// ---------------------------------------------------------------------------

const COMPACT: StackedStyle = {
  marker: { shape: 'square', size: 8 }, // w-2 h-2 rounded-xs

  async header({ view, accent, width, leading }) {
    const { personalInfo, displayName } = view;
    const contacts = [personalInfo.email, personalInfo.phone, personalInfo.address, personalInfo.linkedin].filter(
      Boolean
    );
    const contactStyle = sized(11, leading);
    // The contact strip is content-sized in the preview and usually the wider side.
    const rightWidth = Math.round(width * 0.62);
    const rule = { style: BorderStyle.SINGLE, size: borderSize(2), color: accent }; // border-b-2

    const cell = (size: number, children: Paragraph[], alignRight = false) =>
      new TableCell({
        width: { size, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER, // items-center
        borders: { ...NO_BORDERS, bottom: rule },
        margins: { ...ZERO_MARGINS, bottom: tw(12), left: alignRight ? tw(12) : 0 }, // pb-3, gap-3
        children,
      });

    return [
      new Table({
        width: { size: width, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [width - rightWidth, rightWidth],
        borders: NO_TABLE_BORDERS,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              cell(width - rightWidth, [
                new Paragraph(
                  line({
                    text: displayName,
                    bold: true, // font-black
                    ...TEXT_3XL,
                    color: accent,
                    characterSpacing: tracked(displayName, tw(-0.025 * 30)), // tracking-tight
                  })
                ),
                ...(personalInfo.title
                  ? [
                      new Paragraph({
                        ...line({
                          text: cased(personalInfo.title),
                          bold: true,
                          ...TEXT_XS,
                          color: SLATE_700,
                          characterSpacing: tracked(personalInfo.title, tw(0.05 * 12)), // tracking-wider
                        }),
                        spacing: { before: tw(2), after: 0, ...exactLine(TEXT_XS.linePx) }, // mt-0.5
                      }),
                    ]
                  : []),
              ]),
              cell(
                rightWidth,
                [
                  new Paragraph(
                    line({
                      text: contacts.join(' • '),
                      ...contactStyle,
                      color: SLATE_600,
                      alignment: AlignmentType.RIGHT,
                    })
                  ),
                ],
                true
              ),
            ],
          }),
        ],
      }),
    ];
  },

  section(section, ctx, marker) {
    const { accent, width, body, leading } = ctx;
    const heading = headingSpec(section.title, {
      style: TEXT_XS, // text-xs font-black uppercase tracking-wider
      color: accent,
      trackingEm: 0.05,
      marker,
      rule: { color: SLATE_200, px: 1, padPx: 4 }, // border-b pb-1
      afterPx: 8, // mb-2
    });
    const meta = sized(11, leading); // text-[11px]
    const mono = { font: MONO_FONT };

    switch (section.id) {
      case 'summary':
        return keepTogether([heading, ...description(section.content, TEXT_XS, SLATE_700)]);

      case 'experience': {
        const entries = section.content.map((exp) => [
          keepWithNext(
            splitRow(
              [
                run(exp.role, body, SLATE_900, { bold: true }),
                ...(exp.company ? [run(` @ ${exp.company}`, body, SLATE_700, { bold: true })] : []),
              ],
              [run(`${exp.dates}${exp.location ? ` • ${exp.location}` : ''}`, meta, SLATE_500, mono)],
              width,
              body.linePx,
              exp.description ? 4 : 0 // space-y-1
            )
          ),
          ...description(exp.description, TEXT_XS, SLATE_700, { textPx: 16, gapPx: 2 }), // pl-4 space-y-0.5
        ]);
        return [heading, ...stackEntries(withEntryBreaks(section.content, entries), 12)]; // space-y-3
      }

      case 'skills':
        return keepTogether([
          heading,
          chips(section.content, sized(11, leading), {
            color: SLATE_800,
            fill: SLATE_100,
            border: SLATE_200,
            padX: 8,
            padY: 2, // px-2 py-0.5
            gapPx: 6, // gap-1.5
          }),
        ]);

      case 'education':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((edu) => [
              splitRow(
                [
                  run(edu.degree, body, SLATE_900, { bold: true }),
                  ...(edu.school ? [run(`, ${edu.school}`, body, SLATE_600)] : []),
                ],
                [run(edu.year, meta, SLATE_500, mono)],
                width,
                body.linePx
              ),
            ]),
            8 // space-y-2
          ),
        ]);

      case 'certifications': {
        const colWidth = gridColumnWidth(width, 2, 6);
        const cells = section.content.map((cert) => [
          splitRow(
            [run(cert.name, sized(11, XS_LEADING), SLATE_800)],
            [run(certificationDate(cert), sized(11, XS_LEADING), SLATE_500)],
            colWidth,
            11 * XS_LEADING
          ),
        ]);
        return [heading, grid(cells, 2, width, 6)]; // grid-cols-2 gap-1.5
      }

      case 'publications':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((pub) => [
              splitRow(
                [run(pub.title, TEXT_XS, SLATE_800)],
                pub.date ? [run(pub.date, sized(11, XS_LEADING), SLATE_500, mono)] : [],
                width,
                TEXT_XS.linePx
              ),
            ]),
            4 // space-y-1
          ),
        ]);

      case 'languages':
        return keepTogether([
          heading,
          {
            spacing: { after: 0, ...exactLine(TEXT_XS.linePx + 12) }, // flex-wrap gap-3
            children: section.content.flatMap((lang, idx) => [
              ...(idx ? [run(' ', TEXT_XS, SLATE_700)] : []),
              run(`${lang.name}:`, TEXT_XS, SLATE_700, { bold: true }),
              run(` ${lang.proficiency}`, TEXT_XS, SLATE_700),
            ]),
          },
        ]);

      case 'volunteering':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((vol) => [
              splitRow(
                [run(`${vol.role}${vol.organization ? ` (${vol.organization})` : ''}`, TEXT_XS, SLATE_700)],
                vol.topic ? [run(vol.topic, sized(11, XS_LEADING), SLATE_500)] : [],
                width,
                TEXT_XS.linePx
              ),
            ]),
            4 // space-y-1
          ),
        ]);

      case 'otherTraining':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((tr) => [bulletLine(tr.name, TEXT_XS, SLATE_700)]),
            2 // space-y-0.5
          ),
        ]);

      case 'references': {
        const cells = section.content.map((ref) => [
          line({ text: ref.name, bold: true, ...TEXT_XS, color: SLATE_900 }),
          ...(ref.title || ref.company
            ? [
                line({
                  text: [ref.title, ref.company].filter(Boolean).join(' • '),
                  ...sized(11, XS_LEADING),
                  color: SLATE_600,
                }),
              ]
            : []),
        ]);
        // grid-cols-2 gap-2; cards p-1.5 bg-slate-50 border-slate-200
        return [heading, grid(cells, 2, width, 8, { fill: SLATE_50, border: SLATE_200, padPx: 6 })];
      }

      default:
        return [];
    }
  },
};

// ---------------------------------------------------------------------------
// Cambodia formal
// ---------------------------------------------------------------------------

const PHOTO_WIDTH_PX = 112; // w-28
const HEADER_GAP_PX = 24; // gap-6

const CAMBODIA: StackedStyle = {
  marker: { shape: 'circle', size: 10 }, // w-2.5 h-2.5 rounded-full
  sectionsPadTop: 8, // pt-2

  async header({ view, accent, width, labels }, theme) {
    const { personalInfo, displayName } = view;
    const contacts: { name: IconName; text?: string }[] = [
      { name: 'phone', text: personalInfo.phone },
      { name: 'mail', text: personalInfo.email },
      { name: 'mapPin', text: personalInfo.address },
    ];
    const present = contacts.filter((c): c is { name: IconName; text: string } => Boolean(c.text));
    const [photo, ...icons] = await Promise.all([
      renderPhotoFrame(personalInfo.photoUrl, labels.photoPlaceholder, theme.primaryColor, canvasFont(theme)),
      ...present.map((c) => renderIcon(c.name, 13, theme.primaryColor)),
    ]);

    const photoCell = tw(PHOTO_WIDTH_PX + HEADER_GAP_PX);
    const leftWidth = width - photoCell;
    const half = Math.round(leftWidth / 2);
    const rule = { style: BorderStyle.SINGLE, size: borderSize(2), color: accent }; // border-b-2

    // Personal details: `grid-cols-2 gap-x-4 gap-y-1.5`, as tab-separated pairs.
    const contactRows: Spec[] = [];
    for (let i = 0; i < present.length; i += 2) {
      const pair = present.slice(i, i + 2).map((c, j) => ({ icon: icons[i + j], text: c.text }));
      contactRows.push({
        tabStops: [{ type: TabStopType.LEFT, position: half + tw(8) }],
        spacing: {
          before: i === 0 ? tw(8) : tw(6), // pt-2, gap-y-1.5
          after: 0,
          ...exactLine(TEXT_XS.linePx),
        },
        children: [
          ...iconItems([pair[0]], TEXT_XS, SLATE_700, ''),
          ...(pair[1] ? [tab(), ...iconItems([pair[1]], TEXT_XS, SLATE_700, '')] : []),
        ],
      });
    }

    const left: Spec[] = [
      line({
        text: displayName,
        bold: true,
        ...TEXT_3XL,
        color: SLATE_900,
        characterSpacing: tracked(displayName, tw(-0.025 * 30)), // tracking-tight
        afterPx: 8, // space-y-2
      }),
      ...(personalInfo.title
        ? [
            line({
              text: personalInfo.title,
              bold: true,
              ...TEXT_SM,
              color: accent,
              characterSpacing: tracked(personalInfo.title, tw(0.025 * 14)), // tracking-wide
              afterPx: 0,
            }),
          ]
        : []),
      ...contactRows,
    ];

    return [
      new Table({
        width: { size: width, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [leftWidth, photoCell],
        borders: NO_TABLE_BORDERS,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: leftWidth, type: WidthType.DXA },
                verticalAlign: VerticalAlign.TOP,
                borders: { ...NO_BORDERS, bottom: rule },
                margins: { ...ZERO_MARGINS, bottom: tw(24) }, // pb-6
                children: left.map((spec) => new Paragraph(spec)),
              }),
              new TableCell({
                width: { size: photoCell, type: WidthType.DXA },
                verticalAlign: VerticalAlign.TOP,
                borders: { ...NO_BORDERS, bottom: rule },
                margins: { ...ZERO_MARGINS, left: tw(HEADER_GAP_PX), bottom: tw(24) },
                children: [new Paragraph({ spacing: { after: 0 }, children: [image(photo)] })],
              }),
            ],
          }),
        ],
      }),
    ];
  },

  section(section, ctx, marker) {
    const { accent, width, body } = ctx;
    const heading = headingSpec(section.title, {
      style: TEXT_SM, // text-sm font-bold uppercase tracking-wider
      color: accent,
      trackingEm: 0.05,
      marker,
      rule: { color: accent, px: 2, padPx: 4 }, // border-b-2 pb-1
      afterPx: 12, // mb-3
    });
    const relaxedXs = { size: TEXT_XS.size, linePx: 12 * 1.625 };
    const meta11 = sized(11, XS_LEADING);

    switch (section.id) {
      case 'summary':
        return keepTogether([
          heading,
          ...description(
            section.content,
            { size: TEXT_SM.size, linePx: 14 * 1.625 }, // text-sm leading-relaxed
            SLATE_800,
            undefined,
            AlignmentType.JUSTIFIED
          ),
        ]);

      case 'experience': {
        const entries = section.content.map((exp) => [
          keepWithNext(
            splitRow(
              [
                run(exp.role, TEXT_SM, SLATE_900, { bold: true }),
                ...(exp.company ? [run(` — ${exp.company}`, body, SLATE_700, { bold: true })] : []),
              ],
              [run(`${exp.dates}${exp.location ? ` (${exp.location})` : ''}`, TEXT_XS, SLATE_500)],
              width,
              Math.max(TEXT_SM.linePx, body.linePx),
              exp.description ? 6 : 0 // space-y-1.5
            )
          ),
          ...description(exp.description, relaxedXs, SLATE_700, { textPx: 20, gapPx: 4 }), // pl-5 space-y-1
        ]);
        return [heading, ...stackEntries(withEntryBreaks(section.content, entries), 16)]; // space-y-4
      }

      case 'education': {
        const entries = section.content.map((edu) => [
          splitRow(
            [
              run(edu.degree, TEXT_SM, SLATE_900, { bold: true }),
              ...(edu.school ? [run(` — ${edu.school}`, body, SLATE_700)] : []),
            ],
            [run(edu.year, TEXT_XS, SLATE_500)],
            width,
            Math.max(TEXT_SM.linePx, body.linePx),
            edu.description ? 4 : 0 // space-y-1
          ),
          ...description(edu.description, TEXT_XS, SLATE_600),
        ]);
        return keepTogether([heading, ...stackEntries(entries, 12)]); // space-y-3
      }

      case 'skills':
        return keepTogether([
          heading,
          chips(section.content, TEXT_XS, {
            color: SLATE_800,
            fill: SLATE_50,
            border: SLATE_200,
            bold: true,
            padX: 10,
            padY: 4, // px-2.5 py-1
            gapPx: 8, // gap-2
          }),
        ]);

      case 'languages': {
        const cells = section.content.map((lang) => [
          line({ text: lang.name, bold: true, ...TEXT_XS, color: SLATE_900 }),
          ...(lang.proficiency ? [line({ text: lang.proficiency, ...meta11, color: SLATE_600 })] : []),
        ]);
        // grid-cols-3 gap-2; cards p-2 rounded bg-slate-50 border
        return [heading, grid(cells, 3, width, 8, { fill: SLATE_50, border: SLATE_200, padPx: 8 })];
      }

      case 'certifications':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((cert) => [
              splitRow(
                [run(`${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`, TEXT_XS, SLATE_900)],
                [run(certificationDate(cert), TEXT_XS, SLATE_500)],
                width,
                TEXT_XS.linePx
              ),
            ]),
            8 // space-y-2
          ),
        ]);

      case 'publications':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((pub) => [
              splitRow(
                [run(pub.title, TEXT_XS, SLATE_900)],
                pub.date ? [run(pub.date, TEXT_XS, SLATE_500)] : [],
                width,
                TEXT_XS.linePx
              ),
            ]),
            6 // space-y-1.5
          ),
        ]);

      case 'volunteering':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((vol) => [
              splitRow(
                [run(`${vol.role}${vol.organization ? ` (${vol.organization})` : ''}`, TEXT_XS, SLATE_900)],
                vol.topic ? [run(vol.topic, TEXT_XS, SLATE_500)] : [],
                width,
                TEXT_XS.linePx
              ),
            ]),
            8 // space-y-2
          ),
        ]);

      case 'otherTraining':
        return keepTogether([
          heading,
          ...stackEntries(
            section.content.map((tr) => [bulletLine(tr.name, TEXT_XS, SLATE_800)]),
            4 // space-y-1
          ),
        ]);

      case 'references': {
        const cells = section.content.map((ref) => [
          line({ text: ref.name, bold: true, ...TEXT_XS, color: SLATE_900 }),
          ...(ref.title || ref.company
            ? [line({ text: [ref.title, ref.company].filter(Boolean).join(' — '), ...meta11, color: SLATE_700 })]
            : []),
          ...(ref.phone ? [line({ text: ref.phone, ...meta11, color: SLATE_500 })] : []),
          ...(ref.email ? [line({ text: ref.email, ...meta11, color: SLATE_500 })] : []),
        ]);
        // grid-cols-2 gap-3; cards p-2.5 rounded-lg border bg-slate-50/50
        return [heading, grid(cells, 2, width, 12, { fill: 'FBFCFD', border: SLATE_200, padPx: 10 })];
      }

      default:
        return [];
    }
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const STYLES: Record<StackedTemplateId, StackedStyle> = {
  executive: EXECUTIVE,
  compact: COMPACT,
  cambodia: CAMBODIA,
};

/** Puts `gapPx` between two blocks, on whichever side is a paragraph. */
const joinBlocks = (groups: Block[][], gapPx: number): Block[] =>
  groups
    .filter((group) => group.length)
    .reduce<Block[]>((out, group) => {
      if (!out.length || !gapPx) return [...out, ...group];
      const prev = out[out.length - 1];
      const [first, ...rest] = group;
      if (!(first instanceof Table)) return [...out, withBefore(first, gapPx), ...rest];
      if (!(prev instanceof Table)) return [...out.slice(0, -1), withAfter(prev, gapPx), ...group];
      return [...out, new Paragraph({ spacing: { after: 0, ...exactLine(gapPx) } }), ...group];
    }, []);

/** A section whose last experience entry breaks the page pushes the next one over. */
const breaksAfter = (section: ResumeViewSection) =>
  section.id === 'experience' && Boolean(section.content.at(-1)?.breakPage);

const renderStacked =
  (id: StackedTemplateId): DocxRenderer =>
  async (view, theme, density) => {
    const style = STYLES[id];
    const layout: StackedLayout = STACKED_LAYOUT[id][density];
    const width = PAGE_WIDTH - 2 * tw(layout.pad);
    const ctx: Ctx = {
      view,
      labels: view.labels,
      accent: toHex(theme.primaryColor),
      width,
      body: { size: hp(layout.fontSize), linePx: layout.fontSize * layout.leading },
      leading: layout.leading,
    };

    const [header, marker] = await Promise.all([
      style.header(ctx, theme),
      style.marker ? renderMarker(style.marker.shape, style.marker.size, theme.primaryColor) : null,
    ]);

    const sections = view.sections.map((section, idx) => {
      const blocks = style.section(section, ctx, marker);
      const previous = view.sections[idx - 1];
      if (!blocks.length || !previous || !breaksAfter(previous) || blocks[0] instanceof Table) return blocks;
      return [breakBefore(true)(blocks[0]), ...blocks.slice(1)];
    });

    const body = joinBlocks(
      [header, joinBlocks(sections, STACKED_SECTION_GAP[id])],
      layout.gap + (style.sectionsPadTop ?? 0)
    );

    const children = body.map((block) => (block instanceof Table ? block : new Paragraph(block)));

    return createDocument(theme, [
      printSection({
        // The template body's `p-*` is the first page's top; later pages start at the
        // 12mm print margin, since padding is not repeated after a page break.
        firstTopPx: layout.pad,
        sidePx: layout.pad,
        // The closing paragraph OOXML requires after a body-level table.
        children: [...children, spacerParagraph()],
      }),
    ]);
  };

export const renderExecutiveDocx = renderStacked('executive');
export const renderCompactDocx = renderStacked('compact');
export const renderCambodiaDocx = renderStacked('cambodia');
