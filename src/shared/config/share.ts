// Share links (/s/<code>). EDGE-SAFE: src/middleware.ts imports this file, so it may
// hold only plain constants and pure functions - no Prisma, no node:crypto.

export const SHARE_PATH_PREFIX = '/s';

/** Header the viewer page sends with its content request; plain fetchers do not. */
export const SHARE_CLIENT_HEADER = 'x-share-client';

/** Proof of a correct passcode. One cookie per link: its path is that link's /s/<code>. */
export const SHARE_UNLOCK_COOKIE = 'rb_share_unlock';
export const SHARE_UNLOCK_TTL_SECONDS = 12 * 60 * 60;

export const SHARE_LINKS_PER_RESUME_MAX = 20;
export const SHARE_LABEL_MAX_LENGTH = 80;
export const SHARE_PASSCODE_MIN_LENGTH = 6;
export const SHARE_PASSCODE_MAX_LENGTH = 64;

/**
 * Wrong-passcode limits. Per IP per link stops one visitor guessing; per link (all
 * IPs) bounds a distributed guess at a short passcode. A link locked by someone
 * else's guessing reopens when the window passes.
 */
export const SHARE_UNLOCK_MAX_FAILURES_PER_IP = 5;
export const SHARE_UNLOCK_MAX_FAILURES_PER_LINK = 30;
export const SHARE_UNLOCK_WINDOW_MS = 15 * 60 * 1000;

/** Sent on every /s/ response (next.config.ts) and asserted by the page metadata. */
export const SHARE_ROBOTS_HEADER =
  'noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai';

/**
 * Crawlers refused outright on /s/ (a bare 404 from middleware), and named in
 * robots.txt. AI training/answer crawlers, then search engines: a shared CV is personal
 * data and has no business in an index or a model.
 */
export const AI_CRAWLER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'GoogleOther',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'FacebookBot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'Diffbot',
  'YouBot',
  'Timpibot',
  'ImagesiftBot',
  'omgili',
  'DuckAssistBot',
  'MistralAI-User',
  'PetalBot',
] as const;

const SEARCH_CRAWLER_AGENTS = [
  'Googlebot',
  'bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Applebot',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'DotBot',
] as const;

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const BLOCKED_CRAWLER_PATTERN = new RegExp(
  [...AI_CRAWLER_AGENTS, ...SEARCH_CRAWLER_AGENTS].map(escape).join('|'),
  'i'
);

/** A user agent that must never be served a shared CV. An empty one counts too. */
export const isBlockedCrawler = (userAgent: string | null | undefined): boolean =>
  !userAgent?.trim() || BLOCKED_CRAWLER_PATTERN.test(userAgent);
