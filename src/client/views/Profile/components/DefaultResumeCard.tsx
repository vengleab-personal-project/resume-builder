import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { Translations } from '@/client/hooks/useTranslations';
import type { DefaultResumeInfo } from '../useProfileLogic';

export type DefaultResumeCardProps = {
  resume: DefaultResumeInfo | null;
  isLoading: boolean;
  labels: Translations['profile'];
  onOpen: () => void;
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col">
    <span className="text-lg font-bold text-slate-900 leading-none">{value}</span>
    <span className="text-[11px] text-slate-500 mt-1">{label}</span>
  </div>
);

export const DefaultResumeCard = ({ resume, isLoading, labels, onOpen }: DefaultResumeCardProps) => {
  if (isLoading) return <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />;

  if (!resume) {
    return (
      <p className="text-sm text-slate-500">
        {labels.defaultResumeNone}{' '}
        <Link href="/resumes" className="font-semibold text-indigo-600 hover:text-indigo-700">
          {labels.manageResumes}
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <FileText size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{resume.title}</p>
          <p className="text-xs text-slate-500">
            {labels.defaultResumeUpdated.replace(
              '{date}',
              new Date(resume.updatedAt).toLocaleDateString()
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        <Stat label={labels.statExperience} value={resume.experienceCount} />
        <Stat label={labels.statEducation} value={resume.educationCount} />
        <Stat label={labels.statSkills} value={resume.skillCount} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {labels.openInBuilder}
        </button>
        <Link
          href="/resumes"
          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {labels.manageResumes}
        </Link>
      </div>
    </div>
  );
};
