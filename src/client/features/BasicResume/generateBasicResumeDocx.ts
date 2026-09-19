import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ParagraphChild,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

import type { BasicResumeData } from '@/shared/types/basic-resume';
import type { ThemeConfig } from '@/shared/types';
import {
  basicSectionHasContent,
  visibleBasicEducation,
  visibleBasicExperience,
  visibleBasicInterests,
  visibleBasicLanguages,
} from '@/shared/lib/basic-resume';

/**
 * Renders the basic CV as a .docx mirroring `BasicResumePreview`.
 *
 * Much smaller than its two-column counterpart in views/CvBuilder because the
 * document itself is: one column, one type size, one heading weight, and no
 * painted backgrounds or icon bitmaps to reproduce. The measurements below are
 * derived from the Tailwind classes in features/BasicResume/components, at
 * 96dpi. If a class changes there, change the matching constant here.
 */

/** CSS px -> twips (1440 per inch, 96 CSS px per inch). */
const tw = (cssPx: number) => Math.round(cssPx * 15);
/** CSS px font-size -> half-points, the unit docx `size` uses. */
const hp = (cssPx: number) => Math.round(cssPx * 1.5);

// A4 portrait.
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
/** `px-14 py-12` on the preview root. */
const MARGIN_X = tw(56);
const MARGIN_Y = tw(48);
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;

const BODY_SIZE = hp(15);
const TITLE_SIZE = hp(24);
const BLACK = '000000';

/** `w-[104px] h-[132px]` photo frame. */
const PHOTO_WIDTH = 104;
const PHOTO_HEIGHT = 132;
const PHOTO_CELL_WIDTH = tw(PHOTO_WIDTH);

/** `w-44` on a personal-data label, `w-32` on a year column. */
const LABEL_COLUMN = tw(176);
const YEAR_COLUMN = tw(128);
/** `pl-10` on every indented block. */
const INDENT = tw(40);

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } as const;
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const NO_TABLE_BORDERS = { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };
const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

const toHex = (color: string) => color.replace('#', '').toUpperCase();

const FONT_MAP: Record<string, string> = {
  'var(--font-sans)': 'Khmer OS Content',
  'var(--font-serif)': 'Georgia',
  'var(--font-mono)': 'Courier New',
};

// Sizes and colours are set on every run rather than inherited from a style,
// because Word's Normal style is what a reader's template overrides first and
// this document has to print the same on every machine it reaches.
const run = (text: string, options: { bold?: boolean; color?: string; font: string }) =>
  new TextRun({
    text,
    bold: options.bold,
    color: options.color ?? BLACK,
    size: BODY_SIZE,
    font: options.font,
  });

const line = (children: ParagraphChild[], spacingAfter = 0) =>
  new Paragraph({ children, spacing: { before: 0, after: spacingAfter } });

/**
 * A two-column row built on tab stops rather than a table.
 *
 * Tables would give exact columns, but Word renders a table cell's contents as
 * its own block, which breaks Khmer line breaking across the cell boundary on
 * the long detail strings this CV is mostly made of. Indented hanging text does
 * not.
 */
const twoColumnRow = (
  left: string,
  right: string,
  font: string,
  leftWidth: number,
  separator?: string
) =>
  new Paragraph({
    indent: { left: INDENT + leftWidth, hanging: leftWidth },
    spacing: { before: 0, after: tw(6) },
    tabStops: [{ type: 'left' as const, position: INDENT + leftWidth }],
    children: [
      run(left, { font }),
      new TextRun({ text: '\t', font }),
      ...(separator ? [run(`${separator} `, { font })] : []),
      run(right, { font }),
    ],
  });

const heading = (text: string, font: string) =>
  new Paragraph({
    spacing: { before: tw(16), after: tw(4) },
    keepNext: true,
    children: [run(text, { bold: true, font })],
  });

const indentedParagraph = (text: string, font: string, indented: boolean) =>
  new Paragraph({
    indent: indented ? { left: INDENT } : undefined,
    spacing: { before: 0, after: tw(6) },
    children: [run(text, { font })],
  });

/**
 * Fetches the user's photo as bytes for embedding.
 *
 * Returns null on any failure rather than throwing: a CV that exports without
 * its photo is a usable document, and one that refuses to export because an
 * image URL went stale is not.
 */
async function loadPhoto(photoUrl?: string): Promise<ArrayBuffer | null> {
  if (!photoUrl) return null;
  try {
    const response = await fetch(photoUrl);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export interface BasicResumeDocxLabels {
  documentTitle: string;
  nameLabel: string;
  phoneLabel: string;
  sections: {
    personal: string;
    positionSought: string;
    education: string;
    experience: string;
    languages: string;
    interests: string;
    personalStatement: string;
  };
  personal: {
    nationality: string;
    gender: string;
    dateOfBirth: string;
    placeOfBirth: string;
    maritalStatus: string;
    health: string;
  };
}

export async function generateBasicResumeDocx(
  data: BasicResumeData,
  theme: ThemeConfig,
  labels: BasicResumeDocxLabels
): Promise<Blob> {
  const font = FONT_MAP[theme.fontFamily] ?? 'Arial';
  const accent = toHex(theme.primaryColor);
  const photo = await loadPhoto(data.photoUrl);

  const identityLines: Paragraph[] = [
    line([run(`${labels.nameLabel} ${data.fullName}`.trim(), { bold: true, font })], tw(8)),
  ];
  if (data.contact.address.trim()) {
    identityLines.push(line([run(data.contact.address, { font })], tw(8)));
  }
  if (data.contact.phone.trim()) {
    identityLines.push(line([run(`${labels.phoneLabel} ${data.contact.phone}`, { font })], tw(8)));
  }
  if (data.contact.email?.trim()) {
    identityLines.push(line([run(data.contact.email, { font })], tw(8)));
  }

  const headerTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH - PHOTO_CELL_WIDTH, PHOTO_CELL_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH - PHOTO_CELL_WIDTH, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: ZERO_MARGINS,
            verticalAlign: VerticalAlign.TOP,
            children: identityLines,
          }),
          new TableCell({
            width: { size: PHOTO_CELL_WIDTH, type: WidthType.DXA },
            borders: {
              // The empty frame is drawn whether or not a photo exists: on this
              // format the box is the instruction to staple one on.
              top: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
              left: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
              right: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
            },
            margins: ZERO_MARGINS,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                children: photo
                  ? [
                      new ImageRun({
                        type: 'png',
                        data: photo,
                        transformation: { width: PHOTO_WIDTH, height: PHOTO_HEIGHT },
                      }),
                    ]
                  : [],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const body: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: tw(24) },
      children: [
        new TextRun({ text: labels.documentTitle, bold: true, size: TITLE_SIZE, color: accent, font }),
      ],
    }),
    headerTable,
    // The heavy rule under the header, as a bottom-bordered empty paragraph --
    // Word has no <hr>.
    new Paragraph({
      spacing: { before: tw(12), after: tw(10) },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: BLACK, space: 1 } },
      children: [],
    }),
  ];

  if (basicSectionHasContent(data, 'personal')) {
    const rows: [string, string][] = [
      [labels.personal.nationality, data.personal.nationality],
      [labels.personal.gender, data.personal.gender],
      [labels.personal.dateOfBirth, data.personal.dateOfBirth],
      [labels.personal.placeOfBirth, data.personal.placeOfBirth],
      [labels.personal.maritalStatus, data.personal.maritalStatus],
      [labels.personal.health, data.personal.health],
    ];
    body.push(heading(labels.sections.personal, font));
    for (const [label, value] of rows) {
      if (value.trim()) body.push(twoColumnRow(label, value, font, LABEL_COLUMN));
    }
  }

  if (basicSectionHasContent(data, 'positionSought')) {
    body.push(
      new Paragraph({
        spacing: { before: tw(16), after: tw(4) },
        children: [
          run(`${labels.sections.positionSought}   `, { bold: true, font }),
          run(data.positionSought, { bold: true, color: accent, font }),
        ],
      })
    );
  }

  if (basicSectionHasContent(data, 'education')) {
    body.push(heading(labels.sections.education, font));
    for (const entry of visibleBasicEducation(data)) {
      body.push(twoColumnRow(entry.year, entry.detail, font, YEAR_COLUMN, ':'));
    }
  }

  if (basicSectionHasContent(data, 'experience')) {
    body.push(heading(labels.sections.experience, font));
    for (const entry of visibleBasicExperience(data)) {
      body.push(twoColumnRow(entry.year, entry.detail, font, YEAR_COLUMN));
    }
  }

  if (basicSectionHasContent(data, 'languages')) {
    body.push(heading(labels.sections.languages, font));
    for (const entry of visibleBasicLanguages(data)) {
      body.push(twoColumnRow(entry.name, entry.skills, font, YEAR_COLUMN));
    }
  }

  if (basicSectionHasContent(data, 'interests')) {
    body.push(heading(labels.sections.interests, font));
    body.push(indentedParagraph(visibleBasicInterests(data).join(', '), font, true));
  }

  if (basicSectionHasContent(data, 'personalStatement')) {
    body.push(heading(labels.sections.personalStatement, font));
    body.push(indentedParagraph(data.personalStatement, font, false));
  }

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: BODY_SIZE, color: BLACK },
          // Word's Normal style adds space after every paragraph; the preview
          // relies on Tailwind's reset, so spacing here is only ever explicit.
          paragraph: { spacing: { before: 0, after: 0 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN_Y, bottom: MARGIN_Y, left: MARGIN_X, right: MARGIN_X },
          },
        },
        children: body,
      },
    ],
  });

  return Packer.toBlob(document);
}
