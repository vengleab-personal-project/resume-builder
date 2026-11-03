/**
 * URL rules for values that end up in an `href` or `src` on a page other people open
 * (the public share page renders whatever the owner saved, so a stored value is as
 * dangerous as typed markup). React 19 only warns about `javascript:` URLs, it does not
 * block them.
 */

const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * A link that is safe to put in an `href`, or '' when it is not. A bare domain
 * ("example.com/paper") gets `https://`, as the contact links do; anything with another
 * scheme (`javascript:`, `data:`, `vbscript:`...) is dropped.
 */
export const safeUrl = (value: string | null | undefined): string => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';

  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return LINK_PROTOCOLS.has(new URL(candidate).protocol) ? candidate : '';
  } catch {
    return '';
  }
};

/** A downscaled photo as the client produces it (`client/lib/image.ts`). */
const DATA_IMAGE_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const isDataImageUrl = (value: string): boolean => DATA_IMAGE_URL.test(value);

/**
 * A photo value that is safe to render, or ''. Remote URLs are refused: an `<img>` that
 * loads from somewhere else tells that host every time the CV is opened, so a shared
 * resume could be used to track whoever views it.
 */
export const safePhotoUrl = (value: string | null | undefined): string =>
  value && isDataImageUrl(value) ? value : '';
