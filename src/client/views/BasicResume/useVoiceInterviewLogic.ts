'use client';

import { useCallback, useRef, useState } from 'react';
import type { BasicResumeDTO } from '@/shared/types/persistence';
import { useVoiceRecorder } from '@/client/features/BasicResume/useVoiceRecorder';
import { useVoicePlayback } from '@/client/features/BasicResume/useVoicePlayback';

export interface InterviewQuestionView {
  id: string;
  text: string;
  optional: boolean;
}

/**
 * Every way the interview can fail, as a state rather than an exception.
 *
 * §8.2 requires each of these to render a translated, actionable message. They
 * are kept distinct because the user's next move differs: top up, reload, start
 * again, or switch to typing.
 */
export type InterviewProblem =
  | 'insufficient-coins'
  | 'session-expired'
  | 'session-exhausted'
  | 'network'
  | 'no-speech'
  | 'degraded'
  | 'start-failed';

export type InterviewPhase = 'off' | 'starting' | 'asking' | 'listening' | 'thinking' | 'done';

interface TurnResponse {
  transcript: string;
  extracted: unknown;
  question: InterviewQuestionView | null;
  isFollowUp: boolean;
  position: number;
  total: number;
  finished: boolean;
  exhausted: boolean;
  degraded: boolean;
  resume: BasicResumeDTO;
  audio: string | null;
}

interface StartResponse extends Omit<TurnResponse, 'transcript' | 'extracted' | 'isFollowUp'> {
  sessionId: string;
  resumeId: string;
  voice?: boolean;
  charged?: number;
}

/**
 * Drives one spoken interview.
 *
 * Holds no Zustand store of its own: an in-progress interview lives on the
 * server, and a stale copy in localStorage would resume against a session id
 * the server has already expired.
 */
export const useVoiceInterviewLogic = (onResume: (resume: BasicResumeDTO) => void) => {
  const recorder = useVoiceRecorder();
  const playback = useVoicePlayback();

  const [phase, setPhase] = useState<InterviewPhase>('off');
  const [question, setQuestion] = useState<InterviewQuestionView | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [problem, setProblem] = useState<InterviewProblem | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  const sessionRef = useRef<string | null>(null);

  const applyStep = useCallback(
    (step: { question: InterviewQuestionView | null; position: number; total: number; audio: string | null }) => {
      setQuestion(step.question);
      setPosition(step.position);
      setTotal(step.total);
      if (step.question) {
        setPhase('asking');
        void playback.speak(step.audio);
      } else {
        setPhase('done');
      }
    },
    [playback]
  );

  const start = useCallback(
    async (locale: 'en' | 'km', resumeId?: string) => {
      setProblem(null);
      setPhase('starting');
      try {
        const res = await fetch('/api/basic-resume/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, resumeId }),
        });

        if (res.status === 402) {
          setProblem('insufficient-coins');
          setPhase('off');
          return;
        }
        if (!res.ok) {
          setProblem('start-failed');
          setPhase('off');
          return;
        }

        const body = (await res.json()) as StartResponse;
        sessionRef.current = body.sessionId;
        setVoiceAvailable(body.voice !== false);
        setTranscript('');
        setIsFollowUp(false);
        if (body.resume) onResume(body.resume);
        applyStep(body);
      } catch {
        setProblem('network');
        setPhase('off');
      }
    },
    [applyStep, onResume]
  );

  const submit = useCallback(
    async (payload: FormData) => {
      const sessionId = sessionRef.current;
      if (!sessionId) return;

      setPhase('thinking');
      setProblem(null);

      try {
        const res = await fetch(`/api/basic-resume/session/${sessionId}/turn`, {
          method: 'POST',
          credentials: 'same-origin',
          body: payload,
        });

        if (res.status === 410) {
          setProblem('session-expired');
          setPhase('off');
          return;
        }
        if (res.status === 409) {
          setProblem('session-exhausted');
          setPhase('done');
          return;
        }
        if (!res.ok) {
          setProblem('network');
          setPhase('asking');
          return;
        }

        const body = (await res.json()) as TurnResponse;
        setTranscript(body.transcript);
        setIsFollowUp(body.isFollowUp);
        onResume(body.resume);

        // An empty transcript is worth saying out loud: it is usually a muted
        // microphone, and silently re-asking looks like the app ignoring you.
        if (!body.transcript.trim()) setProblem('no-speech');
        // A degraded turn saved the answer verbatim rather than understanding
        // it. Saying so is what tells the user to check the CV afterwards.
        else if (body.degraded) setProblem('degraded');

        applyStep(body);
      } catch {
        setProblem('network');
        setPhase('asking');
      }
    },
    [applyStep, onResume]
  );

  /** Press to talk. Resolves when the recording stops and the turn is sent. */
  const record = useCallback(async () => {
    playback.stop();
    setPhase('listening');
    const answer = await recorder.start();
    if (!answer) {
      setPhase('asking');
      return;
    }
    const form = new FormData();
    form.append('audio', answer.blob, 'answer.webm');
    form.append('durationSeconds', String(answer.durationSeconds));
    await submit(form);
  }, [playback, recorder, submit]);

  const stopRecording = useCallback(() => recorder.finish(), [recorder]);

  /** The typed path, through the same route. Always available, on every question. */
  const answerWithText = useCallback(
    async (text: string) => {
      playback.stop();
      const form = new FormData();
      form.append('text', text);
      await submit(form);
    },
    [playback, submit]
  );

  /** Skipping is an answer. Sent as empty text so the turn policy sees a miss. */
  const skip = useCallback(async () => {
    playback.stop();
    await submit(new FormData());
  }, [playback, submit]);

  const exit = useCallback(() => {
    playback.stop();
    sessionRef.current = null;
    setPhase('off');
    setQuestion(null);
    setProblem(null);
    setTranscript('');
  }, [playback]);

  return {
    phase,
    question,
    isFollowUp,
    position,
    total,
    transcript,
    problem,
    voiceAvailable,
    recorder,
    isSpeaking: playback.isSpeaking,
    start,
    record,
    stopRecording,
    answerWithText,
    skip,
    exit,
  };
};
