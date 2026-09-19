"use client";

import { useCallback, useEffect, useState } from 'react';
import type { EvaluationDTO, EvaluationListResponse, EvaluationSummary } from '@/shared/types/persistence';

const PAGE_SIZE = 10;

export function useEvaluationHistory() {
  const [entries, setEntries] = useState<EvaluationSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (cursor: string | null) => {
    setIsLoading(true);
    setFailed(false);

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/evaluations?${params}`, { credentials: 'same-origin' });
      if (!res.ok) {
        setFailed(true);
        return;
      }

      const body = (await res.json()) as EvaluationListResponse;
      // A cursor means "append this page"; no cursor means the list is being
      // rebuilt from scratch after a new evaluation or a delete.
      setEntries((previous) => (cursor ? [...previous, ...body.evaluations] : body.evaluations));
      setNextCursor(body.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  const refresh = useCallback(() => load(null), [load]);
  const loadMore = useCallback(() => {
    if (nextCursor) void load(nextCursor);
  }, [load, nextCursor]);

  const fetchEntry = useCallback(async (id: string): Promise<EvaluationDTO | null> => {
    try {
      const res = await fetch(`/api/evaluations/${id}`, { credentials: 'same-origin' });
      if (!res.ok) return null;
      const body = (await res.json()) as { evaluation: EvaluationDTO };
      return body.evaluation;
    } catch {
      return null;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    // Optimistic: the row is gone from the list before the round trip, and a
    // failure is corrected by the refresh rather than by restoring state.
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
    try {
      await fetch(`/api/evaluations/${id}`, { method: 'DELETE' });
    } finally {
      void load(null);
    }
  }, [load]);

  return {
    entries,
    isLoading,
    failed,
    hasMore: nextCursor !== null,
    refresh,
    loadMore,
    fetchEntry,
    deleteEntry,
  };
}
