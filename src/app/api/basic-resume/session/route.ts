import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { withCoinDeduction } from '@/server/modules/billing/coinService';
import { resolveAiRequest } from '@/server/modules/ai/registry';
import {
  isLiveConversationAvailable,
  mintLiveGrant,
  synthesizeSpeech,
  type LiveGrant,
} from '@/server/modules/ai/clients/gemini-voice';
import {
  createResume,
  findOwnedBasicResume,
  toBasicResumeDTO,
} from '@/server/modules/resumes/resumePersistenceService';
import {
  createSession,
  currentQuestion,
  findActiveSession,
  setCursor,
} from '@/server/modules/resumes/voiceInterviewService';
import {
  BASIC_INTERVIEW_SCRIPT,
  nextInterviewQuestion,
} from '@/shared/lib/basic-interview-script';
import { BASIC_SECTION_ORDER, createEmptyBasicResumeData } from '@/shared/lib/basic-resume';
import { promptFor } from '@/shared/lib/basic-interview-prompts';
import { INITIAL_THEME } from '@/shared/config/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startSchema = z.object({
  locale: z.enum(['en', 'km']),
  resumeId: z.string().min(1).optional(),
  // Ask for a live conversation. Honoured only where the backend can issue
  // browser tokens; otherwise the response says `live: null` and the client runs
  // press-to-talk, so asking never fails the start.
  live: z.boolean().optional(),
  fresh: z.boolean().optional(),
});

/** A live grant, or null when live was not asked for, is not possible, or failed. */
async function liveGrantFor(wanted: boolean | undefined, locale: 'en' | 'km'): Promise<LiveGrant | null> {
  if (!wanted || !isLiveConversationAvailable()) return null;
  try {
    return await mintLiveGrant(locale);
  } catch (error) {
    console.error('Live token failed:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

/**
 * Starts an interview.
 *
 * The VOICE_INTERVIEW debit happens here, once, and covers the whole session.
 * Per-turn billing was rejected deliberately: it makes the price of a CV
 * unpredictable to a user who can re-answer a question, and it is unenforceable
 * in a flow the user can restart. What makes one charge safe is that the session
 * is bounded server-side -- 12 turns, 30 minutes, 120s and 5MB per upload.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const parsed = startSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid session request');
  }
  const { locale, resumeId, live: wantsLive, fresh } = parsed.data;

  // Resuming rather than starting: return the live session untouched and,
  // crucially, do not debit again.
  const existing = await findActiveSession(user.id, resumeId);
  if (existing) {
    if (fresh) {
      const first = nextInterviewQuestion(null);
      if (first) {
        await setCursor(existing.id, first.id);
        existing.questionId = first.id;
        existing.followUpUsed = false;
      }
    }
    const question = currentQuestion(existing) ?? nextInterviewQuestion(null);
    const resume = await findOwnedBasicResume(user.id, existing.resumeId);
    const text = question ? promptFor(question.id, existing.locale as 'en' | 'km', false) : '';
    // Resuming never debits, so a fresh token costs nothing; the old one was
    // single-use and may already be spent.
    const liveGrant = text ? await liveGrantFor(wantsLive, existing.locale === 'km' ? 'km' : 'en') : null;
    const spoken = !liveGrant && text ? await synthesizeSpeech(text) : null;
    return NextResponse.json({
      sessionId: existing.id,
      resumeId: existing.resumeId,
      resumed: !fresh,
      locale: existing.locale,
      question: question && { id: question.id, text, optional: question.optional },
      position: question ? BASIC_INTERVIEW_SCRIPT.findIndex((q) => q.id === question.id) + 1 : 0,
      total: BASIC_INTERVIEW_SCRIPT.length,
      resume,
      voice: liveGrant !== null || spoken !== null,
      live: liveGrant,
      audio: spoken ? spoken.wav.toString('base64') : null,
    });
  }

  const target = resumeId
    ? await findOwnedBasicResume(user.id, resumeId)
    : toBasicResumeDTO(
        await createResume(user.id, {
          title: 'Basic CV',
          kind: 'BASIC',
          data: createEmptyBasicResumeData() as unknown as Prisma.InputJsonValue,
          sectionOrder: [...BASIC_SECTION_ORDER] as unknown as Prisma.InputJsonValue,
          theme: INITIAL_THEME as unknown as Prisma.InputJsonValue,
        })
      );

  if (!target) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  const { chatModel } = await resolveAiRequest({ action: 'VOICE_INTERVIEW' });
  const first = nextInterviewQuestion(null);
  if (!first) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Interview script is empty');
  }
  const text = promptFor(first.id, locale, false);

  const charged = await withCoinDeduction(
    { userId: user.id, action: 'VOICE_INTERVIEW', modelId: chatModel.modelId },
    async () => {
      const session = await createSession({
        userId: user.id,
        resumeId: target.id,
        locale,
        questionId: first.id,
      });

      // Minting the live token (or, in press-to-talk, speaking the first
      // question) is the one model call this route makes, so it doubles as the
      // liveness check that decides whether to charge.
      // Checking only that a key is *present* is not enough: a key that is
      // expired, revoked or out of credit charges the user five coins for an
      // interview that then cannot understand a word they say. If this fails the
      // interview still runs -- typed, with the questions on screen -- and is
      // free, which is the same rule every other fallback path in this app
      // follows.
      const liveGrant = await liveGrantFor(wantsLive, locale);
      const spoken = liveGrant ? null : await synthesizeSpeech(text);

      return { data: { session, spoken, liveGrant }, billable: liveGrant !== null || spoken !== null };
    }
  );

  return NextResponse.json(
    {
      sessionId: charged.data.session.id,
      resumeId: target.id,
      resumed: false,
      locale,
      question: { id: first.id, text, optional: first.optional },
      position: 1,
      total: BASIC_INTERVIEW_SCRIPT.length,
      resume: target,
      charged: charged.charged,
      balance: charged.balance,
      // False whenever speech did not actually work, whatever the reason, so the
      // UI shows the typed-only notice rather than a microphone that cannot help.
      voice: charged.data.liveGrant !== null || charged.data.spoken !== null,
      live: charged.data.liveGrant,
      audio: charged.data.spoken ? charged.data.spoken.wav.toString('base64') : null,
    },
    { status: 201 }
  );
});
