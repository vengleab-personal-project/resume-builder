"use client";

import { useCallback, useEffect, useState } from 'react';
import type { AiProviderKey } from '@/shared/types';

export interface AdminChatModel {
  id: string;
  provider: AiProviderKey;
  modelId: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface ChatModelDraft {
  provider: AiProviderKey;
  modelId: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_DRAFT: ChatModelDraft = {
  provider: 'GOOGLE',
  modelId: '',
  displayName: '',
  isActive: true,
  sortOrder: 0,
};

export const useChatModelsAdminLogic = () => {
  const [models, setModels] = useState<AdminChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChatModelDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat-models', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('load failed');
      const body: { models: AdminChatModel[] } = await res.json();
      setModels(body.models);
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

  // Every mutation refetches instead of patching local state: the server applies
  // invariants of its own (clearing the previous default) that a local edit
  // would not reproduce.
  const mutate = useCallback(
    async (input: RequestInfo, init: RequestInit): Promise<boolean> => {
      setIsSaving(true);
      try {
        const res = await fetch(input, {
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          ...init,
        });
        if (!res.ok) throw new Error('save failed');
        await load();
        setError(null);
        return true;
      } catch {
        setError('saveFailed');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [load]
  );

  const startCreate = useCallback(() => {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT });
  }, []);

  const startEdit = useCallback((model: AdminChatModel) => {
    setEditingId(model.id);
    setDraft({
      provider: model.provider,
      modelId: model.modelId,
      displayName: model.displayName,
      isActive: model.isActive,
      sortOrder: model.sortOrder,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setDraft(null);
    setEditingId(null);
  }, []);

  const updateDraft = useCallback((patch: Partial<ChatModelDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const submitDraft = useCallback(async () => {
    if (!draft) return;
    const ok = editingId
      ? await mutate(`/api/admin/chat-models/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(draft),
        })
      : await mutate('/api/admin/chat-models', {
          method: 'POST',
          body: JSON.stringify(draft),
        });

    if (ok) cancelEdit();
  }, [cancelEdit, draft, editingId, mutate]);

  const toggleActive = useCallback(
    (model: AdminChatModel) =>
      mutate(`/api/admin/chat-models/${model.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !model.isActive }),
      }),
    [mutate]
  );

  const makeDefault = useCallback(
    (model: AdminChatModel) =>
      mutate(`/api/admin/chat-models/${model.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDefault: true }),
      }),
    [mutate]
  );

  const remove = useCallback(
    (model: AdminChatModel) =>
      mutate(`/api/admin/chat-models/${model.id}`, { method: 'DELETE' }),
    [mutate]
  );

  return {
    models,
    isLoading,
    isSaving,
    error,
    draft,
    editingId,
    startCreate,
    startEdit,
    cancelEdit,
    updateDraft,
    submitDraft,
    toggleActive,
    makeDefault,
    remove,
  };
};
