export type BasicSectionHeadingProps = {
  title: string;
};

/**
 * The basic CV's only heading style: bold, flush left, no rule, no icon.
 *
 * The reference document is a plain typed page, and every decoration added here
 * makes it read less like the CV a Cambodian employer expects to receive. The
 * restraint is the design.
 */
export const BasicSectionHeading = ({ title }: BasicSectionHeadingProps) => (
  <h2 className="text-[15px] font-bold text-black mb-1 mt-4 break-after-avoid">{title}</h2>
);
