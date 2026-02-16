import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote'
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style'];

export const sanitizeHTML = (dirty: string): string => {
  if (typeof window === 'undefined') {
    return dirty;
  }

  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });

  return clean;
};

export const stripHTML = (html: string): string => {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });

  return clean;
};

export const sanitizeResumeData = (data: unknown): unknown => {
  if (typeof data === 'string') {
    return sanitizeHTML(data);
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeResumeData);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const key in data) {
      sanitized[key] = sanitizeResumeData((data as Record<string, unknown>)[key]);
    }
    return sanitized;
  }

  return data;
};
