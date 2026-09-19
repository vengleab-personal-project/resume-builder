"use client";

import { useEffect, useState } from 'react';
import { FALLBACK_CHAT_MODELS } from '@/shared/config/constants';
import type { AIProvider, ChatModelOption } from '@/shared/types';

// Mirrors the registry's own degradation: if /api/chat-models is unreachable the
// selector still renders the static list rather than going empty and trapping
// the user with no way to start a parse.
const FALLBACK_OPTIONS: ChatModelOption[] = FALLBACK_CHAT_MODELS.map((model) => ({
  id: `fallback:${model.provider}:${model.modelId}`,
  provider: model.provider.toLowerCase() as AIProvider,
  modelId: model.modelId,
  displayName: model.displayName,
  isDefault: model.isDefault,
  sortOrder: model.sortOrder,
}));

export const useChatModels = () => {
  const [models, setModels] = useState<ChatModelOption[]>(FALLBACK_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/chat-models');
        if (!res.ok) throw new Error('Failed to load chat models');
        const data: { models?: ChatModelOption[] } = await res.json();
        if (!cancelled && data.models && data.models.length > 0) {
          setModels(data.models);
        }
      } catch (error) {
        console.error('Chat model registry unavailable, using fallback list:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const providers = Array.from(new Set(models.map((model) => model.provider)));

  const modelsForProvider = (provider: string): ChatModelOption[] =>
    models.filter((model) => model.provider === provider);

  return { models, providers, modelsForProvider, isLoading };
};
