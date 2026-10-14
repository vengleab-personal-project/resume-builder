// The one allow-list for the editor's HTML (summary, descriptions, trainings), shared by
// the browser sanitizer (`shared/lib/sanitize.ts`, run at render) and the server's
// (`server/modules/resumes/resumeSanitizer.ts`, run on write). Quill is configured for
// bold / italic / underline / lists, so nothing more is needed. In particular there is no
// `style` and no free-form `class`: a `position: fixed` overlay on the public share page
// is a phishing page, and Tailwind utility classes can build one without any style.
export const RICH_TEXT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote',
];

export const RICH_TEXT_ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

/** Only Quill's own classes (`ql-ui`, `ql-indent-1`...) survive. */
export const RICH_TEXT_CLASS_PREFIX = 'ql-';

/** The only link schemes a stored link may use. */
export const RICH_TEXT_LINK_SCHEMES = ['http', 'https', 'mailto'];
