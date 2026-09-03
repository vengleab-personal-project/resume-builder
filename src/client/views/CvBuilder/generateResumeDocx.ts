import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  Packer,
  Paragraph,
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

import { Certification, ResumeData, ThemeConfig } from '@/shared/types';

/**
 * Renders the resume as a .docx that mirrors the on-screen preview:
 * a full-width colored header band over a two-column body (shaded sidebar + white main column).
 */

// A4 in twips, matching the 210mm preview page.
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const SIDEBAR_WIDTH = Math.round(PAGE_WIDTH * 0.32);
const MAIN_WIDTH = PAGE_WIDTH - SIDEBAR_WIDTH;
const MAIN_CELL_MARGIN = { top: 240, bottom: 240, left: 340, right: 240 };
const SIDEBAR_CELL_MARGIN = { top: 240, bottom: 240, left: 280, right: 240 };
// Right tab stop for dates, mirroring the preview's justify-between rows.
const MAIN_TAB_STOP = MAIN_WIDTH - MAIN_CELL_MARGIN.left - MAIN_CELL_MARGIN.right;

// Slate palette used by the preview.
const SLATE_900 = '0F172A';
const SLATE_800 = '1E293B';
const SLATE_700 = '334155';
const SLATE_600 = '475569';
const SLATE_500 = '64748B';
const SLATE_300 = 'CBD5E1';
const WHITE = 'FFFFFF';

// Word has no Geist, so fall back to the nearest widely-installed face.
const FONT_MAP: Record<string, string> = {
  'var(--font-sans)': 'Arial',
  'var(--font-serif)': 'Georgia',
  'var(--font-mono)': 'Courier New',
};

const hasData = (arr: unknown[] | undefined) => Array.isArray(arr) && arr.filter(Boolean).length > 0;

const toHex = (color: string) => color.replace('#', '').toUpperCase();

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: WHITE } as const;
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

const EMPTY_LINE = () => new Paragraph({ text: '', spacing: { after: 80 } });

const normalizeCertification = (cert: Certification | string): Certification =>
  typeof cert === 'string' ? { name: cert } : cert;

/** Decodes the editor's data-URL photo into something ImageRun accepts. */
const parsePhoto = (photoUrl?: string) => {
  const match = /^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/i.exec(photoUrl || '');
  if (!match) return null;
  const format = match[1].toLowerCase();
  return {
    type: (format === 'jpeg' || format === 'jpg' ? 'jpg' : format) as 'png' | 'jpg' | 'gif' | 'bmp',
    data: match[2],
  };
};

/** Walks a rich-text HTML fragment (from RichTextEditor) into docx Paragraphs. */
const htmlToParagraphs = (html: string, textColor: string, size: number): Paragraph[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const paragraphs: Paragraph[] = [];

  const runsFromNode = (node: ChildNode, bold = false, italics = false): TextRun[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/ /g, ' ') || '';
      return text ? [new TextRun({ text, bold, italics, size, color: textColor })] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') return [new TextRun({ text: '', break: 1 })];
    const nextBold = bold || tag === 'strong' || tag === 'b';
    const nextItalics = italics || tag === 'em' || tag === 'i';
    return Array.from(el.childNodes).flatMap((child) => runsFromNode(child, nextBold, nextItalics));
  };

  const walkBlock = (node: ChildNode, bulleted: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size, color: textColor })] }));
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'ul' || tag === 'ol') {
      Array.from(el.children).forEach((li) => walkBlock(li, true));
      return;
    }
    if (tag === 'li' || tag === 'p' || tag === 'div') {
      const runs = Array.from(el.childNodes).flatMap((child) => runsFromNode(child));
      if (!runs.length) return;
      paragraphs.push(
        new Paragraph({
          bullet: tag === 'li' && bulleted ? { level: 0 } : undefined,
          spacing: { after: 80, line: 300 },
          children: runs,
        })
      );
      return;
    }
    // Unknown inline element at block level - keep its text as a paragraph.
    const runs = runsFromNode(node);
    if (runs.length) paragraphs.push(new Paragraph({ spacing: { after: 80 }, children: runs }));
  };

  Array.from(doc.body.childNodes).forEach((node) => walkBlock(node, false));
  return paragraphs;
};

/** Sidebar heading: dark text over a light rule, like SidebarSectionHeading. */
const sidebarHeading = (text: string) =>
  new Paragraph({
    spacing: { before: 280, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: SLATE_300 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, characterSpacing: 30, color: SLATE_800 })],
  });

/** Main heading: accent colored text over an accent rule, like MainSectionHeading. */
const mainHeading = (text: string, color: string) =>
  new Paragraph({
    spacing: { before: 320, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 26, characterSpacing: 40, color })],
  });

const line = (
  text: string,
  opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; after?: number } = {}
) =>
  new Paragraph({
    spacing: { after: opts.after ?? 60 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 18,
        color: opts.color ?? SLATE_700,
      }),
    ],
  });

const linkLine = (text: string, url: string, size = 18) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text, style: 'Hyperlink', size })],
      }),
    ],
  });

const bulletLine = (children: TextRun[]) =>
  new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children });

/** Title on the left, dates pushed to the right margin - the preview's justify-between row. */
const titleWithDates = (
  title: string,
  dates: string | undefined,
  accentColor: string,
  titleSize: number
) =>
  new Paragraph({
    spacing: { after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: MAIN_TAB_STOP }],
    children: [
      new TextRun({ text: title, bold: true, size: titleSize, color: SLATE_900 }),
      // Non-breaking spaces keep the date on one line, like the preview's whitespace-nowrap.
      ...(dates ? [new TextRun({ text: `\t${dates.replace(/ /g, ' ')}`, bold: true, size: 18, color: accentColor })] : []),
    ],
  });

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

  const sidebarSectionIds = ['skills', 'certifications', 'volunteering', 'languages', 'otherTraining', 'references', 'publications'];
  const mainSectionIds = ['summary', 'experience', 'education'];
  const sortedSidebar = sectionOrder.filter((id) => sidebarSectionIds.includes(id));
  const sortedMain = sectionOrder.filter((id) => mainSectionIds.includes(id));

  const contactBlock: Paragraph[] = [
    sidebarHeading(sectionTitles.contact),
    ...(personalInfo.phone ? [line(personalInfo.phone)] : []),
    ...(personalInfo.email ? [line(personalInfo.email)] : []),
    ...(personalInfo.address ? [line(personalInfo.address)] : []),
    ...(personalInfo.linkedin ? [linkLine(personalInfo.linkedin, `https://${personalInfo.linkedin.replace(/^https?:\/\//, '')}`)] : []),
    ...(personalInfo.website ? [linkLine(personalInfo.website, `https://${personalInfo.website.replace(/^https?:\/\//, '')}`)] : []),
  ];

  const renderSidebarSection = (id: string): Paragraph[] => {
    switch (id) {
      case 'skills':
        if (!hasData(skills)) return [];
        return [
          sidebarHeading(sectionTitles.skills),
          ...skills.filter(Boolean).map((skill) => bulletLine([new TextRun({ text: skill, size: 18, color: SLATE_700 })])),
        ];
      case 'certifications':
        if (!hasData(certifications)) return [];
        return [
          sidebarHeading(sectionTitles.certifications),
          // Older saved resumes store certifications as plain strings, like the preview allows.
          ...certifications.filter(Boolean).map(normalizeCertification).flatMap((cert) => [
            line(cert.name, { bold: true, color: accent }),
            ...(cert.issuer ? [line(cert.issuer, { italics: true })] : []),
            ...(cert.expireDate
              ? [line(`Expire: ${cert.expireDate}`, { size: 16, color: SLATE_500 })]
              : cert.year
                ? [line(`Year: ${cert.year}`, { size: 16, color: SLATE_500 })]
                : []),
            EMPTY_LINE(),
          ]),
        ];
      case 'volunteering':
        if (!hasData(volunteering)) return [];
        return [
          sidebarHeading(sectionTitles.volunteering),
          ...volunteering.filter(Boolean).flatMap((vol) => [
            line(vol.role, { bold: true }),
            ...(vol.organization ? [line(vol.organization, { bold: true })] : []),
            ...(vol.topic ? [line(`Topic: ${vol.topic}`, { italics: true })] : []),
            EMPTY_LINE(),
          ]),
        ];
      case 'languages':
        if (!hasData(languages)) return [];
        return [
          sidebarHeading(sectionTitles.languages),
          ...languages.filter(Boolean).map((lang) =>
            bulletLine([
              new TextRun({ text: lang.name, bold: true, size: 18, color: SLATE_700 }),
              ...(lang.proficiency ? [new TextRun({ text: ` (${lang.proficiency})`, size: 18, color: SLATE_700 })] : []),
            ])
          ),
        ];
      case 'otherTraining':
        if (!hasData(otherTraining)) return [];
        return [
          sidebarHeading(sectionTitles.otherTraining),
          ...otherTraining.filter(Boolean).map((training) =>
            bulletLine([new TextRun({ text: typeof training === 'string' ? training : training.name, size: 18, color: SLATE_700 })])
          ),
        ];
      case 'references':
        if (!hasData(references)) return [];
        return [
          sidebarHeading(sectionTitles.references),
          ...references.filter(Boolean).flatMap((ref) => [
            line(ref.name, { bold: true }),
            ...(ref.title || ref.company ? [line([ref.title, ref.company].filter(Boolean).join(' | '))] : []),
            ...(ref.phone ? [line(`Phone: ${ref.phone}`, { size: 16, color: SLATE_500 })] : []),
            ...(ref.email ? [line(`Email: ${ref.email}`, { size: 16, color: SLATE_500 })] : []),
            EMPTY_LINE(),
          ]),
        ];
      case 'publications':
        if (!hasData(publications)) return [];
        return [
          sidebarHeading(sectionTitles.publications),
          ...publications.filter(Boolean).flatMap((pub) => [
            line(pub.title, { bold: true }),
            ...(pub.date ? [line(pub.date, { size: 16, color: SLATE_500 })] : []),
            ...(pub.link ? [linkLine(pub.link, pub.link, 16)] : []),
            EMPTY_LINE(),
          ]),
        ];
      default:
        return [];
    }
  };

  const renderMainSection = (id: string): Paragraph[] => {
    switch (id) {
      case 'summary':
        if (!summary) return [];
        return [mainHeading(sectionTitles.profile, accent), ...htmlToParagraphs(summary, SLATE_600, 21)];
      case 'experience':
        if (!hasData(experience)) return [];
        return [
          mainHeading(sectionTitles.experience, accent),
          ...experience.flatMap((exp) => [
            titleWithDates(exp.company + (exp.location ? ` - ${exp.location}` : ''), exp.dates, accent, 26),
            line(exp.role.toUpperCase(), { bold: true, size: 20, color: SLATE_700, after: 100 }),
            ...htmlToParagraphs(exp.description, SLATE_600, 21),
            new Paragraph({ text: '', spacing: { after: 200 } }),
          ]),
        ];
      case 'education':
        if (!hasData(education)) return [];
        return [
          mainHeading(sectionTitles.education, accent),
          ...education.flatMap((edu) => [
            titleWithDates(edu.degree, edu.year, accent, 26),
            line(edu.school + (edu.location ? `, ${edu.location}` : ''), { size: 21, color: SLATE_600, after: 60 }),
            ...(edu.description ? htmlToParagraphs(edu.description, SLATE_500, 20) : []),
            new Paragraph({ text: '', spacing: { after: 160 } }),
          ]),
        ];
      default:
        return [];
    }
  };

  const sidebarCellContent = [...contactBlock, ...sortedSidebar.flatMap(renderSidebarSection)];
  const mainCellContent = sortedMain.flatMap(renderMainSection);

  const photo = parsePhoto(personalInfo.photoUrl);
  const headerCellProps = {
    borders: NO_BORDERS,
    shading: { type: ShadingType.SOLID, color: accent, fill: accent },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 300, bottom: 300, left: 280, right: 280 },
  };

  // One table for the whole page: adjacent tables get merged by Word, and a shared
  // column grid is what keeps the header band aligned with the columns beneath it.
  const layoutTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [SIDEBAR_WIDTH, MAIN_WIDTH],
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            ...headerCellProps,
            width: { size: SIDEBAR_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: photo
                  ? [new ImageRun({ type: photo.type, data: photo.data, transformation: { width: 120, height: 120 } })]
                  : [],
              }),
            ],
          }),
          new TableCell({
            ...headerCellProps,
            width: { size: MAIN_WIDTH, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: (personalInfo.name || 'Your Name').toUpperCase(),
                    bold: true,
                    size: 52,
                    characterSpacing: 20,
                    color: WHITE,
                  }),
                ],
              }),
              ...(personalInfo.title
                ? [new Paragraph({ children: [new TextRun({ text: personalInfo.title, size: 28, color: WHITE })] })]
                : []),
            ],
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
            children: sidebarCellContent,
          }),
          new TableCell({
            width: { size: MAIN_WIDTH, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: NO_BORDERS,
            margins: MAIN_CELL_MARGIN,
            children: mainCellContent.length ? mainCellContent : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });

  const document = new Document({
    styles: {
      default: {
        document: { run: { font, size: 21, color: SLATE_700 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0, gutter: 0 },
          },
        },
        children: [layoutTable],
      },
    ],
  });

  return Packer.toBlob(document);
};
