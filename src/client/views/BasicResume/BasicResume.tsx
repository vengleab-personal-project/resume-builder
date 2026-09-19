'use client';

import { useCallback, useState } from 'react';
import { Mic, PencilLine } from 'lucide-react';
import { BasicResumePreview } from '@/client/features/BasicResume';
import { useBasicResumeLogic } from './useBasicResumeLogic';
import { useVoiceInterviewLogic } from './useVoiceInterviewLogic';
import { BasicResumeFields } from './components/BasicResumeFields';
import { BasicResumeToolbar } from './components/BasicResumeToolbar';
import { VoiceInterviewPanel } from './components/VoiceInterviewPanel';

type Pane = 'type' | 'voice';

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
    adoptServerResume,
    open,
    create,
    exportPdf,
    exportDocx,
  } = useBasicResumeLogic();

  const [pane, setPane] = useState<Pane>('voice');
  const interview = useVoiceInterviewLogic(adoptServerResume);

  const startInterview = useCallback(
    (locale: 'en' | 'km') => void interview.start(locale, activeId ?? undefined),
    [interview, activeId]
  );

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
        <div className="flex w-[420px] shrink-0 flex-col border-r border-slate-200 bg-white print:hidden">
          <div className="flex gap-1 border-b border-slate-200 px-4 pt-3" role="tablist">
            <PaneTab
              active={pane === 'voice'}
              icon={<Mic size={14} />}
              label={t.editor.voiceTab}
              onClick={() => setPane('voice')}
            />
            <PaneTab
              active={pane === 'type'}
              icon={<PencilLine size={14} />}
              label={t.editor.editTab}
              onClick={() => setPane('type')}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {pane === 'voice' ? (
              <VoiceInterviewPanel
                labels={t.editor.voice}
                phase={interview.phase}
                question={interview.question}
                isFollowUp={interview.isFollowUp}
                position={interview.position}
                total={interview.total}
                transcript={interview.transcript}
                problem={interview.problem}
                voiceAvailable={interview.voiceAvailable}
                micState={interview.recorder.state}
                micProblem={interview.recorder.problem}
                micSupported={interview.recorder.isSupported}
                elapsedSeconds={interview.recorder.elapsedSeconds}
                maxSeconds={interview.recorder.maxSeconds}
                isSpeaking={interview.isSpeaking}
                onStart={startInterview}
                onRecord={() => void interview.record()}
                onStopRecording={interview.stopRecording}
                onSubmitText={(text) => void interview.answerWithText(text)}
                onSkip={() => void interview.skip()}
                onClose={interview.exit}
              />
            ) : (
              <BasicResumeFields
                data={data}
                labels={t}
                onScalarChange={setScalar}
                onPairChange={setPair}
                onPairAdd={addPair}
                onPairRemove={removePair}
              />
            )}
          </div>
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

const PaneTab = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? 'border-b-2 border-indigo-600 text-indigo-700'
        : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
    }`}
  >
    {icon}
    {label}
  </button>
);
