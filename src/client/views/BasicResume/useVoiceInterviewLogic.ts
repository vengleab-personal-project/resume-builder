'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BasicResumeDTO } from '@/shared/types/persistence';
import type { BasicResumeData } from '@/shared/types/basic-resume';
import { useVoiceRecorder } from '@/client/features/BasicResume/useVoiceRecorder';
import { useVoicePlayback } from '@/client/features/BasicResume/useVoicePlayback';
import {
  useLiveSession,
  type DialogueEntry,
  type LiveGrant,
} from '@/client/features/BasicResume/useLiveSession';
import {
  BASIC_INTERVIEW_QUESTION_COUNT,
  interviewQuestionPosition,
} from '@/shared/lib/basic-interview-script';
import { countFilledTopics, missingTopics } from '@/shared/lib/basic-interview-topics';

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
  | 'live-failed'
  | 'missing-details'
  | 'consolidate-failed';

export type InterviewPhase =
  | 'off'
  | 'starting'
  | 'asking'
  | 'listening'
  | 'thinking'
  | 'consolidating'
  | 'done';

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

interface FinishResponse {
  /** False when the model could not be reached: nothing was saved, the transcript can be resent. */
  consolidated: boolean;
  done: boolean;
  exhausted: boolean;
  conflict: boolean;
  resume: BasicResumeDTO;
  /** The structured script's next section, so the interview can carry on in press-to-talk. */
  question: InterviewQuestionView | null;
}

/** What the live model is told when a call picks up where an earlier one left off. */
function resumeBriefing(data: BasicResumeData): string {
  const missing = missingTopics(data);
  const needed = [...missing.required, ...missing.optional.filter((topic) => !topic.sensitive)];
  // A fresh CV needs the brief and nothing more.
  if (countFilledTopics(data) === 0) return 'Begin the interview now.';
  return (
    'Begin now. Some details are already known, so do not ask for those again. ' +
    `Greet the person briefly, say you only need to fill in a few gaps, and ask about: ${JSON.stringify(needed.map((t) => t.ask))}.`
  );
}

/**
 * Drives one spoken interview.
 *
 * Two ways to talk, one interview. A live conversation lets the model decide what
 * to ask and when it has heard enough; nothing is saved while it runs. When it
 * ends, the whole transcript goes to the server once and the CV is built from it.
 * Press-to-talk walks a fixed script of four sections and saves after each. The CV
 * is only ever written by the server, from what the person said, so the caps, the
 * single debit and the saved CV behave the same in both, and if a call leaves
 * something missing the interview carries on in either mode.
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
  const [modelSaid, setModelSaid] = useState('');
  // A live call has been offered this session and can be picked up again. A
  // token is single-use, so "again" means asking the server for a fresh one,
  // which costs nothing: it is the same session.
  const [canContinueLive, setCanContinueLive] = useState(false);
  const [consolidationFailed, setConsolidationFailed] = useState(false);

  const sessionRef = useRef<string | null>(null);
  const resumeRef = useRef<BasicResumeDTO | null>(null);
  const localeRef = useRef<'en' | 'km'>('en');
  // The transcript of a call whose CV was not built yet. Held in memory only, and
  // only until it has been sent successfully: if the model was unreachable it is
  // what makes "try again" possible without asking the person to repeat it all.
  const pendingDialogueRef = useRef<{ dialogue: DialogueEntry[]; reason: 'finished' | 'dropped' } | null>(null);

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

  /** Every server-returned CV goes through here. */
  const adopt = useCallback(
    (resume: BasicResumeDTO) => {
      resumeRef.current = resume;
      onResume(resume);
    },
    [onResume]
  );

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

  // ---------------------------------------------------------------------------
  // Press-to-talk and typing: the structured, section-by-section turn route
  // ---------------------------------------------------------------------------

  const submit = useCallback(
    async (payload: FormData) => {
      const sessionId = sessionRef.current;
      if (!sessionId) return;

      setPhase('thinking');
      setProblem(null);
      const signal = beginRequest();

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
        if (signal.aborted) return;
        setTranscript(body.transcript);
        setIsFollowUp(body.isFollowUp);
        adopt(body.resume);

        // An empty transcript is worth saying out loud: it is usually a muted
        // microphone, and silently re-asking looks like the app ignoring you.
        if (!body.transcript.trim()) setProblem('no-speech');
        // A degraded turn saved the answer verbatim rather than understanding
        // it. Saying so is what tells the user to check the CV afterwards.
        else if (body.degraded) setProblem('degraded');

        applyStep(body);
      } catch {
        if (signal.aborted) return;
        setProblem('network');
        setPhase('asking');
      }
    },
    [adopt, applyStep, beginRequest]
  );

  // ---------------------------------------------------------------------------
  // Live conversation: it runs freely, then one pass builds the CV
  // ---------------------------------------------------------------------------

  /**
   * Sends the finished conversation to the server and applies the CV it builds.
   * On any failure the transcript is kept for a retry; it is dropped only once
   * the server has confirmed it was used.
   */
  const consolidate = useCallback(
    async (dialogue: DialogueEntry[], reason: 'finished' | 'dropped') => {
      const sessionId = sessionRef.current;
      if (!sessionId) return;

      pendingDialogueRef.current = { dialogue, reason };
      setConsolidationFailed(false);
      setProblem(null);
      setPhase('consolidating');
      const signal = beginRequest();

      const failed = () => {
        setProblem('consolidate-failed');
        setConsolidationFailed(true);
        setPhase('asking');
      };

      try {
        const res = await fetch(`/api/basic-resume/session/${sessionId}/finish`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dialogue }),
          signal,
        });

        if (res.status === 410) {
          pendingDialogueRef.current = null;
          setProblem('session-expired');
          setPhase('off');
          return;
        }
        if (res.status === 409) {
          pendingDialogueRef.current = null;
          setProblem('session-exhausted');
          setPhase('done');
          return;
        }
        // Includes 429, another request for this session still being processed.
        if (!res.ok) return failed();

        const body = (await res.json()) as FinishResponse;
        if (signal.aborted) return;
        if (!body.consolidated) return failed();

        pendingDialogueRef.current = null;
        adopt(body.resume);

        if (body.done || body.exhausted) {
          if (body.exhausted && !body.done) setProblem('session-exhausted');
          setQuestion(null);
          setPhase('done');
          return;
        }

        // Something required is still missing. The structured question for it is
        // ready, and a fresh call can be started for the gap.
        setQuestion(body.question);
        if (body.question) {
          setPosition(interviewQuestionPosition(body.question.id));
          setTotal(BASIC_INTERVIEW_QUESTION_COUNT);
        }
        setCanContinueLive(true);
        setProblem(reason === 'dropped' ? 'live-failed' : 'missing-details');
        setPhase('asking');
      } catch {
        if (signal.aborted) return;
        failed();
      }
    },
    [adopt, beginRequest]
  );

  const beginLive = useCallback(
    async (grant: LiveGrant) => {
      const outcome = await live.connect(grant, {
        onEnd: (dialogue, reason) => {
          setLiveActive(false);
          void consolidate(dialogue, reason);
        },
        onHeard: setTranscript,
        onModelSaid: setModelSaid,
      });

      if (outcome === 'ok') {
        setLiveActive(true);
        setCanContinueLive(true);
        live.tell(resumeBriefing(resumeRef.current?.data ?? ({} as BasicResumeData)));
        return;
      }
      // A refused microphone already has its own message; anything else is the
      // connection itself. Either way the interview carries on without a live
      // call: the question is on screen and every answer can be typed.
      if (outcome === 'failed') setProblem('live-failed');
    },
    [consolidate, live]
  );

  const start = useCallback(
    async (locale: 'en' | 'km', resumeId?: string) => {
      // Inside the click, before any await: browsers only start audio from a
      // user gesture, and the gesture is gone once the server has answered.
      live.prime();

      localeRef.current = locale;
      setProblem(null);
      setModelSaid('');
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
        if (body.resume) adopt(body.resume);
        applyStep(body);

        if (body.live) await beginLive(body.live);
      } catch {
        if (signal.aborted) return;
        setProblem('network');
        setPhase('off');
      }
    },
    [adopt, applyStep, beginLive, beginRequest, live]
  );

  /** Picks the conversation back up to fill what is missing. Same session, no new charge. */
  const continueLive = useCallback(
    () => start(localeRef.current, resumeRef.current?.id),
    [start]
  );

  /** The person ends the call themselves. */
  const finishLive = useCallback(() => {
    const dialogue = live.finish();
    setLiveActive(false);
    void consolidate(dialogue, 'finished');
  }, [consolidate, live]);

  /** The model was unreachable last time; send the same transcript again. */
  const retryConsolidation = useCallback(() => {
    const pending = pendingDialogueRef.current;
    if (pending) void consolidate(pending.dialogue, pending.reason);
  }, [consolidate]);

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

  /** The typed path. Always available, on every question, in either mode. */
  const answerWithText = useCallback(
    async (text: string) => {
      playback.stop();

      if (liveActive) {
        // Typed during a call: part of the conversation like anything said aloud,
        // and the model is told so it carries on instead of waiting for speech.
        setTranscript(text);
        live.addPersonText(text);
        live.tell(`The person typed this instead of speaking: "${text}". Carry on from there.`);
        return;
      }

      const form = new FormData();
      form.append('text', text);
      await submit(form);
    },
    [liveActive, live, playback, submit]
  );

  /** Skipping is an answer. In press-to-talk, sent as empty text so the policy sees a miss. */
  const skip = useCallback(async () => {
    playback.stop();
    if (liveActive) {
      live.tell('The person wants to skip that. Move on to something else.');
      return;
    }
    await submit(new FormData());
  }, [liveActive, live, playback, submit]);

  const exit = useCallback(() => {
    abortRequest();
    live.close();
    setLiveActive(false);
    setCanContinueLive(false);
    setConsolidationFailed(false);
    pendingDialogueRef.current = null;
    recorder.cancel();
    playback.stop();
    sessionRef.current = null;
    resumeRef.current = null;
    setPhase('off');
    setQuestion(null);
    setProblem(null);
    setTranscript('');
    setModelSaid('');
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
    modelSaid,
    canContinueLive,
    consolidationFailed,
    start,
    record,
    stopRecording,
    answerWithText,
    skip,
    finishLive,
    continueLive,
    retryConsolidation,
    exit,
  };
};
