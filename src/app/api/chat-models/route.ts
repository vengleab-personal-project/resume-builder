import { NextResponse } from 'next/server';
import { listChatModelOptions } from '@/server/ai/registry';
import { withAuthErrors } from '@/server/auth/guards';

export const runtime = 'nodejs';
// Without this Next would try to prerender the route at build time, where there
// is no DATABASE_URL. The registry's own cache is what keeps this cheap.
export const dynamic = 'force-dynamic';

// Public on purpose: the model selector renders before the user has done
// anything, and the offered model names are not sensitive.
export const GET = withAuthErrors(async () => {
  const models = await listChatModelOptions();
  return NextResponse.json({ models }, { headers: { 'Cache-Control': 'no-store' } });
});
