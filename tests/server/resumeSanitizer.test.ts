import { describe, expect, it } from 'vitest';
import { sanitizeResumeData, sanitizeRichText } from '@/server/modules/resumes/resumeSanitizer';

describe('sanitizeRichText', () => {
  it('keeps the formatting the editor produces', () => {
    const html = '<p>Led <strong>a team</strong> of <em>five</em></p><ul><li>one</li><li>two</li></ul>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it('removes script and event handlers', () => {
    const out = sanitizeRichText('<p onclick="x()">hi</p><img src=x onerror=alert(1)><script>alert(1)</script>');
    expect(out).toBe('<p>hi</p>');
  });

  it('drops javascript: links but keeps their text', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript');
    expect(out).toContain('click');
  });

  it('opens real links safely', () => {
    const out = sanitizeRichText('<a href="https://example.com">site</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('removes style and free-form classes, keeps Quill classes', () => {
    const out = sanitizeRichText(
      '<p style="position:fixed;inset:0" class="fixed inset-0 bg-white ql-indent-1">x</p>'
    );
    expect(out).not.toContain('style');
    expect(out).not.toContain('fixed');
    expect(out).toContain('ql-indent-1');
  });
});

describe('sanitizeResumeData', () => {
  const dirty = {
    personalInfo: { name: 'A & B <R&D>', photoUrl: 'https://tracker.example/p.gif', email: 'a@b.co' },
    summary: '<p>ok</p><img src=x onerror=alert(1)>',
    experience: [{ role: 'Dev', company: 'R&D', description: '<ul><li onclick="x()">did</li></ul>' }],
    education: [{ degree: 'BSc', description: '<script>x()</script>fine' }],
    otherTraining: [{ name: '<b onmouseover=x()>Course</b>' }],
    publications: [
      { title: 'Paper', link: 'javascript:alert(1)' },
      { title: 'Other', link: 'example.com/p' },
    ],
    skills: ['C&C++'],
  };

  const clean = sanitizeResumeData(dirty) as typeof dirty;

  it('cleans every HTML field', () => {
    expect(clean.summary).toBe('<p>ok</p>');
    expect(clean.experience[0].description).toBe('<ul><li>did</li></ul>');
    expect(clean.education[0].description).toBe('fine');
    expect(clean.otherTraining[0].name).toBe('Course');
  });

  it('drops script links and normalises bare domains', () => {
    expect(clean.publications[0].link).toBe('');
    expect(clean.publications[1].link).toBe('https://example.com/p');
  });

  it('drops a remote photo', () => {
    expect(clean.personalInfo.photoUrl).toBe('');
  });

  it('leaves plain text fields alone (no HTML-escaping of "R&D")', () => {
    expect(clean.personalInfo.name).toBe('A & B <R&D>');
    expect(clean.experience[0].company).toBe('R&D');
    expect(clean.skills).toEqual(['C&C++']);
  });

  it('does not mutate its input and tolerates missing sections', () => {
    expect(dirty.summary).toContain('onerror');
    expect(sanitizeResumeData({ summary: 'x' })).toEqual({ summary: 'x' });
  });
});
