import { FileDown, Loader2, Plus, Printer } from 'lucide-react';
import type { ResumeSummary } from '@/shared/types/persistence';
import type { BasicSaveStatus } from '../useBasicResumeLogic';

export type BasicResumeToolbarLabels = {
  heading: string;
  titlePlaceholder: string;
  newCv: string;
  exportPdf: string;
  exportDocx: string;
  exporting: string;
  status: Record<BasicSaveStatus, string>;
};

export type BasicResumeToolbarProps = {
  labels: BasicResumeToolbarLabels;
  resumes: ResumeSummary[];
  activeId: string | null;
  title: string;
  status: BasicSaveStatus;
  isExportingDocx: boolean;
  onTitleChange: (title: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
};

export const BasicResumeToolbar = ({
  labels,
  resumes,
  activeId,
  title,
  status,
  isExportingDocx,
  onTitleChange,
  onSelect,
  onCreate,
  onExportPdf,
  onExportDocx,
}: BasicResumeToolbarProps) => (
  <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 print:hidden">
    <h1 className="text-base font-bold text-slate-900">{labels.heading}</h1>

    <input
      type="text"
      value={title}
      onChange={(event) => onTitleChange(event.target.value)}
      placeholder={labels.titlePlaceholder}
      aria-label={labels.titlePlaceholder}
      className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
    />

    {resumes.length > 1 && (
      <select
        value={activeId ?? ''}
        onChange={(event) => onSelect(event.target.value)}
        aria-label={labels.heading}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
      >
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.title}
          </option>
        ))}
      </select>
    )}

    {/* aria-live: autosave is the only thing on this screen that changes
        without the user doing it, so it is the only thing worth announcing. */}
    <span className="text-xs font-medium text-slate-500" aria-live="polite">
      {labels.status[status]}
    </span>

    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Plus size={15} />
        {labels.newCv}
      </button>
      <button
        type="button"
        onClick={onExportPdf}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Printer size={15} />
        {labels.exportPdf}
      </button>
      <button
        type="button"
        onClick={onExportDocx}
        disabled={isExportingDocx}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {isExportingDocx ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
        {isExportingDocx ? labels.exporting : labels.exportDocx}
      </button>
    </div>
  </header>
);
