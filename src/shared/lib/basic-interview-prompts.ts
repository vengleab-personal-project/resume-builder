import en from '@/shared/messages/en';
import km from '@/shared/messages/km';
import { findInterviewQuestion } from '@/shared/lib/basic-interview-script';

/**
 * The words a question is asked in.
 *
 * Resolved on the server rather than the client because the server is what
 * speaks them: the text shown on screen and the text sent to text-to-speech have
 * to be the same string, or a user hears one question and reads another.
 *
 * `followUp` falls back to the original prompt, so a question marked
 * follow-up-allowed without follow-up copy re-asks itself rather than going
 * silent.
 */
export function promptFor(
  questionId: string,
  locale: 'en' | 'km',
  followUp = false
): string {
  const question = findInterviewQuestion(questionId);
  if (!question) return '';

  const dictionary = locale === 'km' ? km : en;
  const copy = dictionary.basicInterview.questions[question.promptKey] as {
    prompt: string;
    followUp?: string;
  };

  return (followUp && copy.followUp) || copy.prompt;
}
