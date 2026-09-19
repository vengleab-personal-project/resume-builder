import { Loader2, Mic, Square, Volume2 } from 'lucide-react';

export type VoiceOrbPhase = 'asking' | 'listening' | 'thinking' | 'speaking';

export type VoiceOrbProps = {
  phase: VoiceOrbPhase;
  /** Announced to screen readers — never colour alone. */
  statusLabel: string;
  actionLabel: string;
  elapsedSeconds: number;
  maxSeconds: number;
  disabled?: boolean;
  onPress: () => void;
};

const RING: Record<VoiceOrbPhase, string> = {
  asking: 'bg-indigo-600 hover:bg-indigo-500',
  listening: 'bg-red-600 hover:bg-red-500 motion-safe:animate-pulse',
  thinking: 'bg-slate-400',
  speaking: 'bg-indigo-400',
};

/**
 * The one control the interview is driven by.
 *
 * Its state reaches a screen reader as text through aria-live, never as colour
 * alone, and the pulse is behind motion-safe so a reduced-motion preference is
 * honoured. It is a real <button>, so the whole flow works from the keyboard
 * with no extra handling.
 */
export const VoiceOrb = ({
  phase,
  statusLabel,
  actionLabel,
  elapsedSeconds,
  maxSeconds,
  disabled = false,
  onPress,
}: VoiceOrbProps) => (
  <div className="flex flex-col items-center gap-3">
    <button
      type="button"
      onClick={onPress}
      disabled={disabled || phase === 'thinking'}
      aria-label={actionLabel}
      className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-60 ${RING[phase]}`}
    >
      {phase === 'thinking' ? (
        <Loader2 size={34} className="motion-safe:animate-spin" />
      ) : phase === 'listening' ? (
        <Square size={30} fill="currentColor" />
      ) : phase === 'speaking' ? (
        <Volume2 size={34} />
      ) : (
        <Mic size={34} />
      )}
    </button>

    <p className="text-sm font-semibold text-slate-700" aria-live="polite">
      {statusLabel}
    </p>

    {phase === 'listening' && (
      <p className="text-xs tabular-nums text-slate-500">
        {elapsedSeconds}s / {maxSeconds}s
      </p>
    )}
  </div>
);
