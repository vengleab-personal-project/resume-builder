import { Loader2, Mic, Square, Volume2 } from 'lucide-react';

export type VoiceOrbPhase = 'loading' | 'asking' | 'listening' | 'thinking' | 'speaking';

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
  loading: 'bg-indigo-500',
  asking: 'bg-indigo-600 hover:bg-indigo-500',
  listening: 'bg-red-600 hover:bg-red-500 motion-safe:animate-pulse',
  thinking: 'bg-slate-400',
  speaking: 'bg-indigo-400',
};

/**
 * The one control the interview is driven by.
 *
 * Its state reaches a screen reader as text through aria-live, never as colour
 * alone, and every animation (the listening pulse, the loading ripple) is behind
 * motion-safe so a reduced-motion preference is honoured. It is a real <button>, so the whole flow works from the keyboard
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
    <div className="relative">
      {/* Loading ripple: the voice model takes several seconds to come up, and a
          still orb reads as broken. Decorative, so hidden from assistive tech. */}
      {phase === 'loading' && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-indigo-400/40 motion-safe:animate-ping"
          />
          <span
            aria-hidden="true"
            className="absolute -inset-2 rounded-full border-2 border-indigo-300/70 motion-safe:animate-pulse"
          />
        </>
      )}
      <button
        type="button"
        onClick={onPress}
        disabled={disabled || phase === 'thinking' || phase === 'loading'}
        aria-label={actionLabel}
        className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:opacity-60 ${RING[phase]}`}
      >
        {phase === 'thinking' || phase === 'loading' ? (
          <Loader2 size={34} className="motion-safe:animate-spin" />
        ) : phase === 'listening' ? (
          <Square size={30} fill="currentColor" />
        ) : phase === 'speaking' ? (
          <Volume2 size={34} />
        ) : (
          <Mic size={34} />
        )}
      </button>
    </div>

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
