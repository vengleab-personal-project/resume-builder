import { useMemo } from 'react';
import { normalizeHtmlSpaces, preserveHyphenatedWords } from '@/shared/lib/htmlUtils';
import { sanitizeHTML } from '@/shared/lib/sanitize';

export type RichTextProps = {
  /** Editor HTML (summary, descriptions, trainings). */
  html: string;
  className?: string;
  /** `span` where the text sits inside a line, e.g. after a bullet. */
  inline?: boolean;
  /** Keep hyphenated words ("tech-savvy") on one line. */
  preserveHyphens?: boolean;
};

/**
 * Renders editor HTML the way every template and the DOCX export read it.
 *
 * This is the only place resume HTML reaches `dangerouslySetInnerHTML`, and it is
 * sanitized here, at render, because the stored value is not trusted: the API accepts
 * any string, and the public share page shows it to people who are not its author.
 */
export const RichText = ({ html, className, inline = false, preserveHyphens = false }: RichTextProps) => {
  const Tag = inline ? 'span' : 'div';
  // Sanitizing parses the markup, and a preview re-renders on every keystroke.
  const safe = useMemo(() => {
    const clean = sanitizeHTML(html);
    return preserveHyphens ? preserveHyphenatedWords(clean) : normalizeHtmlSpaces(clean);
  }, [html, preserveHyphens]);

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
};
