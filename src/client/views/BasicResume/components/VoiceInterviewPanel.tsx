import { AlertTriangle, X } from 'lucide-react';
import type { InterviewProblem, InterviewPhase, InterviewQuestionView } from '../useVoiceInterviewLogic';
import type { LiveState } from '@/client/features/BasicResume/useLiveSession';
import type { VoiceRecorderProblem, VoiceRecorderState } from '@/client/features/BasicResume/useVoiceRecorder';
import { InterviewProgress } from './InterviewProgress';
import { QuestionCard } from './QuestionCard';
import { VoiceOrb, type VoiceOrbPhase } from './VoiceOrb';

export type VoiceInterviewLabels = {
  title: string;
  intro: string;
  startEn: string;
  startKm: string;
  cost: string;
  step: string;
  finished: string;
  finishedNote: string;
  close: string;
  press: string;
  stop: string;
  statusLoading: string;
  statusLiveListening: string;
  switchToPressToTalk: string;
  statusAsking: string;
  statusListening: string;
  statusThinking: string;
  statusSpeaking: string;
  followUpNote: string;
  optionalNote: string;
  transcriptLabel: string;
  typedLabel: string;
  typedPlaceholder: string;
  send: string;
  skip: string;
  textOnlyNote: string;
  problems: Record<InterviewProblem, string>;
  micProblems: Record<VoiceRecorderProblem, string>;
};

export type VoiceInterviewPanelProps = {
  labels: VoiceInterviewLabels;
  phase: InterviewPhase;
  question: InterviewQuestionView | null;
  isFollowUp: boolean;
  position: number;
  total: number;
  transcript: string;
  problem: InterviewProblem | null;
  voiceAvailable: boolean;
  micState: VoiceRecorderState;
  micProblem: VoiceRecorderProblem | null;
  micSupported: boolean;
  elapsedSeconds: number;
  maxSeconds: number;
  isSpeaking: boolean;
  liveActive: boolean;
  liveState: LiveState;
  onSwitchToPressToTalk: () => void;
  onStart: (locale: 'en' | 'km') => void;
  onRecord: () => void;
  onStopRecording: () => void;
  onSubmitText: (text: string) => void;
  onSkip: () => void;
  onClose: () => void;
};

const orbPhase = (
  phase: InterviewPhase,
  micState: VoiceRecorderState,
  isSpeaking: boolean,
  liveActive: boolean,
  liveState: LiveState
): VoiceOrbPhase => {
  if (phase === 'starting') return 'loading';
  // In a live conversation the orb mirrors the call, not the press-to-talk
  // recorder: the microphone is open without being pressed.
  if (liveActive || liveState === 'connecting') {
    if (liveState === 'connecting') return 'loading';
    if (liveState === 'speaking') return 'speaking';
    if (liveState === 'working') return 'thinking';
    return 'live';
  }
  if (phase === 'thinking') return 'thinking';
  if (micState === 'recording' || phase === 'listening') return 'listening';
  if (isSpeaking) return 'speaking';
  return 'asking';
};

export const VoiceInterviewPanel = ({
  labels,
  phase,
  question,
  isFollowUp,
  position,
  total,
  transcript,
  problem,
  voiceAvailable,
  micState,
  micProblem,
  micSupported,
  elapsedSeconds,
  maxSeconds,
  isSpeaking,
  liveActive,
  liveState,
  onSwitchToPressToTalk,
  onStart,
  onRecord,
  onStopRecording,
  onSubmitText,
  onSkip,
  onClose,
}: VoiceInterviewPanelProps) => {
  // Two independent failure channels — the interview's and the microphone's —
  // rendered through one banner so the user is never shown two problems at once.
  const message = problem ? labels.problems[problem] : micProblem ? labels.micProblems[micProblem] : null;

  if (phase === 'off') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">{labels.title}</h3>
        <p className="text-sm leading-relaxed text-slate-600">{labels.intro}</p>
        <p className="text-xs font-semibold text-slate-500">{labels.cost}</p>
        {message && <Banner text={message} />}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onStart('en')}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {labels.startEn}
          </button>
          <button
            type="button"
            onClick={() => onStart('km')}
            className="flex-1 rounded-lg border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            {labels.startKm}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">{labels.finished}</h3>
        <p className="text-sm text-slate-600">{labels.finishedNote}</p>
        {message && <Banner text={message} />}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {labels.close}
        </button>
      </div>
    );
  }

  const inLiveCall = liveActive || liveState === 'connecting';
  const listening = !inLiveCall && (micState === 'recording' || phase === 'listening');
  const busy = phase === 'thinking' || phase === 'starting';

  const statusLabel = inLiveCall
    ? liveState === 'connecting'
      ? labels.statusLoading
      : liveState === 'speaking'
        ? labels.statusSpeaking
        : liveState === 'working'
          ? labels.statusThinking
          : labels.statusLiveListening
    : listening
      ? labels.statusListening
      : phase === 'starting'
        ? labels.statusLoading
        : phase === 'thinking'
          ? labels.statusThinking
          : isSpeaking
            ? labels.statusSpeaking
            : labels.statusAsking;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">{labels.title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      </div>

      <InterviewProgress
        position={position}
        total={total}
        label={labels.step.replace('{n}', String(position)).replace('{total}', String(total))}
      />

      {message && <Banner text={message} />}

      {/* Speech unavailable is a note, not a blocker: every question still
          accepts a typed answer through the same route. */}
      {(!voiceAvailable || !micSupported) && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          {labels.textOnlyNote}
        </p>
      )}

      {voiceAvailable && micSupported && (
        <div className="space-y-2">
          <VoiceOrb
            phase={orbPhase(phase, micState, isSpeaking, liveActive, liveState)}
            statusLabel={statusLabel}
            actionLabel={listening ? labels.stop : labels.press}
            elapsedSeconds={elapsedSeconds}
            maxSeconds={maxSeconds}
            disabled={busy}
            onPress={listening ? onStopRecording : onRecord}
          />
          {liveActive && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onSwitchToPressToTalk}
                className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
              >
                {labels.switchToPressToTalk}
              </button>
            </div>
          )}
        </div>
      )}

      {question && (
        <QuestionCard
          // Keyed so each question gets a fresh typed field, rather than one
          // still holding the previous answer.
          key={question.id}
          questionText={question.text}
          isFollowUp={isFollowUp}
          followUpNote={labels.followUpNote}
          optional={question.optional}
          optionalNote={labels.optionalNote}
          transcript={transcript}
          transcriptLabel={labels.transcriptLabel}
          typedLabel={labels.typedLabel}
          typedPlaceholder={labels.typedPlaceholder}
          sendLabel={labels.send}
          skipLabel={labels.skip}
          busy={busy}
          onSubmitText={onSubmitText}
          onSkip={onSkip}
        />
      )}
    </div>
  );
};

const Banner = ({ text }: { text: string }) => (
  <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">
    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
    {text}
  </p>
);
