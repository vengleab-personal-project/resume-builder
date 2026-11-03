import type { MetadataRoute } from 'next';
import { AI_CRAWLER_AGENTS } from '@/shared/config/share';

// Shared CVs (/s/) and the API are off limits to every crawler. The AI crawlers are
// also named in a group of their own, since some honour only rules that name them.
// This is a request, not a wall - middleware 404s these agents on /s/ regardless.
const PRIVATE_PATHS = ['/s/', '/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', disallow: PRIVATE_PATHS },
      { userAgent: [...AI_CRAWLER_AGENTS], disallow: PRIVATE_PATHS },
    ],
  };
}
