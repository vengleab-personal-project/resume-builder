import 'server-only';
import sanitizeHtml from 'sanitize-html';
import { safePhotoUrl, safeUrl } from '@/shared/lib/safeUrl';
import {
  RICH_TEXT_ALLOWED_ATTR,
  RICH_TEXT_ALLOWED_TAGS,
  RICH_TEXT_CLASS_PREFIX,
  RICH_TEXT_LINK_SCHEMES,
} from '@/shared/config/rich-text';

/**
 * Write-side cleaning of a FULL resume's `data`.
 *
 * `data` is an opaque JSON column that the API accepts as-is, and the public share page
 * shows it to people who did not write it, so a value only the editor ever produced
 * cannot be assumed: anyone can PATCH the API directly. The browser sanitizes again when
 * it renders (`RichText`), which is the boundary that matters; this keeps the stored
 * document clean too (the DOCX export and any future reader), and shares its allow-list
 * with the client's through `shared/config/rich-text`.
 *
 * Only the fields that are HTML or a URL are touched. Everything else is plain text that
 * React escapes, and running it through an HTML sanitizer would turn "R&D" into "R&amp;D".
 */

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: RICH_TEXT_ALLOWED_TAGS,
  allowedAttributes: {
    '*': RICH_TEXT_ALLOWED_ATTR.filter((attr) => attr !== 'href'),
    a: RICH_TEXT_ALLOWED_ATTR,
  },
  allowedClasses: { '*': [`${RICH_TEXT_CLASS_PREFIX}*`] },
  allowedSchemes: RICH_TEXT_LINK_SCHEMES,
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.href ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs,
    }),
  },
};

export const sanitizeRichText = (html: string): string => sanitizeHtml(html, RICH_TEXT_OPTIONS);

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Applies `edit` to every object in an array field, leaving anything else as it came. */
const mapEntries = (value: unknown, edit: (entry: JsonObject) => JsonObject): unknown =>
  Array.isArray(value) ? value.map((entry) => (isObject(entry) ? edit(entry) : entry)) : value;

const cleanText = (entry: JsonObject, key: string): JsonObject =>
  typeof entry[key] === 'string' ? { ...entry, [key]: sanitizeRichText(entry[key]) } : entry;

export function sanitizeResumeData(data: JsonObject): JsonObject {
  const out: JsonObject = { ...data };

  if (typeof out.summary === 'string') out.summary = sanitizeRichText(out.summary);
  out.experience = mapEntries(out.experience, (entry) => cleanText(entry, 'description'));
  out.education = mapEntries(out.education, (entry) => cleanText(entry, 'description'));
  out.otherTraining = mapEntries(out.otherTraining, (entry) => cleanText(entry, 'name'));
  out.publications = mapEntries(out.publications, (entry) =>
    typeof entry.link === 'string' ? { ...entry, link: safeUrl(entry.link) } : entry
  );

  if (isObject(out.personalInfo) && typeof out.personalInfo.photoUrl === 'string') {
    out.personalInfo = { ...out.personalInfo, photoUrl: safePhotoUrl(out.personalInfo.photoUrl) };
  }

  // A section the document never had must not appear as `undefined` keys.
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}
