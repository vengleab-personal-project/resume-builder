import DOMPurify from 'dompurify';

import {
  RICH_TEXT_ALLOWED_ATTR,
  RICH_TEXT_ALLOWED_TAGS,
  RICH_TEXT_CLASS_PREFIX,
  RICH_TEXT_LINK_SCHEMES,
} from '@/shared/config/rich-text';

const ALLOWED_URI = new RegExp(`^(?:${RICH_TEXT_LINK_SCHEMES.join('|')}):`, 'i');

let hooked = false;

const installHooks = () => {
  if (hooked) return;
  hooked = true;

  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'class') return;
    data.attrValue = data.attrValue
      .split(/\s+/)
      .filter((name) => name.startsWith(RICH_TEXT_CLASS_PREFIX))
      .join(' ');
    if (!data.attrValue) data.keepAttr = false;
  });

  // A link a viewer clicks must not be able to reach back into the page that opened it.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
};

const hasDom = () => typeof window !== 'undefined';

/**
 * Editor HTML made safe to render with `dangerouslySetInnerHTML`.
 *
 * Without a DOM (a server render) it fails closed: tags are dropped and only the text
 * is kept, never the input unchanged. User content is not server-rendered today (the
 * share page fetches it in the browser), so this is the safe answer if that ever changes.
 */
export const sanitizeHTML = (dirty: string): string => {
  if (!hasDom()) return stripTags(dirty);
  installHooks();

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: ALLOWED_URI,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
};

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

export const stripHTML = (html: string): string => {
  if (!hasDom()) return stripTags(html);

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
};
