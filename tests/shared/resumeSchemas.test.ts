import { describe, expect, it } from 'vitest';
import {
  RESUME_DATA_MAX_BYTES,
  RESUME_THEME_MAX_BYTES,
  createResumeSchema,
  updateResumeSchema,
} from '@/shared/lib/validation/resumeSchemas';

const base = { sectionOrder: ['summary'], theme: {} };

describe('resume size caps', () => {
  it('accepts an ordinary resume', () => {
    const data = { personalInfo: { name: 'A' }, summary: '<p>hi</p>' };
    expect(createResumeSchema.safeParse({ ...base, data }).success).toBe(true);
  });

  it('rejects a document over the cap, on create and on update', () => {
    const data = { summary: 'x'.repeat(RESUME_DATA_MAX_BYTES + 1) };
    expect(createResumeSchema.safeParse({ ...base, data }).success).toBe(false);
    expect(updateResumeSchema.safeParse({ version: 1, data }).success).toBe(false);
  });

  it('does not count the photo, so a legacy multi-MB photo still saves', () => {
    const data = {
      personalInfo: { name: 'A', photoUrl: 'data:image/png;base64,' + 'A'.repeat(3 * 1024 * 1024) },
      summary: 'short',
    };
    expect(updateResumeSchema.safeParse({ version: 1, data }).success).toBe(true);
  });

  it('counts bytes, not characters', () => {
    // Khmer is 3 bytes per character in UTF-8.
    const data = { summary: 'ក'.repeat(Math.ceil(RESUME_DATA_MAX_BYTES / 3) + 10) };
    expect(createResumeSchema.safeParse({ ...base, data }).success).toBe(false);
  });

  it('caps the theme separately', () => {
    const theme = { blob: 'x'.repeat(RESUME_THEME_MAX_BYTES + 1) };
    expect(createResumeSchema.safeParse({ ...base, data: {}, theme }).success).toBe(false);
  });
});
