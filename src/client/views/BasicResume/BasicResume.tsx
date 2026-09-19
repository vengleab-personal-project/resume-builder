'use client';

import { BasicResumePreview } from '@/client/features/BasicResume';
import { useBasicResumeLogic } from './useBasicResumeLogic';
import { BasicResumeFields } from './components/BasicResumeFields';
import { BasicResumeToolbar } from './components/BasicResumeToolbar';

export default function BasicResume() {
  const {
    t,
    resumes,
    activeId,
    title,
    data,
    theme,
    status,
    isLoading,
    isExportingDocx,
    setTitle,
    setScalar,
    setPair,
    addPair,
    removePair,
    open,
    create,
    exportPdf,
    exportDocx,
  } = useBasicResumeLogic();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        {t.editor.loading}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <BasicResumeToolbar
        labels={t.editor.toolbar}
        resumes={resumes}
        activeId={activeId}
        title={title}
        status={status}
        isExportingDocx={isExportingDocx}
        onTitleChange={setTitle}
        onSelect={(id) => void open(id)}
        onCreate={() => void create()}
        onExportPdf={exportPdf}
        onExportDocx={exportDocx}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden print:block print:overflow-visible">
        <div className="w-[420px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-6 py-6 print:hidden">
          <p className="mb-6 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
            {t.editor.voiceComingSoon}
          </p>
          <BasicResumeFields
            data={data}
            labels={t}
            onScalarChange={setScalar}
            onPairChange={setPair}
            onPairAdd={addPair}
            onPairRemove={removePair}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
          <div className="mx-auto w-[794px] max-w-full bg-white shadow-lg print:w-full print:shadow-none">
            <BasicResumePreview data={data} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
