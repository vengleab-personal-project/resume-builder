'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_AUDIO } from '@/shared/config/constants';
import type { VoiceRecorderProblem } from './useVoiceRecorder';
import { base64ToFloat32, CAPTURE_WORKLET_SOURCE, pcmToBase64 } from './liveAudio';

/**
 * The browser end of a live (streaming) interview.
 *
 * The microphone streams to Gemini Live and the reply streams back, so there is
 * no press-to-talk. What it deliberately does NOT do is decide anything: the
 * model asks and listens, and when it judges an answer finished it calls
 * `submit_answer`. This hook then hands the transcript to the caller, who sends
 * it through the same turn route a typed answer uses -- so extraction, the turn
 * cap, the merge and the follow-up policy are all the server's, exactly as in
 * press-to-talk. Nothing here is a source of truth.
 *
 * The socket is opened with a short-lived, single-use token the server minted
 * and locked (model, instructions, tools). The API key never reaches the
 * browser. Audio and transcripts live in memory for the length of the call and
 * are not stored or logged.
 */

export type LiveState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'working';

/**
 * How a connection attempt ended. `mic` is a refused or missing microphone,
 * which has its own message; `cancelled` is the user leaving mid-connect, which
 * is not a failure and must not show one.
 */
export type LiveConnectOutcome = 'ok' | 'mic' | 'failed' | 'cancelled';

export interface LiveGrant {
  token: string;
  model: string;
  expiresAt: string;
}

export interface LiveHandlers {
  /**
   * The model says the person has finished. Resolve with what it should say
   * next, or `done` when the interview is over or cannot continue.
   */
  onAnswer: (transcript: string) => Promise<{ say: string | null; done: boolean }>;
  /** What has been heard of the current answer so far, for display. */
  onHeard: (transcript: string) => void;
  /** The session ended without the caller asking it to. */
  onClosed: (reason: 'failed' | 'ended') => void;
}

// A socket that has not finished its handshake by now is not going to.
const CONNECT_TIMEOUT_MS = 10_000;

const SOCKET_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

interface ServerMessage {
  setupComplete?: unknown;
  serverContent?: {
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string } }> };
    inputTranscription?: { text?: string };
    interrupted?: boolean;
    turnComplete?: boolean;
  };
  toolCall?: { functionCalls?: Array<{ id: string; name: string }> };
}

export const useLiveSession = () => {
  const [state, setState] = useState<LiveState>('idle');
  const [micProblem, setMicProblem] = useState<VoiceRecorderProblem | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartRef = useRef(0);
  const modelTurnDoneRef = useRef(true);
  const pendingRef = useRef('');
  const answeringRef = useRef(false);
  const readyRef = useRef(false);
  const disposedRef = useRef(false);
  const handlersRef = useRef<LiveHandlers | null>(null);
  // Settles the connect() still waiting on the handshake, so leaving mid-connect
  // resolves it instead of leaving the caller awaiting forever.
  const settleConnectRef = useRef<((outcome: LiveConnectOutcome) => void) | null>(null);

  const send = useCallback((payload: unknown) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }, []);

  const settleState = useCallback(() => {
    // Back to listening only once the model has finished AND its audio has
    // finished playing; the reply is queued ahead of real time.
    if (modelTurnDoneRef.current && sourcesRef.current.size === 0 && !answeringRef.current) {
      setState('listening');
    }
  }, []);

  const stopPlayback = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // Already finished.
      }
    });
    sourcesRef.current.clear();
    nextStartRef.current = 0;
  }, []);

  const playChunk = useCallback(
    (base64: string) => {
      const ctx = playCtxRef.current;
      if (!ctx) return;

      const samples = base64ToFloat32(base64);
      if (samples.length === 0) return;

      const buffer = ctx.createBuffer(1, samples.length, VOICE_AUDIO.TTS_SAMPLE_RATE);
      buffer.copyToChannel(new Float32Array(samples), 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Chunks are queued back to back so the reply plays gaplessly.
      const startAt = Math.max(ctx.currentTime, nextStartRef.current);
      source.start(startAt);
      nextStartRef.current = startAt + buffer.duration;

      sourcesRef.current.add(source);
      source.onended = () => {
        sourcesRef.current.delete(source);
        settleState();
      };
      setState('speaking');
    },
    [settleState]
  );

  const handleToolCall = useCallback(
    async (calls: Array<{ id: string; name: string }>) => {
      for (const call of calls) {
        if (call.name !== 'submit_answer') {
          send({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: {} }] } });
          continue;
        }

        // The model should call this once. A second call while the first is
        // still being processed would submit the same answer twice.
        if (answeringRef.current) {
          send({
            toolResponse: {
              functionResponses: [{ id: call.id, name: call.name, response: { ignored: true } }],
            },
          });
          continue;
        }

        answeringRef.current = true;
        setState('working');
        const transcript = pendingRef.current.trim();
        pendingRef.current = '';

        let outcome: { say: string | null; done: boolean };
        try {
          outcome = (await handlersRef.current?.onAnswer(transcript)) ?? { say: null, done: true };
        } catch {
          outcome = { say: null, done: true };
        }
        answeringRef.current = false;
        if (disposedRef.current) return;

        send({
          toolResponse: {
            functionResponses: [
              {
                id: call.id,
                name: call.name,
                response: outcome.say ? { say: outcome.say } : { done: true },
              },
            ],
          },
        });
        settleState();
      }
    },
    [send, settleState]
  );

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      if (message.setupComplete) {
        readyRef.current = true;
        setState('listening');
        return;
      }

      const content = message.serverContent;
      if (content) {
        // The person talked over the model: drop what is queued, it is stale.
        if (content.interrupted) {
          stopPlayback();
          modelTurnDoneRef.current = true;
          settleState();
        }

        for (const part of content.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) {
            modelTurnDoneRef.current = false;
            playChunk(part.inlineData.data);
          }
        }

        if (content.inputTranscription?.text) {
          pendingRef.current += content.inputTranscription.text;
          handlersRef.current?.onHeard(pendingRef.current.trim());
        }

        if (content.turnComplete) {
          modelTurnDoneRef.current = true;
          settleState();
        }
      }

      if (message.toolCall?.functionCalls?.length) {
        void handleToolCall(message.toolCall.functionCalls);
      }
    },
    [handleToolCall, playChunk, settleState, stopPlayback]
  );

  const teardown = useCallback(() => {
    stopPlayback();
    settleConnectRef.current?.('cancelled');
    settleConnectRef.current = null;

    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }

    // Releasing the tracks is what turns the browser's recording indicator off.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void captureCtxRef.current?.close().catch(() => undefined);
    captureCtxRef.current = null;
    void playCtxRef.current?.close().catch(() => undefined);
    playCtxRef.current = null;

    readyRef.current = false;
    answeringRef.current = false;
    modelTurnDoneRef.current = true;
    pendingRef.current = '';
  }, [stopPlayback]);

  const close = useCallback(() => {
    disposedRef.current = true;
    teardown();
    setState('idle');
  }, [teardown]);

  // Leaving the screen ends the call: the microphone must not stay open and the
  // model must not keep talking on another page.
  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      teardown();
    };
  }, [teardown]);

  /**
   * Must be called from the click that starts the interview, before any await:
   * browsers only let an AudioContext start inside a user gesture, and by the
   * time the server has answered the gesture is gone.
   */
  const prime = useCallback(() => {
    if (playCtxRef.current) return;
    const ctx = new AudioContext({ sampleRate: VOICE_AUDIO.TTS_SAMPLE_RATE });
    void ctx.resume().catch(() => undefined);
    playCtxRef.current = ctx;
  }, []);

  const connect = useCallback(
    async (grant: LiveGrant, handlers: LiveHandlers): Promise<LiveConnectOutcome> => {
      disposedRef.current = false;
      handlersRef.current = handlers;
      setMicProblem(null);
      setState('connecting');
      prime();

      // The microphone first: a permission prompt can take longer than the
      // token's start window, so it is answered before the socket is opened.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
      } catch (error) {
        const name = (error as DOMException)?.name;
        setMicProblem(
          name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'no-microphone'
            : name === 'NotAllowedError'
              ? 'permission-denied'
              : 'capture-failed'
        );
        teardown();
        setState('idle');
        return 'mic';
      }
      if (disposedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return 'cancelled';
      }
      streamRef.current = stream;

      try {
        const ctx = new AudioContext();
        captureCtxRef.current = ctx;
        const workletUrl = URL.createObjectURL(
          new Blob([CAPTURE_WORKLET_SOURCE], { type: 'text/javascript' })
        );
        await ctx.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);
        if (disposedRef.current) return 'cancelled';

        const capture = new AudioWorkletNode(ctx, 'pcm-capture', {
          processorOptions: { targetRate: VOICE_AUDIO.LIVE_INPUT_SAMPLE_RATE },
        });
        capture.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
          if (!readyRef.current) return;
          send({
            realtimeInput: {
              audio: {
                data: pcmToBase64(event.data),
                mimeType: `audio/pcm;rate=${VOICE_AUDIO.LIVE_INPUT_SAMPLE_RATE}`,
              },
            },
          });
        };
        ctx.createMediaStreamSource(stream).connect(capture);
      } catch {
        teardown();
        setState('idle');
        setMicProblem('capture-failed');
        return 'mic';
      }

      return new Promise<LiveConnectOutcome>((resolve) => {
        let settled = false;
        const settle = (outcome: LiveConnectOutcome) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          settleConnectRef.current = null;
          resolve(outcome);
        };
        settleConnectRef.current = settle;

        const timer = setTimeout(() => {
          if (settled) return;
          teardown();
          setState('idle');
          settle('failed');
        }, CONNECT_TIMEOUT_MS);

        const socket = new WebSocket(`${SOCKET_URL}?access_token=${encodeURIComponent(grant.token)}`);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({ setup: { model: `models/${grant.model}` } }));
        };

        socket.onmessage = async (event: MessageEvent<string | Blob>) => {
          try {
            const raw = typeof event.data === 'string' ? event.data : await event.data.text();
            const message = JSON.parse(raw) as ServerMessage;
            const wasReady = readyRef.current;
            handleMessage(message);
            if (!wasReady && readyRef.current) settle('ok');
          } catch {
            // A frame that is not JSON is not one this hook understands; skip it.
          }
        };

        socket.onerror = () => {
          // The close event that follows carries the outcome.
        };

        socket.onclose = () => {
          if (disposedRef.current) return;
          const wasReady = readyRef.current;
          teardown();
          setState('idle');
          settle('failed');
          // Only a call that was up is reported here; one that never connected is
          // already reported through connect()'s outcome.
          if (wasReady) handlersRef.current?.onClosed('ended');
        };
      });
    },
    [handleMessage, prime, send, teardown]
  );

  /** Has the model say `text`, as a question. Also starts a fresh answer. */
  const ask = useCallback(
    (text: string) => {
      pendingRef.current = '';
      modelTurnDoneRef.current = false;
      send({ realtimeInput: { text: `Ask: ${text}` } });
    },
    [send]
  );

  return { state, micProblem, prime, connect, ask, close };
};
