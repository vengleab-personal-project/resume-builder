import { describe, expect, it } from 'vitest';
import { sanitizeHTML } from '@/shared/lib/sanitize';

// With no DOM the sanitizer must fail closed: markup is dropped, never passed through.
describe('sanitizeHTML (no DOM)', () => {
  it('never returns markup', () => {
    const out = sanitizeHTML('<p>hi</p><img src=x onerror=alert(1)><script>alert(1)</script>');
    expect(out).not.toContain('<');
    expect(out).toContain('hi');
  });
});
