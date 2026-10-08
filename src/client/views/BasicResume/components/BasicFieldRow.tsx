export type BasicFieldRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
};

export const BasicFieldRow = ({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: BasicFieldRowProps) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    )}
  </label>
);
