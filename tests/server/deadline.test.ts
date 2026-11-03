import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiTimeoutError, withDeadline } from '@/server/modules/ai/clients/deadline';

describe('withDeadline', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the result and leaves no timer behind', async () => {
    await expect(withDeadline('X', async () => 'ok', 1000)).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with AiTimeoutError and aborts the signal when the call hangs', async () => {
    let seen: AbortSignal | undefined;
    const pending = withDeadline(
      'Gemini',
      (signal) => {
        seen = signal;
        return new Promise<never>(() => {});
      },
      1000
    );
    const assertion = expect(pending).rejects.toBeInstanceOf(AiTimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(seen?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the "timed out" wording callers match on', async () => {
    const pending = withDeadline('OpenAI', () => new Promise<never>(() => {}), 50);
    const assertion = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('reports an SDK abort caused by the deadline as the timeout', async () => {
    const pending = withDeadline(
      'OpenAI',
      (signal) =>
        new Promise<never>((_, reject) =>
          signal.addEventListener('abort', () => reject(new Error('Request was aborted.')))
        ),
      50
    );
    const assertion = expect(pending).rejects.toBeInstanceOf(AiTimeoutError);
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('passes the provider\'s own errors through untouched', async () => {
    const boom = new Error('quota');
    await expect(withDeadline('X', async () => Promise.reject(boom), 1000)).rejects.toBe(boom);
    expect(vi.getTimerCount()).toBe(0);
  });
});
