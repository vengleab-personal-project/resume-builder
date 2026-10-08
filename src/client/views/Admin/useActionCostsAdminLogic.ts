"use client";

import { useCallback, useEffect, useState } from 'react';
import { AI_ACTION_VALUES } from '@/shared/lib/validation/configSchemas';
import type { AiActionKey } from '@/shared/types';
import type { AdminChatModel } from './useChatModelsAdminLogic';

export interface AdminActionCost {
  id: string;
  action: AiActionKey;
  chatModelId: string | null;
  coinCost: number;
}

export const ACTIONS: readonly AiActionKey[] = AI_ACTION_VALUES;

export const useActionCostsAdminLogic = () => {
  const [costs, setCosts] = useState<AdminActionCost[]>([]);
  const [models, setModels] = useState<AdminChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [costsRes, modelsRes] = await Promise.all([
        fetch('/api/admin/action-costs', { credentials: 'same-origin' }),
        fetch('/api/admin/chat-models', { credentials: 'same-origin' }),
      ]);
      if (!costsRes.ok || !modelsRes.ok) throw new Error('load failed');

      const costsBody: { costs: AdminActionCost[] } = await costsRes.json();
      const modelsBody: { models: AdminChatModel[] } = await modelsRes.json();

      setCosts(costsBody.costs);
      setModels(modelsBody.models.filter((model) => model.isActive));
      setError(null);
    } catch {
      setError('loadFailed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const findCost = useCallback(
    (action: AiActionKey, chatModelId: string | null): AdminActionCost | undefined =>
      costs.find((cost) => cost.action === action && cost.chatModelId === chatModelId),
    [costs]
  );

  const mutate = useCallback(
    async (init: RequestInit): Promise<void> => {
      setIsSaving(true);
      try {
        const res = await fetch('/api/admin/action-costs', {
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          ...init,
        });
        if (!res.ok) throw new Error('save failed');
        await load();
        setError(null);
      } catch {
        setError('saveFailed');
      } finally {
        setIsSaving(false);
      }
    },
    [load]
  );

  const setCost = useCallback(
    (action: AiActionKey, chatModelId: string | null, coinCost: number) =>
      mutate({ method: 'PUT', body: JSON.stringify({ action, chatModelId, coinCost }) }),
    [mutate]
  );

  // Only overrides can be cleared; the inherited row must always exist so every
  // action keeps a price.
  const clearOverride = useCallback(
    (action: AiActionKey, chatModelId: string) =>
      mutate({ method: 'DELETE', body: JSON.stringify({ action, chatModelId }) }),
    [mutate]
  );

  return { costs, models, isLoading, isSaving, error, findCost, setCost, clearOverride };
};
