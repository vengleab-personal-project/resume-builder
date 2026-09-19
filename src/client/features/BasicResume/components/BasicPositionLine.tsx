export type BasicPositionLineProps = {
  label: string;
  position: string;
  primaryColor: string;
};

/**
 * "Position applied for", set on one line with the answer picked out in the
 * theme colour — the single piece of emphasis the reference document uses, and
 * the first thing the person reading the CV is looking for.
 */
export const BasicPositionLine = ({ label, position, primaryColor }: BasicPositionLineProps) => (
  <p className="text-[15px] leading-8">
    <span className="font-bold">{label}</span>{' '}
    <span className="pl-6 font-bold" style={{ color: primaryColor }}>
      {position}
    </span>
  </p>
);
