'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_INTERVIEW_LIMITS } from '@/shared/config/constants';

/**
 * Why the microphone is not working, when it is not working.
 *
 * Each of these is a distinct, translated UI state rather than a thrown error,
 * because they need different things from the user: granting a permission,
 * plugging in a device, or switching to typing. Collapsing them into one
 * "microphone error" would leave a user with no idea which.
 */
export type VoiceRecorderProblem =
  | 'unsupported'
  | 'permission-denied'
  | 'permission-dismissed'
  | 'no-microphone'
  | 'capture-failed';

export type VoiceRecorderState = 'idle' | 'requesting' | 'recording' | 'blocked';

export interface RecordedAnswer {
  blob: Blob;
  durationSeconds: number;
}

const supported = () =>
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia);

/** The first type this browser will actually record. Safari gives mp4, not webm. */
function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export const useVoiceRecorder = () => {
  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [problem, setProblem] = useState<VoiceRecorderProblem | null>(null);
  const [elapsedSeconds, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveRef = useRef<((answer: RecordedAnswer | null) => void) | null>(null);

  // Releases the microphone the moment recording ends. Holding the stream open
  // leaves the browser's recording indicator lit, which reads to a user as the
  // app listening when it is not.
  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => releaseStream(), [releaseStream]);

  // Ticking clock, so the user can see the 60s cap approaching rather than
  // being cut off by it.
  useEffect(() => {
    if (state !== 'recording') return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => clearInterval(timer);
  }, [state]);

  const finish = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }, []);

  const start = useCallback(async (): Promise<RecordedAnswer | null> => {
    if (!supported()) {
      setProblem('unsupported');
      setState('blocked');
      return null;
    }

    setProblem(null);
    setState('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = (error as DOMException)?.name;
      // NotAllowedError covers both an explicit block and a dismissed prompt;
      // the browser does not distinguish them, so the copy has to cover both.
      setProblem(
        name === 'NotFoundError' || name === 'OverconstrainedError'
          ? 'no-microphone'
          : name === 'NotAllowedError'
            ? 'permission-denied'
            : 'capture-failed'
      );
      setState('blocked');
      return null;
    }

    streamRef.current = stream;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];
    startedAtRef.current = Date.now();
    setElapsed(0);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    const answer = new Promise<RecordedAnswer | null>((resolve) => {
      resolveRef.current = resolve;
    });

    recorder.onstop = () => {
      const durationSeconds = (Date.now() - startedAtRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      releaseStream();
      setState('idle');
      setElapsed(0);
      resolveRef.current?.(blob.size > 0 ? { blob, durationSeconds } : null);
      resolveRef.current = null;
    };

    recorder.onerror = () => {
      releaseStream();
      setProblem('capture-failed');
      setState('blocked');
      resolveRef.current?.(null);
      resolveRef.current = null;
    };

    recorder.start();
    setState('recording');

    // The server rejects anything longer, so stopping here turns a hard failure
    // into a complete answer that happens to be the maximum length.
    setTimeout(() => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    }, VOICE_INTERVIEW_LIMITS.MAX_AUDIO_SECONDS * 1000);

    return answer;
  }, [releaseStream]);

  return {
    state,
    problem,
    elapsedSeconds,
    maxSeconds: VOICE_INTERVIEW_LIMITS.MAX_AUDIO_SECONDS,
    isSupported: supported(),
    start,
    finish,
  };
};
