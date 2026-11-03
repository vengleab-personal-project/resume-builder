import { describe, expect, it } from 'vitest';
import { isDataImageUrl, safePhotoUrl, safeUrl } from '@/shared/lib/safeUrl';

describe('safeUrl', () => {
  it('keeps web and mail links', () => {
    expect(safeUrl('https://example.com/paper')).toBe('https://example.com/paper');
    expect(safeUrl('http://example.com')).toBe('http://example.com');
    expect(safeUrl('mailto:a@b.co')).toBe('mailto:a@b.co');
  });

  it('adds https to a bare domain', () => {
    expect(safeUrl('example.com/paper')).toBe('https://example.com/paper');
  });

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('drops %j', (value) => {
    expect(safeUrl(value)).toBe('');
  });

  it('treats empty values as no link', () => {
    expect(safeUrl('')).toBe('');
    expect(safeUrl('   ')).toBe('');
    expect(safeUrl(undefined)).toBe('');
  });
});

describe('photo urls', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';

  it('accepts only downscaled data images', () => {
    expect(isDataImageUrl(png)).toBe(true);
    expect(safePhotoUrl(png)).toBe(png);
    expect(safePhotoUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe('data:image/jpeg;base64,/9j/4AAQ');
  });

  it.each([
    'https://tracker.example/pixel.gif',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:text/html;base64,PHNjcmlwdD4=',
    'javascript:alert(1)',
    'data:image/png;base64,abc"onerror="alert(1)',
  ])('refuses %j', (value) => {
    expect(safePhotoUrl(value)).toBe('');
  });
});
