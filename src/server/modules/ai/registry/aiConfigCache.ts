import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/prisma';
import { FALLBACK_ACTION_COSTS, FALLBACK_CHAT_MODELS } from '@/shared/config/constants';
import type { AiConfigSnapshot } from './types';

// NEVER import this module (or anything under src/server/ai/registry) from
// src/middleware.ts: it pulls in Prisma, which cannot run on the Edge runtime.

export const AI_CONFIG_CACHE_TAG = 'ai-config';

// Two layers. `unstable_cache` is the cross-instance one — a plain module cache
// cannot be invalidated on the other lambda instances an admin's mutation did
// not happen to land on. The in-process memo in front of it makes the hot path
// of every AI request cost zero round-trips on a warm instance.
const CACHE_REVALIDATE_SECONDS = 60;
const IN_PROCESS_TTL_MS = 15_000;

// Shaped exactly like a DB snapshot so every consumer has one code path. The
// synthetic ids keep ActionCost.chatModelId joins working offline.
const FALLBACK_SNAPSHOT: AiConfigSnapshot = {
  chatModels: FALLBACK_CHAT_MODELS.map((model) => ({
    id: `fallback:${model.provider}:${model.modelId}`,
    provider: model.provider,
    modelId: model.modelId,
    displayName: model.displayName,
    isActive: true,
    isDefault: model.isDefault,
    sortOrder: model.sortOrder,
  })),
  actionCosts: (
    Object.entries(FALLBACK_ACTION_COSTS) as [keyof typeof FALLBACK_ACTION_COSTS, number][]
  ).map(([action, coinCost]) => ({ action, chatModelId: null, coinCost })),
  isFallback: true,
};

async function loadSnapshotFromDb(): Promise<AiConfigSnapshot> {
  const [chatModels, actionCosts] = await Promise.all([
    prisma.chatModel.findMany({
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
      select: {
        id: true,
        provider: true,
        modelId: true,
        displayName: true,
        isActive: true,
        isDefault: true,
        sortOrder: true,
      },
    }),
    prisma.actionCost.findMany({
      select: { action: true, chatModelId: true, coinCost: true },
    }),
  ]);

  return { chatModels, actionCosts, isFallback: false };
}

const loadSnapshotCached = unstable_cache(loadSnapshotFromDb, ['ai-config-snapshot'], {
  tags: [AI_CONFIG_CACHE_TAG],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

let memo: { snapshot: AiConfigSnapshot; expiresAt: number } | null = null;

export async function getAiConfigSnapshot(): Promise<AiConfigSnapshot> {
  const now = Date.now();
  if (memo && memo.expiresAt > now) {
    return memo.snapshot;
  }

  let snapshot: AiConfigSnapshot;
  try {
    snapshot = await loadSnapshotCached();
    // An empty table means the seed never ran; serving "no models available"
    // would break every AI route, so degrade to the static list instead.
    if (snapshot.chatModels.length === 0) {
      snapshot = FALLBACK_SNAPSHOT;
    }
  } catch (error) {
    console.error('AI config load failed, serving static fallback:', error);
    snapshot = FALLBACK_SNAPSHOT;
  }

  memo = { snapshot, expiresAt: now + IN_PROCESS_TTL_MS };
  return snapshot;
}

// Called by every admin mutation. The in-process memo is cleared for this
// instance; revalidateTag handles the rest of the fleet.
export function invalidateAiConfig(): void {
  memo = null;
  // 'max' is Next 16's full-purge profile. updateTag() would be stricter
  // (read-your-own-writes) but is Server Action only; these are route handlers.
  revalidateTag(AI_CONFIG_CACHE_TAG, 'max');
}
