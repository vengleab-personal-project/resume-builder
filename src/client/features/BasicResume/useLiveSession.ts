'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_AUDIO } from '@/shared/config/constants';
import type { VoiceRecorderProblem } from './useVoiceRecorder';
import { base64ToFloat32, CAPTURE_WORKLET_SOURCE, pcmToBase64 } from './liveAudio';

/**
 * The browser end of a live (streaming) interview.
 *
 * The microphone streams to Gemini Live and the reply streams back, so there is
 * no press-to-talk. The model runs the whole conversation from a brief it was
 * given, in its own words and its own order, and decides for itself when it has
 * heard enough. This hook does not interpret any of it: it keeps a transcript of
 * both sides, in memory, and hands it over when the call ends. The server turns
 * that transcript into the CV -- nothing is saved while the call is running.
 *
 * The socket is opened with a short-lived, single-use token the server minted
 * and locked (model, instructions, tools). The API key never reaches the
 * browser. Audio and transcripts live in memory for the length of the call and
 * are not stored or logged.
 */

export type LiveState = 'idle' | 'connecting' | 'listening' | 'speaking';

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

/** One side's contribution to the conversation, in the order it happened. */
export interface DialogueEntry {
  role: 'interviewer' | 'person';
  text: string;
}

export interface LiveHandlers {
  /**
   * The call is over -- the model said it has what it needs and finished its
   * goodbye, or the connection dropped. `dialogue` is everything said.
   */
  onEnd: (dialogue: DialogueEntry[], reason: 'finished' | 'dropped') => void;
  /** What has been heard of the person so far in the current stretch, for display. */
  onHeard: (transcript: string) => void;
  /** What the model is saying, as text -- a caption, so the call works with sound off. */
  onModelSaid: (text: string) => void;
}

// A socket that has not finished its handshake by now is not going to.
const CONNECT_TIMEOUT_MS = 10_000;

// How long a goodbye may take before the call ends anyway.
const END_GRACE_MS = 15_000;

const SOCKET_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

interface ServerMessage {
  setupComplete?: unknown;
  serverContent?: {
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string } }> };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
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
  const readyRef = useRef(false);
  const disposedRef = useRef(false);
  const handlersRef = useRef<LiveHandlers | null>(null);

  // The conversation so far. Consecutive chunks from the same side are one entry;
  // a change of speaker starts a new one.
  const dialogueRef = useRef<DialogueEntry[]>([]);
  const modelSaidRef = useRef('');
  // The model's next utterance starts a fresh caption.
  const newModelTurnRef = useRef(true);
  // The model has called end_interview: close once it has finished saying goodbye.
  const endingRef = useRef(false);
  // Backstop for that goodbye: a turn that never completes must not hold the call open.
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Settles the connect() still waiting on the handshake, so leaving mid-connect
  // resolves it instead of leaving the caller awaiting forever.
  const settleConnectRef = useRef<((outcome: LiveConnectOutcome) => void) | null>(null);
  // `endCall` is defined after the message handlers that need to call it.
  const endCallRef = useRef<((reason: 'finished' | 'dropped') => void) | null>(null);

  const send = useCallback((payload: unknown) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }, []);

  const record = useCallback((role: DialogueEntry['role'], chunk: string) => {
    const entries = dialogueRef.current;
    const last = entries[entries.length - 1];
    if (last && last.role === role) last.text += chunk;
    else entries.push({ role, text: chunk });
  }, []);

  const settleState = useCallback(() => {
    // Back to listening only once the model has finished AND its audio has
    // finished playing; the reply is queued ahead of real time.
    if (modelTurnDoneRef.current && sourcesRef.current.size === 0) {
      if (endingRef.current) {
        // Its goodbye is done: the call is over.
        endCallRef.current?.('finished');
        return;
      }
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
          record('person', content.inputTranscription.text);
          // "I heard" shows the person's current stretch of speech, not the whole call.
          const latest = dialogueRef.current[dialogueRef.current.length - 1];
          handlersRef.current?.onHeard(latest.text.trim());
        }

        if (content.outputTranscription?.text) {
          if (newModelTurnRef.current) {
            modelSaidRef.current = '';
            newModelTurnRef.current = false;
          }
          modelSaidRef.current += content.outputTranscription.text;
          record('interviewer', content.outputTranscription.text);
          handlersRef.current?.onModelSaid(modelSaidRef.current.trim());
        }

        if (content.turnComplete) {
          modelTurnDoneRef.current = true;
          newModelTurnRef.current = true;
          settleState();
        }
      }

      for (const call of message.toolCall?.functionCalls ?? []) {
        // end_interview is the only tool. Anything else gets an empty answer so
        // the model is never left waiting on one.
        send({
          toolResponse: {
            functionResponses: [
              { id: call.id, name: call.name, response: call.name === 'end_interview' ? { ok: true } : {} },
            ],
          },
        });
        if (call.name === 'end_interview') {
          // The model says a goodbye after this. Closing now would cut it off, so
          // the call ends when that turn has been spoken in full.
          endingRef.current = true;
          modelTurnDoneRef.current = false;
          endTimerRef.current = setTimeout(() => endCallRef.current?.('finished'), END_GRACE_MS);
        }
      }
    },
    [playChunk, record, send, settleState, stopPlayback]
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

    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }

    readyRef.current = false;
    modelTurnDoneRef.current = true;
    newModelTurnRef.current = true;
    endingRef.current = false;
    modelSaidRef.current = '';
  }, [stopPlayback]);

  /** Tears the call down and takes the transcript with it. */
  const takeDialogue = useCallback((): DialogueEntry[] => {
    const dialogue = dialogueRef.current.filter((entry) => entry.text.trim());
    dialogueRef.current = [];
    return dialogue;
  }, []);

  /** The call is over, one way or another: hand the transcript to the caller. */
  const endCall = useCallback(
    (reason: 'finished' | 'dropped') => {
      if (disposedRef.current) return;
      const dialogue = takeDialogue();
      const handlers = handlersRef.current;
      teardown();
      setState('idle');
      handlers?.onEnd(dialogue, reason);
    },
    [takeDialogue, teardown]
  );
  endCallRef.current = endCall;

  /**
   * Ends the call on the user's say-so and returns the transcript. Does not call
   * `onEnd`: the caller asked for it and already knows.
   */
  const finish = useCallback((): DialogueEntry[] => {
    const dialogue = takeDialogue();
    disposedRef.current = true;
    teardown();
    setState('idle');
    return dialogue;
  }, [takeDialogue, teardown]);

  /** Closes without a transcript: leaving the screen, or abandoning the interview. */
  const close = useCallback(() => {
    disposedRef.current = true;
    dialogueRef.current = [];
    teardown();
    setState('idle');
  }, [teardown]);

  // Leaving the screen ends the call: the microphone must not stay open and the
  // model must not keep talking on another page.
  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      dialogueRef.current = [];
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
      dialogueRef.current = [];
      endingRef.current = false;
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
          if (!wasReady) {
            // Never connected: reported through connect()'s outcome, and there is
            // no conversation to hand over.
            teardown();
            setState('idle');
            settle('failed');
            return;
          }
          // The call was up and dropped. Whatever was said is still worth keeping.
          endCall('dropped');
        };
      });
    },
    [endCall, handleMessage, prime, send, teardown]
  );

  /**
   * Sends the model a note from the app, not the person: "begin", "they typed
   * this instead". The model treats it as an instruction and replies aloud.
   */
  const tell = useCallback(
    (text: string) => {
      modelTurnDoneRef.current = false;
      send({ realtimeInput: { text } });
    },
    [send]
  );

  /** A typed answer given during the call: part of the conversation like any other. */
  const addPersonText = useCallback(
    (text: string) => {
      // A leading space keeps it apart from speech it lands next to.
      record('person', ` ${text}`);
    },
    [record]
  );

  return { state, micProblem, prime, connect, tell, addPersonText, finish, close };
};
