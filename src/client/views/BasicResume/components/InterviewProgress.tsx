export type InterviewProgressProps = {
  position: number;
  total: number;
  label: string;
};

export const InterviewProgress = ({ position, total, label }: InterviewProgressProps) => {
  const pct = total > 0 ? Math.min(100, Math.round((position / total) * 100)) : 0;

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={position}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
