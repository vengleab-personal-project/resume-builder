export type BasicTextSectionProps = {
  text: string;
  /** Flush left for the closing paragraph; indented for list-like content. */
  indented?: boolean;
};

/**
 * A run of plain prose: the closing personal-qualities paragraph, and the
 * interests line.
 *
 * Deliberately not `dangerouslySetInnerHTML`, unlike the professional resume's
 * rich-text sections. Every word here was transcribed from speech by a model,
 * and there is no editor on this product line that can produce markup — so
 * rendering it as HTML would add an injection surface to buy nothing.
 */
export const BasicTextSection = ({ text, indented = false }: BasicTextSectionProps) => (
  <p className={`text-[15px] leading-8 whitespace-pre-line ${indented ? 'pl-10' : ''}`}>{text}</p>
);
