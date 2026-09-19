export type BasicPersonalRow = {
  label: string;
  value: string;
};

export type BasicPersonalSectionProps = {
  rows: BasicPersonalRow[];
};

/**
 * The indented label/value block under "Personal data".
 *
 * Rows arrive already filtered: a field the user declined to answer is not
 * passed in, so it renders as nothing rather than as a label with a blank
 * beside it. On a CV, an empty "Marital status:" reads as an omission the
 * reader is invited to wonder about — which is precisely what the app must not
 * do with an answer the user chose not to give.
 */
export const BasicPersonalSection = ({ rows }: BasicPersonalSectionProps) => (
  <dl className="pl-10 text-[15px]">
    {rows.map((row) => (
      <div key={row.label} className="flex gap-2 leading-8">
        <dt className="w-44 shrink-0">{row.label}</dt>
        <dd className="min-w-0 flex-1">{row.value}</dd>
      </div>
    ))}
  </dl>
);
