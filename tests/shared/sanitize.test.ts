// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeHTML } from '@/shared/lib/sanitize';

describe('sanitizeHTML (browser, at render)', () => {
  it('removes script, handlers and javascript: links', () => {
    const out = sanitizeHTML(
      '<p onclick="x()">a</p><img src=x onerror=alert(1)><a href="javascript:alert(1)">b</a><script>x()</script>'
    );
    expect(out).not.toMatch(/onclick|onerror|javascript|script|<img/i);
    expect(out).toContain('a');
    expect(out).toContain('b');
  });

  it('strips style and non-Quill classes', () => {
    const out = sanitizeHTML('<div style="position:fixed" class="fixed inset-0 ql-ui">x</div>');
    expect(out).not.toContain('style');
    expect(out).not.toContain('fixed');
    expect(out).toContain('ql-ui');
  });

  it('forces rel/target on links', () => {
    const out = sanitizeHTML('<a href="https://example.com" target="_self" rel="opener">s</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('keeps editor formatting', () => {
    const html = '<p><strong>a</strong> <em>b</em> <u>c</u></p><ol><li>x</li></ol>';
    expect(sanitizeHTML(html)).toBe(html);
  });
});
