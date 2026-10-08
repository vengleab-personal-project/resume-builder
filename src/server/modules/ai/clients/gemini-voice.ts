import 'server-only';
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai';
import { serverEnv } from '@/server/config/env.server';
import { VOICE_AUDIO, VOICE_INTERVIEW_LIMITS } from '@/shared/config/constants';
import { HttpError } from '@/server/errors';
import { FIELD_TOPICS, FREE_FORM_QUESTION } from '@/shared/lib/basic-interview-topics';

/**
 * Speech in and speech out for the basic CV's voice interview.
 *
 * Deliberately a second Gemini client, alongside clients/gemini.ts:
 *
 * - The legacy @google/generative-ai SDK the rest of the app uses cannot ask for
 *   an AUDIO response modality at all, so text-to-speech is unreachable through
 *   it. Migrating the shipped flows to the new SDK is a separate change with its
 *   own regression surface and is not attempted here.
 * - It must NOT go through `getGeminiModel`. That helper gates every call on
 *   `isChatModelAllowed()` against the ChatModel table, and the two voice models
 *   are deliberately constants rather than rows (see VOICE_MODEL_IDS). Routing
 *   through it would reject every voice call at runtime. The allow-list is
 *   replaced below by a narrower one: the two configured voice models, nothing
 *   else.
 *
 * Nothing here writes audio anywhere. Buffers live for the length of the request
 * and are dropped. Voice recordings are biometric data and this app has no
 * consent flow, retention policy or deletion path for them, so the only safe
 * amount to store is none.
 */

let client: GoogleGenAI | null = null;

/**
 * Returns a GoogleGenAI client configured for the active backend.
 *
 * - 'ai-studio' (default): authenticates with GEMINI_API_KEY.
 * - 'vertex': authenticates via Application Default Credentials
 *   (GOOGLE_APPLICATION_CREDENTIALS → service account JSON key,
 *   Workload Identity, gcloud ADC, …). Requires GCP_PROJECT.
 *
 * The singleton is reset to null whenever the backend selection might change
 * (only at cold-start in practice; lambda environments have a single env snapshot).
 */
function genai(): GoogleGenAI {
  if (!client) {
    if (serverEnv.GEMINI_BACKEND === 'vertex') {
      if (!serverEnv.GCP_PROJECT) {
        throw new Error(
          'GEMINI_BACKEND=vertex requires GCP_PROJECT to be set. ' +
          'Make sure GCP_SERVICE_ACCOUNT_KEY_PATH points to a valid service account key.'
        );
      }
      // @google/genai does not expose googleAuthOptions for the vertexai mode,
      // so we wire up the key file via GOOGLE_APPLICATION_CREDENTIALS before the
      // client is created. This is safe: Next.js server code owns the process
      // and this runs once at cold-start. Falls back to whatever ADC provides
      // (Workload Identity, gcloud ADC, etc.) when the path is not set.
      const keyPath = serverEnv.GCP_SERVICE_ACCOUNT_KEY_PATH;
      if (keyPath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
      }
      client = new GoogleGenAI({
        vertexai: true,
        project: serverEnv.GCP_PROJECT,
        location: serverEnv.GCP_LOCATION,
      });
    } else {
      client = new GoogleGenAI({ apiKey: serverEnv.GEMINI_API_KEY });
    }
  }
  return client;
}

/**
 * The configured @google/genai client, for the one other place that needs this
 * SDK: structured-output extraction after a live call. Exported rather than
 * duplicated so both backends (AI Studio, Vertex) are wired in a single place.
 */
export function getGenAiClient(): GoogleGenAI {
  return genai();
}

/** Whether a real voice pipeline is reachable. False means typed-only, unbilled. */
export function isVoiceAvailable(): boolean {
  if (serverEnv.GEMINI_BACKEND === 'vertex') {
    // Vertex AI uses ADC — no API key needed, but GCP_PROJECT must be set.
    return Boolean(serverEnv.GCP_PROJECT);
  }
  return Boolean(serverEnv.GEMINI_API_KEY);
}

function assertConfiguredModel(modelId: string): void {
  const allowed = [serverEnv.GEMINI_VOICE_STT_MODEL, serverEnv.GEMINI_VOICE_LIVE_MODEL];
  if (!allowed.includes(modelId)) {
    throw new Error(`Model ${modelId} is not a configured voice model`);
  }
}

// The SDK types the inline-data payload loosely, so rather than reaching for
// `any` these describe only the two fields this file reads, with a guard.
interface InlineDataPart {
  inlineData?: { data?: string; mimeType?: string };
  text?: string;
}

function partsOf(response: unknown): InlineDataPart[] {
  if (typeof response !== 'object' || response === null) return [];
  const candidates = (response as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const content = (candidates[0] as { content?: { parts?: unknown } }).content;
  return Array.isArray(content?.parts) ? (content.parts as InlineDataPart[]) : [];
}

// ---------------------------------------------------------------------------
// Upload guards -- enforced before any model call, never after
// ---------------------------------------------------------------------------

export interface AudioUpload {
  bytes: Buffer;
  mimeType: string;
  /** Measured by the browser. Trusted only as a cheap early reject, not as proof. */
  durationSeconds?: number;
}

/**
 * Rejects an upload that breaches a cap.
 *
 * Order matters: size is checked first because it is the one that costs nothing
 * to check, then type, then duration. A request that fails here has not reached
 * Gemini, so it cannot cost anything.
 */
export function assertAudioWithinLimits(upload: AudioUpload): void {
  if (upload.bytes.byteLength === 0) {
    throw new HttpError(400, 'INVALID_INPUT', 'Empty audio upload');
  }
  if (upload.bytes.byteLength > VOICE_INTERVIEW_LIMITS.MAX_AUDIO_BYTES) {
    throw new HttpError(413, 'AUDIO_TOO_LARGE', 'Recording is too large');
  }
  const accepted = VOICE_AUDIO.ACCEPTED_MIME_PREFIXES.some((prefix) =>
    upload.mimeType.toLowerCase().startsWith(prefix)
  );
  if (!accepted) {
    throw new HttpError(415, 'AUDIO_UNSUPPORTED', `Unsupported audio type: ${upload.mimeType}`);
  }
  if (
    upload.durationSeconds !== undefined &&
    upload.durationSeconds > VOICE_INTERVIEW_LIMITS.MAX_AUDIO_SECONDS
  ) {
    throw new HttpError(413, 'AUDIO_TOO_LONG', 'Recording is too long');
  }
}

// ---------------------------------------------------------------------------
// Speech to text
// ---------------------------------------------------------------------------

const STT_INSTRUCTION: Record<'en' | 'km', string> = {
  en: 'Transcribe this audio verbatim in English. Output only the words spoken, with no commentary, no translation and no punctuation you did not hear. If the audio contains no speech, output nothing at all.',
  km: 'Transcribe this audio verbatim in Khmer script. Output only the words spoken, with no commentary, no translation into English and no added punctuation. If the audio contains no speech, output nothing at all.',
};

/**
 * Returns what the user said, or an empty string.
 *
 * An empty transcript is a normal outcome, not an error: a user may say nothing,
 * or decline a question by staying silent, and §5.3 treats silence as a complete
 * answer to an optional question. Throwing here would turn a valid refusal into
 * a failed turn.
 */
export async function transcribeAudio(
  upload: AudioUpload,
  locale: 'en' | 'km'
): Promise<string> {
  assertAudioWithinLimits(upload);

  const model = serverEnv.GEMINI_VOICE_STT_MODEL;
  assertConfiguredModel(model);

  const response = await genai().models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { text: STT_INSTRUCTION[locale] },
          {
            inlineData: {
              mimeType: upload.mimeType,
              data: upload.bytes.toString('base64'),
            },
          },
        ],
      },
    ],
  });

  return partsOf(response)
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

// ---------------------------------------------------------------------------
// Text to speech
// ---------------------------------------------------------------------------

/**
 * Wraps raw PCM in a WAV container.
 *
 * Gemini TTS returns headerless little-endian PCM, which no browser will play —
 * an <audio> element handed it produces silence with no error, which is exactly
 * the kind of failure that survives a casual test. The 44-byte RIFF header below
 * is the whole fix, and it has to be byte-exact.
 */
export function pcmToWav(
  pcm: Buffer,
  {
    sampleRate = VOICE_AUDIO.TTS_SAMPLE_RATE,
    channels = VOICE_AUDIO.TTS_CHANNELS,
    bitsPerSample = VOICE_AUDIO.TTS_BITS_PER_SAMPLE,
  }: { sampleRate?: number; channels?: number; bitsPerSample?: number } = {}
): Buffer {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  // Everything after this field: 36 header bytes + the samples.
  header.writeUInt32LE(36 + pcm.byteLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // PCM fmt chunk length
  header.writeUInt16LE(1, 20); // 1 = uncompressed PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.byteLength, 40);

  return Buffer.concat([header, pcm]);
}

/**
 * Gemini reports the PCM rate in its mime type (e.g. "audio/L16;rate=24000").
 * Reading it back beats assuming the constant: if the model's output rate ever
 * changes, a wrong rate plays at the wrong pitch rather than failing loudly.
 */
function sampleRateFromMime(mimeType: string | undefined): number {
  const match = /rate=(\d+)/i.exec(mimeType ?? '');
  const parsed = match ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : VOICE_AUDIO.TTS_SAMPLE_RATE;
}

export interface SpokenPrompt {
  wav: Buffer;
  mimeType: 'audio/wav';
}

// The Live API is conversational: given text it would normally answer it. This
// pins it to reading the text aloud, so what is heard is what is on screen.
const LIVE_SPEECH_INSTRUCTION =
  'You are a text-to-speech voice. Read the user\'s message aloud exactly as written, in the language it is written in. ' +
  'Do not answer it, add to it, translate it, or comment on it. Say nothing else.';

/**
 * Speaks `text` through a one-shot Gemini Live session: connect, send the text,
 * collect the audio until the model finishes its turn, close.
 *
 * Server-side on purpose. The audio never reaches a browser as a stream, so the
 * turn caps, the single debit and the "nothing stored" rule are untouched -- this
 * replaces only where the sound comes from. Works on both backends, since the
 * client is built for AI Studio or Vertex in genai().
 *
 * Throws on any failure; synthesizeSpeech turns that into a silent prompt.
 */
async function synthesizeWithLive(text: string): Promise<SpokenPrompt | null> {
  const model = serverEnv.GEMINI_VOICE_LIVE_MODEL;
  assertConfiguredModel(model);

  const chunks: Buffer[] = [];
  let mimeType: string | undefined;
  let received = 0;

  await new Promise<void>((resolve, reject) => {
    let session: Session | undefined;
    let settled = false;

    const finish = (outcome: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        session?.close();
      } catch {
        // Already closed; nothing to release.
      }
      outcome();
    };

    const timer = setTimeout(
      () => finish(() => reject(new Error('Live speech timed out'))),
      VOICE_AUDIO.LIVE_TIMEOUT_MS
    );

    const onMessage = (message: LiveServerMessage) => {
      const content = message.serverContent;

      for (const part of content?.modelTurn?.parts ?? []) {
        const data = part.inlineData?.data;
        if (!data) continue;

        const chunk = Buffer.from(data, 'base64');
        received += chunk.byteLength;
        if (received > VOICE_AUDIO.LIVE_MAX_AUDIO_BYTES) {
          finish(() => reject(new Error('Live speech exceeded the audio ceiling')));
          return;
        }
        mimeType ??= part.inlineData?.mimeType;
        chunks.push(chunk);
      }

      if (content?.turnComplete) finish(resolve);
    };

    genai()
      .live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: LIVE_SPEECH_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_AUDIO.TTS_VOICE } },
          },
        },
        callbacks: {
          onmessage: onMessage,
          onerror: (event: { message?: string }) =>
            finish(() => reject(new Error(event.message || 'Live speech error'))),
          // A close before turnComplete is a success only if audio arrived.
          onclose: () =>
            finish(() =>
              chunks.length > 0 ? resolve() : reject(new Error('Live session closed without audio'))
            ),
        },
      })
      .then((connected) => {
        session = connected;
        // Settled while the socket was still opening (timeout): release it now.
        if (settled) {
          connected.close();
          return;
        }
        // Text goes in as realtime input rather than client content: newer Live
        // models accept client content only to seed history.
        connected.sendRealtimeInput({ text });
      })
      .catch((error: unknown) => finish(() => reject(error)));
  });

  if (chunks.length === 0) return null;

  return {
    wav: pcmToWav(Buffer.concat(chunks), { sampleRate: sampleRateFromMime(mimeType) }),
    mimeType: 'audio/wav',
  };
}

// ---------------------------------------------------------------------------
// Live conversation: a short-lived, locked token the browser connects with
// ---------------------------------------------------------------------------

export interface LiveGrant {
  /** Ephemeral token. Single use, expires with the session, never the API key. */
  token: string;
  model: string;
  expiresAt: string;
}

/**
 * Browser-held Live sessions need ephemeral tokens, which the Gemini Developer
 * API (AI Studio) issues. Vertex AI has no equivalent, so there the interview
 * stays press-to-talk -- a browser cannot be given service-account credentials.
 */
export function isLiveConversationAvailable(): boolean {
  return serverEnv.GEMINI_BACKEND === 'ai-studio' && Boolean(serverEnv.GEMINI_API_KEY);
}

const LIVE_LANGUAGE_NAME = { en: 'English', km: 'Khmer' } as const;

/**
 * The interviewer's whole brief, locked into the token.
 *
 * Locked rather than sent by the browser because the browser is not trusted: a
 * client that could rewrite this could turn a paid interview into a general
 * chat with a billed model.
 *
 * The model is told what to find out and where to start, then left to run the
 * conversation and to judge when it has enough. It writes nothing: the CV is
 * built afterwards from the full transcript (see interviewConsolidation), and the
 * server checks that every required detail made it in. If the model stops early,
 * the client is told what is missing and offers to carry on, so a wrong judgement
 * costs a second round, not a hole in the CV.
 *
 * The lists are generated from the same field table the server extracts and
 * checks against, so the brief cannot drift from what is actually required.
 */
function liveInstruction(locale: 'en' | 'km'): string {
  const fields = FREE_FORM_QUESTION.fields;
  const list = (items: typeof fields) => items.map((field) => `- ${FIELD_TOPICS[field.path].ask}`).join('\n');

  const required = fields.filter((field) => field.required);
  const optional = fields.filter((field) => !field.required && !FIELD_TOPICS[field.path].sensitive);
  const personal = fields.filter((field) => FIELD_TOPICS[field.path].sensitive);

  return [
    `You are a warm, patient interviewer helping someone make a short CV. Speak ${LIVE_LANGUAGE_NAME[locale]}.`,
    'Many people you talk to are job seekers with little formal schooling. Use short sentences and everyday words. Never use jargon.',
    '',
    'WHAT YOU NEED TO FIND OUT',
    'You must get all of these:',
    list(required),
    'Also ask about these, once each, if the person has anything to say:',
    list(optional),
    'These are personal. Ask each at most once, gently, tell the person they may skip, and never press if they decline:',
    list(personal),
    '',
    'HOW TO RUN IT',
    'Start by greeting them warmly in one short sentence, then ask for their name and the job they want.',
    'After that a good order is: phone number and where they live, date of birth, school or courses, work experience and languages, what they enjoy, how they would describe themselves, and last the personal details.',
    'It is a conversation, not a form. Ask one or two things at a time in your own words, react briefly and kindly, and if the person goes somewhere else, follow them and come back to anything you still need.',
    'Repeat phone numbers and spelled names back to check you heard them right. If you are unsure of anything, ask them to say it again.',
    'Never invent, assume or guess anything about the person.',
    '',
    'WHEN TO STOP',
    'Keep track yourself of what you have learned. Keep going until you have everything in the first list and have offered each topic in the second.',
    'If the person says they want to stop, or to skip something, respect that.',
    'When you have enough, call end_interview, then say a short thank-you and goodbye. Never mention tools or lists.',
  ].join('\n');
}

/**
 * Mints the token for one live interview. Making it is also the liveness check
 * that decides whether to charge: it is an authenticated call, so a revoked,
 * expired or out-of-credit key fails here before the user is billed.
 */
export async function mintLiveGrant(locale: 'en' | 'km'): Promise<LiveGrant> {
  const model = serverEnv.GEMINI_VOICE_LIVE_MODEL;
  assertConfiguredModel(model);

  // Ephemeral tokens exist only on the v1alpha surface, so this is a dedicated
  // client rather than the shared one.
  const tokens = new GoogleGenAI({
    apiKey: serverEnv.GEMINI_API_KEY,
    httpOptions: { apiVersion: 'v1alpha' },
  }).authTokens;

  const expiresAt = new Date(Date.now() + VOICE_INTERVIEW_LIMITS.SESSION_TTL_SECONDS * 1000).toISOString();

  const created = await tokens.create({
    config: {
      // One socket, ever. Resuming a dropped connection does not count as a use.
      uses: 1,
      expireTime: expiresAt,
      newSessionExpireTime: new Date(
        Date.now() + VOICE_AUDIO.LIVE_TOKEN_START_WINDOW_SECONDS * 1000
      ).toISOString(),
      liveConnectConstraints: {
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: liveInstruction(locale),
          // Both sides are transcribed: the CV is built from the whole conversation
          // when the call ends. The browser keeps it in memory and sends it once;
          // it is never stored or logged.
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_AUDIO.TTS_VOICE } },
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'end_interview',
                  description:
                    'Call once when you have everything you need and the conversation is finished. The call ends after you say goodbye.',
                },
              ],
            },
          ],
        },
      },
    },
  });

  if (!created.name) throw new Error('Live token response had no token');
  return { token: created.name, model, expiresAt };
}

/**
 * Speaks a question through Gemini Live. Returns null rather than throwing when
 * speech is unavailable or the model returns no audio: the question text is
 * always shown on screen, so a silent prompt degrades the experience without
 * breaking the interview.
 *
 * Null also means "pipeline down" to the session route, which then does not
 * charge -- so a Live outage costs the user nothing.
 */
export async function synthesizeSpeech(text: string): Promise<SpokenPrompt | null> {
  if (!text.trim()) return null;

  // Logged because a silent null is indistinguishable from a working pipeline
  // that simply had nothing to say, and the UI only reports "speaking isn't
  // available" without saying why.
  if (!isVoiceAvailable()) {
    console.error(
      serverEnv.GEMINI_BACKEND === 'vertex'
        ? 'Voice synthesis skipped: GEMINI_BACKEND=vertex but GCP_PROJECT is not set'
        : 'Voice synthesis skipped: GEMINI_API_KEY is not set'
    );
    return null;
  }

  try {
    return await synthesizeWithLive(text);
  } catch (error) {
    // Message only, never the text: prompts are fixed copy, but this path is one
    // edit away from carrying a user's own words, and transcripts must not reach
    // logs.
    console.error('Voice synthesis failed:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}
