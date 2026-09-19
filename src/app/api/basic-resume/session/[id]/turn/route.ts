import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { resolveAiRequest } from '@/server/modules/ai/registry';
import {
  assertAudioWithinLimits,
  isVoiceAvailable,
  synthesizeSpeech,
  transcribeAudio,
} from '@/server/modules/ai/clients/gemini-voice';
import {
  extractAnswer,
  fallbackExtraction,
} from '@/server/modules/ai/workflows/interviewExtraction';
import {
  findOwnedBasicResume,
  updateBasicResumeWithVersionCheck,
} from '@/server/modules/resumes/resumePersistenceService';
import {
  advanceSession,
  currentQuestion,
  decideTurn,
  loadOwnedSession,
} from '@/server/modules/resumes/voiceInterviewService';
import { VOICE_INTERVIEW_LIMITS } from '@/shared/config/constants';
import { BASIC_INTERVIEW_SCRIPT } from '@/shared/lib/basic-interview-script';
import { promptFor } from '@/shared/lib/basic-interview-prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * One conversational turn: hear, understand, record, ask the next thing.
 *
 * Never debits. The session-start charge covers every turn, which is only safe
 * because the turn cap below is checked before anything expensive happens.
 *
 * Accepts either an audio blob or typed text through the same path. The typed
 * path is not a fallback bolted on for testing -- it is the accessibility route
 * for deaf and hard-of-hearing users, the recovery route when there is no
 * microphone, and the correction route when speech recognition mishears a name.
 */
export const POST = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  const session = await loadOwnedSession(user.id, id);

  // Checked before reading the body, let alone calling a model: a turn past the
  // cap must cost nothing.
  if (session.turnCount >= VOICE_INTERVIEW_LIMITS.MAX_TURNS) {
    throw new HttpError(409, 'SESSION_EXHAUSTED', 'This interview has used all its turns');
  }

  const question = currentQuestion(session);
  if (!question) {
    throw new HttpError(409, 'SESSION_EXHAUSTED', 'This interview has no question pending');
  }

  const resume = await findOwnedBasicResume(user.id, session.resumeId);
  if (!resume) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  const locale = session.locale === 'km' ? 'km' : 'en';
  const form = await req.formData();
  const transcript = await readAnswer(form, locale);

  // Extraction is the one call that consumes a real, admin-tunable model choice,
  // so it is the one that goes through the registry seam as normal.
  const { chatModel } = await resolveAiRequest({ action: 'VOICE_INTERVIEW' });
  const result = transcript
    ? await extractAnswer(chatModel, question, transcript, locale)
    : ({ ok: true, value: null } as const);

  // A model outage must not cost the user their answer. When extraction is
  // unreachable the transcript is recorded as spoken, deterministically parsed
  // and never embellished -- a degraded CV, not an empty one.
  const degraded = !result.ok;
  const extracted = result.ok ? result.value : fallbackExtraction(question, transcript);

  const outcome = decideTurn({
    question,
    data: resume.data,
    extracted,
    followUpUsed: session.followUpUsed,
    turnCount: session.turnCount,
  });

  // Written through the same compare-and-swap every other resume write uses, so
  // a typed correction in another tab cannot be silently clobbered by a turn.
  const saved = await updateBasicResumeWithVersionCheck(user.id, resume.id, resume.version, {
    data: outcome.data as unknown as Prisma.InputJsonValue,
  });
  if (saved.status === 'not-found') {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  await advanceSession(session.id, outcome);

  const nextText = outcome.next ? promptFor(outcome.next.id, locale, outcome.isFollowUp) : '';
  const spoken = nextText ? await synthesizeSpeech(nextText) : null;

  return NextResponse.json({
    transcript,
    // The extracted value travels back so the user can see and correct what the
    // model heard, before it is buried in the finished CV.
    extracted,
    question: outcome.next && {
      id: outcome.next.id,
      text: nextText,
      optional: outcome.next.optional,
    },
    isFollowUp: outcome.isFollowUp,
    position: outcome.position,
    total: BASIC_INTERVIEW_SCRIPT.length,
    finished: outcome.finished,
    exhausted: outcome.exhausted,
    // Told, not hidden: the user should know their answer was saved as spoken
    // rather than understood, so they know to check it.
    degraded,
    resume: saved.resume,
    // A lost race is reported rather than hidden: the winning row is in `resume`.
    conflict: saved.status === 'conflict',
    audio: spoken ? spoken.wav.toString('base64') : null,
  });
});

/**
 * Turns whatever the client sent into words.
 *
 * Typed text wins when both are present -- if a user typed a correction they
 * meant it, and re-transcribing the audio would overwrite it.
 */
async function readAnswer(form: FormData, locale: 'en' | 'km'): Promise<string> {
  const typed = form.get('text');
  if (typeof typed === 'string' && typed.trim()) {
    return typed.trim();
  }

  const audio = form.get('audio');
  if (!(audio instanceof Blob)) return '';

  const durationRaw = form.get('durationSeconds');
  const durationSeconds =
    typeof durationRaw === 'string' && durationRaw ? Number(durationRaw) : undefined;

  const upload = {
    bytes: Buffer.from(await audio.arrayBuffer()),
    mimeType: audio.type || 'audio/webm',
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
  };

  // Throws before any model call on an over-size, over-long or wrong-type upload.
  assertAudioWithinLimits(upload);

  if (!isVoiceAvailable()) return '';

  // An empty transcript is a normal answer -- silence, or a refusal -- not a
  // failure, so a transcription error degrades to "said nothing" and the turn
  // policy handles it from there.
  return transcribeAudio(upload, locale).catch(() => '');
}
