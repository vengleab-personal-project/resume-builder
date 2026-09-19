export type BasicYearListEntry = {
  id: string;
  year: string;
  detail: string;
};

export type BasicYearListSectionProps = {
  entries: BasicYearListEntry[];
  /** Drawn between year and detail, as in the reference document. */
  separator?: string;
};

/**
 * Schooling and work history. One component for both because on this format
 * they are the same row — a year on the left, one spoken line on the right —
 * and two near-identical components would be two places for the column widths
 * to drift apart.
 */
export const BasicYearListSection = ({ entries, separator }: BasicYearListSectionProps) => (
  <div className="pl-10 text-[15px]">
    {entries.map((entry) => (
      <div key={entry.id} className="flex gap-2 leading-8 break-inside-avoid">
        <span className="w-32 shrink-0">{entry.year}</span>
        {separator && <span className="shrink-0">{separator}</span>}
        <span className="min-w-0 flex-1">{entry.detail}</span>
      </div>
    ))}
  </div>
);
