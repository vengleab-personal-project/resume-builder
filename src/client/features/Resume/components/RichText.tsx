import { normalizeHtmlSpaces } from '@/shared/lib/htmlUtils';

export type RichTextProps = {
  /** Editor HTML (summary, descriptions, trainings). */
  html: string;
  className?: string;
  /** `span` where the text sits inside a line, e.g. after a bullet. */
  inline?: boolean;
};

/** Renders editor HTML the way every template and the DOCX export read it. */
export const RichText = ({ html, className, inline = false }: RichTextProps) => {
  const Tag = inline ? 'span' : 'div';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: normalizeHtmlSpaces(html) }} />;
};
