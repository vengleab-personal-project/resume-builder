import {
  BorderStyle,
  ExternalHyperlink,
  HeightRule,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Paragraph,
  ParagraphChild,
  ShadingType,
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

import {
  certificationDetail,
  MAIN_SECTION_IDS,
  ResumeViewSection,
  SIDEBAR_SECTION_IDS,
  sectionsIn,
} from '@/shared/lib/resume-view';
import { MODERN_FIXED, MODERN_LAYOUT } from '@/shared/config/resume-layout';

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
} from './assets';
import {
  borderSize,
  breakBefore,
  canvasFont,
  cased,
  createDocument,
  DocxRenderer,
  emu,
  exactLine,
  fade,
  htmlToRuns,
  htmlToSpecs,
  image,
  joinSections,
  keepWithNext,
  line,
  NO_BORDERS,
  NO_TABLE_BORDERS,
  PAGE_HEIGHT_PX,
  PAGE_WIDTH,
  PAGE_WIDTH_PX,
  printSection,
  ptSpace,
  SLATE_100,
  SLATE_200,
  SLATE_300,
  SLATE_500,
  SLATE_600,
  SLATE_700,
  SLATE_800,
  SLATE_900,
  spaced,
  spacerParagraph,
  Spec,
  stack,
  tab,
  TEXT_4XL,
  TEXT_BASE,
  TEXT_LG,
  TEXT_SM,
  TEXT_XL,
  TEXT_XS,
  sized,
  XS_LEADING,
  toHex,
  tracked,
  tw,
  WHITE,
  withBefore,
  ZERO_MARGINS,
} from './common';

/**
 * Word renderer for `ModernTemplate`: the accent header band, the tinted sidebar and
 * the timeline main column, as closely as Word's layout model allows.
 *
 * Spacing that depends on density comes from `MODERN_LAYOUT`, the same table the
 * template's `--rv-*` custom properties are built from. Per-element styling below is
 * derived from the Tailwind classes in `../components`; if a class changes over there,
 * change the matching constant here.
 */

// ---------------------------------------------------------------------------
// Fixed geometry
// ---------------------------------------------------------------------------

const SIDEBAR_PX = PAGE_WIDTH_PX * (MODERN_FIXED.sidebarWidthPct / 100);
const SIDEBAR_WIDTH = tw(SIDEBAR_PX);
const MAIN_WIDTH = PAGE_WIDTH - SIDEBAR_WIDTH;

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
  font: string
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
    renderAvatar(photoUrl, initial, font),
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
// Headings
// ---------------------------------------------------------------------------

/** `SidebarSectionHeading`: text-sm bold uppercase tracking-[0.15em], rule below. */
const sidebarHeading = (title: string): Spec =>
  keepWithNext({
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
  return keepWithNext({
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
  });
};

/** `SummarySection`'s heading, which uses neither the accent colour nor an icon. */
const summaryHeading = (title: string): Spec =>
  keepWithNext({
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
  numbering: { reference: 'preview-bullet', level: 0 },
  run: { size: TEXT_XS.size, color: SLATE_700 },
  indent: { left: tw(20), hanging: tw(10) },
  spacing: { after: 0, ...exactLine(linePx) },
  children,
});

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

/** Main-column sections mix paragraphs with the timeline's nested tables. */
type MainBlock = Spec | Table;

export const renderModernDocx: DocxRenderer = async (view, theme, density) => {
  const { personalInfo, displayName, labels } = view;
  const layout = MODERN_LAYOUT[density];

  // Density-dependent geometry: main `p-*` (plus the last section's own `mb-10` at
  // the foot), aside `py-* px-*`.
  const mainCellMargin = {
    top: tw(layout.mainPad),
    bottom: tw(layout.mainPad + MODERN_FIXED.mainSectionMargin),
    left: tw(layout.mainPad),
    right: tw(layout.mainPad),
  };
  const sidebarCellMargin = {
    top: tw(layout.sidebarPadY),
    bottom: tw(layout.sidebarPadY),
    left: tw(layout.sidebarPadX),
    right: tw(layout.sidebarPadX),
  };
  const mainContentWidth = MAIN_WIDTH - mainCellMargin.left - mainCellMargin.right;
  /** Width of the timeline's text column, i.e. the main column less the gutter. */
  const timelineTextWidth = mainContentWidth - tw(TIMELINE_TEXT_PX);

  const accent = toHex(theme.primaryColor);
  const sidebarBg = toHex(theme.backgroundColor);

  const assets = await buildAssets(
    theme.primaryColor,
    theme.backgroundColor,
    personalInfo.photoUrl,
    personalInfo.name?.charAt(0) || '?',
    canvasFont(theme)
  );

  // Sidebar text sits on the themed background, so its `opacity-*` tones mix with it.
  const sidebarFade = (alpha: number) => fade(SLATE_700, sidebarBg, alpha);

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
    return [sidebarHeading(labels.contact), ...stack(rows, CONTACT_GAP_PX)];
  };

  const renderSidebarSection = (section: ResumeViewSection): Spec[] => {
    switch (section.id) {
      case 'skills': {
        const items = section.content.map((skill) => [
          // li: text-xs font-medium leading-snug
          sidebarBullet([new TextRun({ text: skill, size: TEXT_XS.size, color: SLATE_700 })], 12 * 1.375),
        ]);
        return [sidebarHeading(section.title), ...stack(items, 8)]; // space-y-2
      }

      case 'certifications': {
        const items = section.content.map((cert) => {
          const meta = certificationDetail(cert, labels);
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
            ...(meta ? [line({ text: meta, ...sized(10, XS_LEADING), color: sidebarFade(0.75) })] : []),
          ];
        });
        return [sidebarHeading(section.title), ...stack(items, 16)]; // space-y-4
      }

      case 'volunteering': {
        const items = section.content.map((vol) => [
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
            ? [
                line({
                  text: `${labels.topic}: ${vol.topic}`,
                  italics: true,
                  ...TEXT_XS,
                  color: sidebarFade(0.8),
                }),
              ]
            : []),
        ]);
        return [sidebarHeading(section.title), ...stack(items, 16)]; // space-y-4
      }

      case 'languages': {
        const items = section.content.map((lang) => [
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
        return [sidebarHeading(section.title), ...stack(items, 8)]; // space-y-2
      }

      case 'otherTraining': {
        const items = section.content.map((training) => [
          sidebarBullet(htmlToRuns(training.name, TEXT_XS.size, SLATE_700), TEXT_XS.linePx),
        ]);
        return [sidebarHeading(section.title), ...stack(items, 8)]; // space-y-2
      }

      case 'references': {
        const detail = (label: string, value: string) => {
          const style = sized(11, XS_LEADING);
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
        const items = section.content.map((ref) => [
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
          ...(ref.phone ? [detail(labels.phone, ref.phone)] : []),
          ...(ref.email ? [detail(labels.email, ref.email)] : []),
        ]);
        return [sidebarHeading(section.title), ...stack(items, 16)]; // space-y-4
      }

      case 'publications': {
        const linkStyle = sized(10, XS_LEADING);
        const items = section.content.map((pub) => [
          line({ text: pub.title, bold: true, ...TEXT_XS, color: SLATE_700 }),
          ...(pub.date ? [line({ text: pub.date, ...linkStyle, color: sidebarFade(0.75) })] : []),
          ...(pub.link
            ? [
                {
                  spacing: { before: tw(2), after: 0, ...exactLine(linkStyle.linePx) }, // mt-0.5
                  children: [
                    new ExternalHyperlink({
                      link: pub.link,
                      children: [
                        new TextRun({
                          text: `${labels.view} `,
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
        return [sidebarHeading(section.title), ...stack(items, 8)]; // space-y-2
      }

      default:
        return [];
    }
  };

  // ---- Main column -------------------------------------------------------

  /** The `justify-between` title row: title left, dates pushed to the right margin. */
  // No keep-with-next inside the timeline: in a table cell Word and LibreOffice apply
  // it to the whole row, which drags entire entries onto the next page.
  const timelineTitle = (title: string, dates: string | undefined, afterPx: number): Spec => ({
    tabStops: [{ type: TabStopType.RIGHT, position: timelineTextWidth }],
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
      width: { size: mainContentWidth, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: [
        tw(TIMELINE_RULE_PX),
        tw(TIMELINE_TEXT_PX - TIMELINE_RULE_PX),
        timelineTextWidth,
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
                width: { size: timelineTextWidth, type: WidthType.DXA },
                margins: ZERO_MARGINS,
                borders: NO_BORDERS,
                children: item.map((spec) => new Paragraph(spec)),
              }),
            ],
          })
      ),
    });

  const renderMainSection = (section: ResumeViewSection): MainBlock[] => {
    switch (section.id) {
      case 'summary':
        return [
          summaryHeading(section.title),
          // text-sm leading-7 text-slate-600; `prose` is inert (no typography plugin).
          ...htmlToSpecs(section.content, { size: TEXT_SM.size, color: SLATE_600, linePx: 28 }),
        ];

      case 'experience': {
        const entries = section.content;
        const items = entries.map((exp, idx) => [
          // `print:break-after-page` becomes a break before the next row, which Word
          // honours inside a table where an inline page break is unreliable.
          breakBefore(entries[idx - 1]?.breakPage)(
            timelineTitle(exp.company + (exp.location ? ` - ${exp.location}` : ''), exp.dates, 8) // mb-2
          ),
          line({
            text: cased(exp.role),
            bold: true,
            ...TEXT_BASE, // `text-md` is not a Tailwind class: inherited 16px/1.5
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
          mainHeading(section.title, accent, assets.briefcase),
          // space-y-8; a breaking entry's `mb-8` is the same 32px, so it collapses away
          timelineTable(spaced(items, 32)),
        ];
      }

      case 'education': {
        const entries = section.content;
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
          mainHeading(section.title, accent, assets.graduationCap),
          // space-y-6, or the wider `mb-8` where an entry breaks the page
          timelineTable(spaced(items, (idx) => (entries[idx].breakPage ? 32 : 24))),
        ];
      }

      default:
        return [];
    }
  };

  const mainSections = sectionsIn(view, MAIN_SECTION_IDS);

  /**
   * Joins main sections: each section's `mb-10` plus the column's flex `gap-*` (which
   * do not collapse). A section whose last entry breaks the page pushes the next
   * section's heading onto a new page, the way `break-after-page` does in the preview.
   */
  const joinMainSections = (): MainBlock[] => {
    const gapPx = MODERN_FIXED.mainSectionMargin + layout.mainGap;
    const breaksAfter = (section: ResumeViewSection) =>
      (section.id === 'experience' || section.id === 'education') &&
      Boolean(section.content.at(-1)?.breakPage);

    return mainSections.flatMap((section, idx) => {
      const blocks = renderMainSection(section);
      if (idx === 0 || !blocks.length) return blocks;
      const [first, ...rest] = blocks;
      // Every section leads with its heading paragraph, so the gap always has a home.
      if (first instanceof Table) return blocks;
      return [breakBefore(breaksAfter(mainSections[idx - 1]))(withBefore(first, gapPx)), ...rest];
    });
  };

  // ---- Assembly ----------------------------------------------------------

  const sidebarSpecs: Spec[] = [
    // The aside's photo spacer, which the overlapping avatar sits in.
    {
      spacing: { after: tw(layout.sidebarGap), ...exactLine(MODERN_FIXED.photoSpacer) },
      children: [],
    },
    ...contactSection(),
    ...(() => {
      const sections = joinSections(
        sectionsIn(view, SIDEBAR_SECTION_IDS).map(renderSidebarSection),
        MODERN_FIXED.sidebarSectionGap
      );
      // The aside's flex `gap-*` separates Contact from the section stack.
      return sections.length ? [withBefore(sections[0], layout.sidebarGap), ...sections.slice(1)] : [];
    })(),
  ];

  const mainBlocks = joinMainSections();

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
  const headerHeight = MODERN_FIXED.headerHeight;
  const avatarLeftPx = SIDEBAR_PX / 2 - assets.avatar.width / 2;
  const avatarTopPx = headerHeight / 2 - headerHeight / 6 - AVATAR_SHADOW_PAD;
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
   * The sidebar's background band, standing in for the print stylesheet's sidebar
   * strip on `html` (and the `print:fixed` layer): a full-height tint down the left
   * 32% of every sheet, margins included, however far the content reaches. It lives in
   * the page headers so it repeats on every page; drawn behind everything, so the
   * accent header band and the cells' own shading still paint over it.
   */
  const sidebarBandRun = new ImageRun({
    type: 'png',
    data: assets.sidebarBand.data,
    transformation: { width: SIDEBAR_PX, height: PAGE_HEIGHT_PX },
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
        height: { value: tw(headerHeight), rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            ...headerCellProps,
            width: { size: SIDEBAR_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0, ...exactLine(1) },
                run: { size: 2 },
                children: [avatarRun],
              }),
            ],
          }),
          new TableCell({
            ...headerCellProps,
            width: { size: MAIN_WIDTH, type: WidthType.DXA },
            margins: {
              ...ZERO_MARGINS,
              left: tw(MODERN_FIXED.headerPadX),
              right: tw(MODERN_FIXED.headerPadX),
            },
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
            margins: sidebarCellMargin,
            children: toParagraphs(sidebarSpecs),
          }),
          new TableCell({
            width: { size: MAIN_WIDTH, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: NO_BORDERS,
            margins: mainCellMargin,
            children: mainBlocks.length ? toMainChildren(mainBlocks) : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });

  return createDocument(theme, [
    printSection({
      // Full-bleed: the header band touches the top edge of page one.
      firstTopPx: 0,
      sidePx: 0,
      background: [sidebarBandRun],
      // The closing paragraph OOXML requires after a body-level table.
      children: [layoutTable, spacerParagraph()],
    }),
  ]);
};
