import { useState } from 'react';

export type QuestionCardProps = {
  questionText: string;
  isFollowUp: boolean;
  followUpNote: string;
  optional: boolean;
  optionalNote: string;
  transcript: string;
  transcriptLabel: string;
  typedLabel: string;
  typedPlaceholder: string;
  sendLabel: string;
  skipLabel: string;
  busy: boolean;
  onSubmitText: (text: string) => void;
  onSkip: () => void;
};

/**
 * The question, what was heard, and the typed way to answer it.
 *
 * The typed field is not tucked behind a toggle. It is the accessibility path
 * for deaf and hard-of-hearing users and the correction path when speech
 * recognition mishears a name, so it is present and focusable on every single
 * question, which also makes the whole interview finishable on a keyboard.
 *
 * The transcript is shown as text rather than only spoken, so the flow is
 * usable with the sound off.
 *
 * The caller must key this on the question id — see the state comment below.
 */
export const QuestionCard = ({
  questionText,
  isFollowUp,
  followUpNote,
  optional,
  optionalNote,
  transcript,
  transcriptLabel,
  typedLabel,
  typedPlaceholder,
  sendLabel,
  skipLabel,
  busy,
  onSubmitText,
  onSkip,
}: QuestionCardProps) => {
  // Mounted with the question id as its React key, so a new question gives a
  // fresh, empty field rather than one carrying the previous answer. Resetting
  // in an effect would render the stale value once before clearing it.
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim() || busy) return;
    onSubmitText(text.trim());
    setText('');
  };

  return (
    <div className="space-y-4">
      <div>
        {isFollowUp && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
            {followUpNote}
          </p>
        )}
        <p className="text-lg font-semibold leading-relaxed text-slate-900">{questionText}</p>
        {optional && <p className="mt-1 text-xs text-slate-500">{optionalNote}</p>}
      </div>

      {transcript && (
        <div className="rounded-lg bg-slate-100 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {transcriptLabel}
          </p>
          <p className="mt-0.5 text-sm text-slate-800">{transcript}</p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {typedLabel}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            disabled={busy}
            placeholder={typedPlaceholder}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && send()}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !text.trim()}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {sendLabel}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={busy}
        className="text-sm font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline disabled:opacity-50"
      >
        {skipLabel}
      </button>
    </div>
  );
};
