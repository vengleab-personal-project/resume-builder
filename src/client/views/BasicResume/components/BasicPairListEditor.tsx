import { Plus, Trash2 } from 'lucide-react';

export type BasicPairEntry = {
  id: string;
  left: string;
  right: string;
};

export type BasicPairListEditorProps = {
  heading: string;
  entries: BasicPairEntry[];
  leftLabel: string;
  rightLabel: string;
  addLabel: string;
  removeLabel: string;
  onChange: (id: string, field: 'left' | 'right', value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

/**
 * One editor for schooling, work history and languages.
 *
 * All three are the same shape on this CV -- a short left-hand value and one
 * free line beside it -- so they share an editor for the same reason they share
 * a renderer: three near-identical components would be three places for them to
 * drift.
 */
export const BasicPairListEditor = ({
  heading,
  entries,
  leftLabel,
  rightLabel,
  addLabel,
  removeLabel,
  onChange,
  onAdd,
  onRemove,
}: BasicPairListEditorProps) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-800">{heading}</h3>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
      >
        <Plus size={14} />
        {addLabel}
      </button>
    </div>

    {entries.map((entry) => (
      <div key={entry.id} className="flex items-start gap-2">
        <input
          type="text"
          value={entry.left}
          placeholder={leftLabel}
          aria-label={leftLabel}
          onChange={(event) => onChange(entry.id, 'left', event.target.value)}
          className="w-32 shrink-0 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={entry.right}
          placeholder={rightLabel}
          aria-label={rightLabel}
          onChange={(event) => onChange(entry.id, 'right', event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          title={removeLabel}
          aria-label={removeLabel}
          className="mt-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={15} />
        </button>
      </div>
    ))}
  </section>
);
