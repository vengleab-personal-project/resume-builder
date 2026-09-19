import 'server-only';
import { GoogleGenAI, Modality } from '@google/genai';
import { serverEnv } from '@/server/config/env.server';
import { VOICE_AUDIO, VOICE_INTERVIEW_LIMITS } from '@/shared/config/constants';
import { HttpError } from '@/server/errors';

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

function genai(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: serverEnv.GEMINI_API_KEY });
  }
  return client;
}

/** Whether a real voice pipeline is reachable. False means typed-only, unbilled. */
export function isVoiceAvailable(): boolean {
  return Boolean(serverEnv.GEMINI_API_KEY);
}

function assertConfiguredModel(modelId: string): void {
  const allowed = [serverEnv.GEMINI_VOICE_STT_MODEL, serverEnv.GEMINI_VOICE_TTS_MODEL];
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

/**
 * Speaks a question. Returns null rather than throwing when speech is
 * unavailable or the model returns no audio: the question text is always shown
 * on screen, so a silent prompt degrades the experience without breaking the
 * interview.
 */
export async function synthesizeSpeech(text: string): Promise<SpokenPrompt | null> {
  if (!isVoiceAvailable() || !text.trim()) return null;

  const model = serverEnv.GEMINI_VOICE_TTS_MODEL;
  assertConfiguredModel(model);

  try {
    const response = await genai().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_AUDIO.TTS_VOICE } },
        },
      },
    });

    const audioPart = partsOf(response).find((part) => part.inlineData?.data);
    if (!audioPart?.inlineData?.data) return null;

    return {
      wav: pcmToWav(Buffer.from(audioPart.inlineData.data, 'base64'), {
        sampleRate: sampleRateFromMime(audioPart.inlineData.mimeType),
      }),
      mimeType: 'audio/wav',
    };
  } catch (error) {
    // Never log the text: prompts are fixed copy, but this path is one edit away
    // from carrying a user's own words, and transcripts must not reach logs.
    console.error('Voice synthesis failed:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}
