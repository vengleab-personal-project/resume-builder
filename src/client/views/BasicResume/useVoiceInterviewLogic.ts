'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BasicResumeDTO } from '@/shared/types/persistence';
import { useVoiceRecorder } from '@/client/features/BasicResume/useVoiceRecorder';
import { useVoicePlayback } from '@/client/features/BasicResume/useVoicePlayback';
import { useLiveSession, type LiveGrant } from '@/client/features/BasicResume/useLiveSession';

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
  | 'start-failed'
  | 'live-failed';

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
  /** Present when the server issued a live-conversation token. */
  live?: LiveGrant | null;
}

/**
 * What one submitted answer means for the live model, which has to be told what
 * to say next. `retry` is a turn that did not land (network): the same question
 * is asked again rather than the interview moving on without an answer.
 */
type TurnResult =
  | { kind: 'next'; text: string }
  | { kind: 'retry'; text: string }
  | { kind: 'done' };

/**
 * Drives one spoken interview.
 *
 * Two ways to talk, one interview: a live conversation (the microphone streams
 * to Gemini and it replies in real time) and press-to-talk. Both end up in the
 * same place -- the turn route -- so the caps, the extraction, the single debit
 * and the saved CV are identical, and a user can switch between them mid-way.
 *
 * Holds no Zustand store of its own: an in-progress interview lives on the
 * server, and a stale copy in localStorage would resume against a session id
 * the server has already expired.
 */
export const useVoiceInterviewLogic = (onResume: (resume: BasicResumeDTO) => void) => {
  const recorder = useVoiceRecorder();
  const playback = useVoicePlayback();
  const live = useLiveSession();

  const [phase, setPhase] = useState<InterviewPhase>('off');
  const [question, setQuestion] = useState<InterviewQuestionView | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [problem, setProblem] = useState<InterviewProblem | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [liveActive, setLiveActive] = useState(false);

  const sessionRef = useRef<string | null>(null);
  // The question as last asked, for the live model's retry. Read from a ref
  // because the live handlers are registered once and would see a stale closure.
  const questionRef = useRef<InterviewQuestionView | null>(null);
  const phaseRef = useRef<InterviewPhase>('off');
  phaseRef.current = phase;

  // One request in flight at a time. Aborted on unmount and on exit so a reply
  // that arrives after the user has left is dropped instead of speaking the next
  // question over another page. The server still finishes the turn it received;
  // the session stays ACTIVE, so coming back resumes at the right question.
  const requestRef = useRef<AbortController | null>(null);

  const beginRequest = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    return controller.signal;
  }, []);

  const abortRequest = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  useEffect(() => abortRequest, [abortRequest]);

  const applyStep = useCallback(
    (step: { question: InterviewQuestionView | null; position: number; total: number; audio: string | null }) => {
      setQuestion(step.question);
      questionRef.current = step.question;
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

  const submit = useCallback(
    async (payload: FormData): Promise<TurnResult> => {
      const sessionId = sessionRef.current;
      if (!sessionId) return { kind: 'done' };

      setPhase('thinking');
      setProblem(null);
      const signal = beginRequest();
      const retry = (): TurnResult => ({ kind: 'retry', text: questionRef.current?.text ?? '' });

      try {
        const res = await fetch(`/api/basic-resume/session/${sessionId}/turn`, {
          method: 'POST',
          credentials: 'same-origin',
          body: payload,
          signal,
        });

        if (res.status === 410) {
          setProblem('session-expired');
          setPhase('off');
          return { kind: 'done' };
        }
        if (res.status === 409) {
          setProblem('session-exhausted');
          setPhase('done');
          return { kind: 'done' };
        }
        if (!res.ok) {
          setProblem('network');
          setPhase('asking');
          return retry();
        }

        const body = (await res.json()) as TurnResponse;
        if (signal.aborted) return { kind: 'done' };
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
        return body.question ? { kind: 'next', text: body.question.text } : { kind: 'done' };
      } catch {
        if (signal.aborted) return { kind: 'done' };
        setProblem('network');
        setPhase('asking');
        return retry();
      }
    },
    [applyStep, beginRequest, onResume]
  );

  // The live handlers are registered once, when the socket opens, so they reach
  // `submit` through a ref instead of closing over a version that goes stale.
  const submitRef = useRef(submit);
  submitRef.current = submit;

  /** The model says the person finished answering: run it through the turn route. */
  const handleLiveAnswer = useCallback(
    async (spoken: string): Promise<{ say: string | null; done: boolean }> => {
      const form = new FormData();
      // The live transcript travels as typed text -- the one input the turn route
      // already treats as authoritative -- and `speak=false` because the live
      // model voices the next question itself.
      form.append('text', spoken);
      form.append('speak', 'false');

      const result = await submitRef.current(form);
      if (result.kind === 'done') {
        // After the hook has sent the tool response, not before it.
        setTimeout(() => live.close(), 0);
        setLiveActive(false);
        return { say: null, done: true };
      }
      return { say: result.text || null, done: false };
    },
    [live]
  );

  const beginLive = useCallback(
    async (grant: LiveGrant, firstQuestion: string) => {
      const outcome = await live.connect(grant, {
        onAnswer: handleLiveAnswer,
        onHeard: setTranscript,
        onClosed: () => {
          setLiveActive(false);
          // A drop after the interview is already over is not a problem.
          if (phaseRef.current !== 'done' && phaseRef.current !== 'off') setProblem('live-failed');
        },
      });

      if (outcome === 'ok') {
        setLiveActive(true);
        live.ask(firstQuestion);
        return;
      }
      // A refused microphone already has its own message; anything else is the
      // connection itself. Either way the interview carries on without voice
      // output: the question is on screen and every answer can be typed.
      if (outcome === 'failed') setProblem('live-failed');
    },
    [handleLiveAnswer, live]
  );

  const start = useCallback(
    async (locale: 'en' | 'km', resumeId?: string) => {
      // Inside the click, before any await: browsers only start audio from a
      // user gesture, and the gesture is gone once the server has answered.
      live.prime();

      setProblem(null);
      setPhase('starting');
      const signal = beginRequest();
      try {
        const res = await fetch('/api/basic-resume/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, resumeId, live: true }),
          signal,
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
        if (signal.aborted) return;
        sessionRef.current = body.sessionId;
        setVoiceAvailable(body.voice !== false);
        setTranscript('');
        setIsFollowUp(false);
        if (body.resume) onResume(body.resume);
        applyStep(body);

        if (body.live && body.question) await beginLive(body.live, body.question.text);
      } catch {
        if (signal.aborted) return;
        setProblem('network');
        setPhase('off');
      }
    },
    [applyStep, beginLive, beginRequest, live, onResume]
  );

  /** Tells the live model what to ask next, after a typed answer moved things on. */
  const continueLive = useCallback(
    (result: TurnResult) => {
      if (!liveActive) return;
      if (result.kind === 'done') {
        live.close();
        setLiveActive(false);
      } else if (result.text) {
        live.ask(result.text);
      }
    },
    [live, liveActive]
  );

  /** Press to talk. Resolves when the recording stops and the turn is sent. */
  const record = useCallback(async () => {
    playback.stop();
    setPhase('listening');
    const answer = await recorder.start();
    if (!answer) {
      // exit() clears the session before this runs; do not pull the panel back
      // from 'off' to 'asking' after the user has left the interview.
      if (sessionRef.current) setPhase('asking');
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
      if (liveActive) form.append('speak', 'false');
      continueLive(await submit(form));
    },
    [continueLive, liveActive, playback, submit]
  );

  /** Skipping is an answer. Sent as empty text so the turn policy sees a miss. */
  const skip = useCallback(async () => {
    playback.stop();
    const form = new FormData();
    if (liveActive) form.append('speak', 'false');
    continueLive(await submit(form));
  }, [continueLive, liveActive, playback, submit]);

  /**
   * Leaves the live conversation for press-to-talk, mid-interview. The session
   * is the same one -- nothing is re-charged and no answer is lost.
   */
  const switchToPressToTalk = useCallback(() => {
    live.close();
    setLiveActive(false);
    setProblem(null);
  }, [live]);

  const exit = useCallback(() => {
    abortRequest();
    live.close();
    setLiveActive(false);
    recorder.cancel();
    playback.stop();
    sessionRef.current = null;
    questionRef.current = null;
    setPhase('off');
    setQuestion(null);
    setProblem(null);
    setTranscript('');
  }, [abortRequest, live, playback, recorder]);

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
    liveActive,
    liveState: live.state,
    liveMicProblem: live.micProblem,
    start,
    record,
    stopRecording,
    answerWithText,
    skip,
    switchToPressToTalk,
    exit,
  };
};
