import 'server-only';
import { AI_REQUEST_LIMITS } from '@/shared/config/constants';

/** An AI provider call that ran past its budget. The message keeps the "timed out" wording callers match on. */
export class AiTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} request timed out after ${timeoutMs}ms`);
    this.name = 'AiTimeoutError';
  }
}

/**
 * Runs a provider call under a hard deadline.
 *
 * The routes that call models have a 60s platform limit (`vercel.json`), and a call still
 * running when the platform kills the function never reaches `withCoinDeduction`'s
 * compensating refund -- the user keeps paying for an answer that never came. So the
 * budget is shorter than the limit, and on expiry the call is aborted *and* this rejects,
 * whether or not the SDK honours the signal (the Vertex one does not), so the caller's
 * error path and refund run with time to spare.
 *
 * The timer is always cleared; the older `Promise.race` + `setTimeout` version left it
 * (and the request) running to completion in the background.
 */
export async function withDeadline<T>(
  label: string,
  work: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = AI_REQUEST_LIMITS.DEADLINE_MS
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AiTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([work(controller.signal), expired]);
  } catch (error) {
    // An SDK that aborts on the signal rejects with its own AbortError; that is this timeout.
    if (controller.signal.aborted && !(error instanceof AiTimeoutError)) {
      throw new AiTimeoutError(label, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    // `work` may still settle after losing the race; make sure that is not an unhandled rejection.
  }
}
