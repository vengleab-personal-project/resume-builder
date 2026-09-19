import 'server-only';
import type { Prisma, VoiceInterviewSession } from '@/server/db/generated/prisma';
import { prisma } from '@/server/db/prisma';
import { HttpError } from '@/server/errors';
import { VOICE_INTERVIEW_LIMITS } from '@/shared/config/constants';
import {
  BASIC_INTERVIEW_SCRIPT,
  findInterviewQuestion,
  interviewQuestionPosition,
  nextInterviewQuestion,
  type InterviewQuestion,
} from '@/shared/lib/basic-interview-script';
import { applyExtractedValue, isQuestionAnswered } from '@/shared/lib/basic-resume-merge';
import type { BasicResumeData } from '@/shared/types/basic-resume';

export type InterviewLocale = 'en' | 'km';

/**
 * Session state and the turn policy. The rules here are what make a single coin
 * debit safe: every one of them is enforced server-side, and none of them
 * depends on anything the client sends.
 */

export function isSessionUsable(session: VoiceInterviewSession): boolean {
  return session.status === 'ACTIVE' && session.expiresAt.getTime() > Date.now();
}

/**
 * The user's live session, if they have one.
 *
 * Starting a second session while one is alive returns the first rather than
 * charging again -- a user who reloads the page mid-interview must not be
 * billed twice for the same CV.
 */
export async function findActiveSession(userId: string): Promise<VoiceInterviewSession | null> {
  const session = await prisma.voiceInterviewSession.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.voiceInterviewSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
    return null;
  }

  return session;
}

export async function createSession(params: {
  userId: string;
  resumeId: string;
  locale: InterviewLocale;
  questionId: string;
  deductionTxId?: string | null;
}): Promise<VoiceInterviewSession> {
  return prisma.voiceInterviewSession.create({
    data: {
      userId: params.userId,
      resumeId: params.resumeId,
      locale: params.locale,
      questionId: params.questionId,
      deductionTxId: params.deductionTxId ?? null,
      expiresAt: new Date(Date.now() + VOICE_INTERVIEW_LIMITS.SESSION_TTL_SECONDS * 1000),
    },
  });
}

export async function loadOwnedSession(
  userId: string,
  sessionId: string
): Promise<VoiceInterviewSession> {
  const session = await prisma.voiceInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) {
    throw new HttpError(404, 'NOT_FOUND', 'Interview session not found');
  }
  if (session.status === 'EXHAUSTED') {
    throw new HttpError(409, 'SESSION_EXHAUSTED', 'This interview has used all its turns');
  }
  if (!isSessionUsable(session)) {
    throw new HttpError(410, 'SESSION_EXPIRED', 'This interview has ended');
  }
  return session;
}

export async function finishSession(
  sessionId: string,
  status: 'COMPLETED' | 'EXHAUSTED' | 'EXPIRED'
): Promise<void> {
  await prisma.voiceInterviewSession.update({ where: { id: sessionId }, data: { status } });
}

/** Where the interview is, from the session's cursor. */
export function currentQuestion(session: VoiceInterviewSession): InterviewQuestion | null {
  if (!session.questionId) return null;
  return findInterviewQuestion(session.questionId) ?? null;
}

export interface TurnOutcome {
  /** The CV after this answer was merged in. Unchanged if nothing was extracted. */
  data: BasicResumeData;
  /** The question to ask next, or null when the interview is over. */
  next: InterviewQuestion | null;
  /** True when `next` is a re-ask of the same question rather than a new one. */
  isFollowUp: boolean;
  /** 1-based position of `next` in the script, for "step N of 15". */
  position: number;
  finished: boolean;
  exhausted: boolean;
}

/**
 * The turn policy, as one pure decision.
 *
 * Separated from the route and from every I/O call so the rule that matters --
 * the interview always terminates -- can be reasoned about and exercised on its
 * own. A question gets at most one follow-up, and the second answer advances the
 * script whatever it contains.
 */
export function decideTurn(params: {
  question: InterviewQuestion;
  data: BasicResumeData;
  extracted: unknown;
  followUpUsed: boolean;
  turnCount: number;
  makeId?: () => string;
}): TurnOutcome {
  const merged = applyExtractedValue(params.data, params.question, params.extracted, params.makeId);
  const answered = isQuestionAnswered(merged, params.question);

  const turnsSpent = params.turnCount + 1;
  const exhausted = turnsSpent >= VOICE_INTERVIEW_LIMITS.MAX_TURNS;

  // An optional question is never followed up on. Gender, marital status and
  // health are conventional on this CV format and are sensitive personal data:
  // silence is a complete answer and the app must not push for another.
  const deservesFollowUp =
    !answered && !params.question.optional && params.question.followUpAllowed && !params.followUpUsed;

  if (deservesFollowUp && !exhausted) {
    return {
      data: merged,
      next: params.question,
      isFollowUp: true,
      position: interviewQuestionPosition(params.question.id),
      finished: false,
      exhausted: false,
    };
  }

  const next = exhausted ? null : nextInterviewQuestion(params.question.id);

  return {
    data: merged,
    next,
    isFollowUp: false,
    position: next ? interviewQuestionPosition(next.id) : BASIC_INTERVIEW_SCRIPT.length,
    finished: next === null,
    exhausted,
  };
}

export async function advanceSession(
  sessionId: string,
  outcome: TurnOutcome
): Promise<void> {
  const data: Prisma.VoiceInterviewSessionUpdateInput = {
    turnCount: { increment: 1 },
    questionId: outcome.next?.id ?? null,
    followUpUsed: outcome.isFollowUp,
  };

  if (outcome.exhausted) data.status = 'EXHAUSTED';
  else if (outcome.finished) data.status = 'COMPLETED';

  await prisma.voiceInterviewSession.update({ where: { id: sessionId }, data });
}

export async function setCursor(sessionId: string, questionId: string): Promise<void> {
  await prisma.voiceInterviewSession.update({
    where: { id: sessionId },
    data: { questionId, followUpUsed: false },
  });
}
