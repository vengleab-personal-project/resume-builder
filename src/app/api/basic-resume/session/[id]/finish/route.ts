import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@/server/db/generated/prisma';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { resolveAiRequest } from '@/server/modules/ai/registry';
import { consolidateConversation } from '@/server/modules/ai/workflows/interviewConsolidation';
import {
  findOwnedBasicResume,
  updateBasicResumeWithVersionCheck,
} from '@/server/modules/resumes/resumePersistenceService';
import {
  claimTurn,
  finishSession,
  loadOwnedSession,
  releaseTurn,
  setCursor,
} from '@/server/modules/resumes/voiceInterviewService';
import { BASIC_INTERVIEW_SCRIPT } from '@/shared/lib/basic-interview-script';
import { applyExtractedValue, isFieldFilled, isQuestionAnswered } from '@/shared/lib/basic-resume-merge';
import { FREE_FORM_QUESTION, missingTopics } from '@/shared/lib/basic-interview-topics';
import { promptFor } from '@/shared/lib/basic-interview-prompts';
import { VOICE_INTERVIEW_LIMITS } from '@/shared/config/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// A thirty-minute conversation is a few thousand words. These are ceilings on
// what reaches the model, not targets: the transcript is user speech, and the
// call is billed to a single per-session debit.
const MAX_ENTRIES = 300;
const MAX_ENTRY_CHARS = 2000;
const MAX_TOTAL_CHARS = 30_000;

const finishSchema = z
  .object({
    dialogue: z
      .array(
        z.object({
          role: z.enum(['interviewer', 'person']),
          text: z.string().max(MAX_ENTRY_CHARS),
        })
      )
      .max(MAX_ENTRIES),
  })
  .refine((body) => body.dialogue.reduce((total, entry) => total + entry.text.length, 0) <= MAX_TOTAL_CHARS);

// Two tries: the first can lose a race with a typed edit in another tab, and the
// second runs against the row that won.
const SAVE_ATTEMPTS = 2;

/**
 * The end of a live conversation: the whole transcript in, a structured CV out.
 *
 * Nothing is saved while the call is running. The model asks what it likes, in
 * any order, and decides for itself when it has heard enough; the browser keeps
 * the transcript in memory and sends it here once. One structured-output pass
 * over the full conversation then fills the CV (see interviewConsolidation), and
 * the response says what is still missing so the client can offer to carry on.
 *
 * The transcript is read, extracted from and dropped -- never stored or logged.
 *
 * `consolidated: false` means the model could not be reached. Nothing was lost:
 * the browser still holds the transcript and can send it again, and the turn
 * this claimed is given back so the retry is not counted twice.
 */
export const POST = withErrorHandling(async (req: NextRequest, context: RouteContext) => {
  assertSameOrigin(req);

  const user = await requireUser();
  const { id } = await context.params;

  const parsed = finishSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid transcript');
  }
  const { dialogue } = parsed.data;

  const session = await loadOwnedSession(user.id, id);
  const locale = session.locale === 'km' ? 'km' : 'en';

  const found = await findOwnedBasicResume(user.id, session.resumeId);
  if (!found) {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }
  let resume = found;
  let consolidated = true;
  let conflict = false;
  let exhausted = false;

  const saidAnything = dialogue.some((entry) => entry.role === 'person' && entry.text.trim());

  if (saidAnything) {
    // Before the claim and before any model call: a request past the cap costs nothing.
    if (session.turnCount >= VOICE_INTERVIEW_LIMITS.MAX_TURNS) {
      throw new HttpError(409, 'SESSION_EXHAUSTED', 'This interview has used all its turns');
    }
    if (!(await claimTurn(session))) {
      // Another request for this session is being processed, or it just ended.
      throw new HttpError(429, 'RATE_LIMITED', 'This interview is already being saved');
    }

    const { chatModel } = await resolveAiRequest({ action: 'VOICE_INTERVIEW' });
    const result = await consolidateConversation(chatModel, dialogue, locale);

    if (!result.ok) {
      // No deterministic parse can stand in for understanding a conversation, so
      // nothing is guessed. The transcript stays with the browser for a retry.
      await releaseTurn(session.id);
      consolidated = false;
    } else {
      for (let attempt = 0; attempt < SAVE_ATTEMPTS; attempt += 1) {
        const merged = applyExtractedValue(resume.data, FREE_FORM_QUESTION, result.value, undefined, {
          appendLists: true,
        });
        const saved = await updateBasicResumeWithVersionCheck(user.id, resume.id, resume.version, {
          data: merged as unknown as Prisma.InputJsonValue,
        });

        if (saved.status === 'not-found') {
          throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
        }
        resume = saved.resume;
        if (saved.status === 'updated') {
          conflict = false;
          break;
        }
        conflict = true;
      }

      if (session.turnCount + 1 >= VOICE_INTERVIEW_LIMITS.MAX_TURNS) {
        await finishSession(session.id, 'EXHAUSTED');
        exhausted = true;
      }
    }
  }

  const missing = missingTopics(resume.data);
  // Done when nothing required is missing -- decided here, from the CV, not by
  // the model's sense of the conversation.
  const done = consolidated && missing.required.length === 0;
  if (done && !exhausted) {
    await finishSession(session.id, 'COMPLETED');
  }

  // Keep the structured cursor on the first section still needing something, so
  // continuing in press-to-talk resumes there rather than re-asking what the
  // conversation already covered.
  const nextSection =
    BASIC_INTERVIEW_SCRIPT.find((section) => !isQuestionAnswered(resume.data, section)) ??
    BASIC_INTERVIEW_SCRIPT.find((section) => section.fields.some((field) => !isFieldFilled(resume.data, field)));
  if (nextSection && nextSection.id !== session.questionId && !done) {
    await setCursor(session.id, nextSection.id);
  }

  return NextResponse.json({
    consolidated,
    done,
    exhausted,
    conflict,
    resume,
    question:
      nextSection && !done
        ? { id: nextSection.id, text: promptFor(nextSection.id, locale, false), optional: nextSection.optional }
        : null,
  });
});
