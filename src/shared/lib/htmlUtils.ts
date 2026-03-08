/**
 * Replaces &nbsp; with regular spaces in text nodes so the browser
 * can wrap lines at normal word boundaries.
 * Only operates on text nodes — leaves HTML tags untouched.
 */
export const normalizeHtmlSpaces = (html: string): string => {
  return html.replace(
    /(?<=>|^)([^<]*?)(?=<|$)/g,
    (match) => match.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ')
  );
};

/**
 * Wraps hyphenated words in HTML content with non-breaking spans
 * to prevent browsers from breaking lines at hyphens.
 * 
 * E.g., "tech-savvy" becomes "<span style="white-space:nowrap">tech-savvy</span>"
 * 
 * Only targets hyphens between word characters (not list items, em-dashes, etc.)
 * Also normalizes &nbsp; to regular spaces first.
 */
export const preserveHyphenatedWords = (html: string): string => {
  const normalized = normalizeHtmlSpaces(html);
  return normalized.replace(
    /(?<=>|^)([^<]*?)(?=<|$)/g,
    (match) => {
      return match.replace(
        /\b(\w+(?:-\w+)+)\b/g,
        '<span style="white-space:nowrap">$1</span>'
      );
    }
  );
};
