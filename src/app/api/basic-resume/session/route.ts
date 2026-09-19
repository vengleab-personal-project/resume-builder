import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { withCoinDeduction } from '@/server/modules/billing/coinService';
import { resolveAiRequest } from '@/server/modules/ai/registry';
import { isVoiceAvailable, synthesizeSpeech } from '@/server/modules/ai/clients/gemini-voice';
import {
  createResume,
  findOwnedBasicResume,
  toBasicResumeDTO,
} from '@/server/modules/resumes/resumePersistenceService';
import {
  createSession,
  currentQuestion,
  findActiveSession,
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
});

/**
 * Starts an interview.
 *
 * The VOICE_INTERVIEW debit happens here, once, and covers the whole session.
 * Per-turn billing was rejected deliberately: it makes the price of a CV
 * unpredictable to a user who can re-answer a question, and it is unenforceable
 * in a flow the user can restart. What makes one charge safe is that the session
 * is bounded server-side -- 30 turns, 30 minutes, 60s and 5MB per upload.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const parsed = startSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid session request');
  }
  const { locale, resumeId } = parsed.data;

  // Resuming rather than starting: return the live session untouched and,
  // crucially, do not debit again.
  const existing = await findActiveSession(user.id);
  if (existing) {
    const question = currentQuestion(existing) ?? nextInterviewQuestion(null);
    const resume = await findOwnedBasicResume(user.id, existing.resumeId);
    const text = question ? promptFor(question.id, existing.locale as 'en' | 'km', false) : '';
    return NextResponse.json({
      sessionId: existing.id,
      resumeId: existing.resumeId,
      resumed: true,
      locale: existing.locale,
      question: question && { id: question.id, text, optional: question.optional },
      position: question ? BASIC_INTERVIEW_SCRIPT.findIndex((q) => q.id === question.id) + 1 : 0,
      total: BASIC_INTERVIEW_SCRIPT.length,
      resume,
      audio: question ? await spokenPrompt(text) : null,
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
      return {
        data: session,
        // Without an API key there is no speech to pay for: the interview still
        // runs, typed only, and must not be charged for a path that never called
        // a model.
        billable: isVoiceAvailable(),
      };
    }
  );

  return NextResponse.json(
    {
      sessionId: charged.data.id,
      resumeId: target.id,
      resumed: false,
      locale,
      question: { id: first.id, text, optional: first.optional },
      position: 1,
      total: BASIC_INTERVIEW_SCRIPT.length,
      resume: target,
      charged: charged.charged,
      balance: charged.balance,
      voice: isVoiceAvailable(),
      audio: await spokenPrompt(text),
    },
    { status: 201 }
  );
});

/** Base64 rather than a second round trip: a prompt is a couple of seconds of audio. */
async function spokenPrompt(text: string): Promise<string | null> {
  const spoken = await synthesizeSpeech(text);
  return spoken ? spoken.wav.toString('base64') : null;
}
