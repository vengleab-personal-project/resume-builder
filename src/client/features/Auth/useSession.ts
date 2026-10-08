"use client";

import { useCallback, useEffect, useState } from 'react';
import type { PublicUser } from '@/shared/types/auth';

// GET /api/auth/me is uncacheable (no-store) and several unrelated components
// need the current user at once, so the result is memoised at module scope with
// a subscriber list instead of each consumer firing its own request.
let cachedUser: PublicUser | null = null;
let hasLoaded = false;
let inFlight: Promise<PublicUser | null> | null = null;

const listeners = new Set<(user: PublicUser | null) => void>();

function publish(user: PublicUser | null): void {
  cachedUser = user;
  hasLoaded = true;
  listeners.forEach((listener) => listener(user));
}

async function requestSession(): Promise<PublicUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const body = (await res.json()) as { user: PublicUser | null };
    return body.user ?? null;
  } catch {
    return null;
  }
}

function loadSession(force: boolean): Promise<PublicUser | null> {
  if (!force && hasLoaded) return Promise.resolve(cachedUser);
  if (inFlight) return inFlight;

  inFlight = requestSession().then((user) => {
    inFlight = null;
    publish(user);
    return user;
  });

  return inFlight;
}

// Lets the login/signup flows seed the cache from the response they already
// have, so the next render does not flash a logged-out shell.
export function setSessionUser(user: PublicUser | null): void {
  publish(user);
}

export function refreshSession(): Promise<PublicUser | null> {
  return loadSession(true);
}

export interface UseSessionResult {
  user: PublicUser | null;
  isLoading: boolean;
  refresh: () => Promise<PublicUser | null>;
  signOut: (everywhere?: boolean) => Promise<void>;
}

export function useSession(): UseSessionResult {
  const [user, setUser] = useState<PublicUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!hasLoaded);

  useEffect(() => {
    listeners.add(setUser);

    let active = true;
    loadSession(false).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
      listeners.delete(setUser);
    };
  }, []);

  const signOut = useCallback(async (everywhere = false) => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ everywhere }),
    });
    publish(null);
  }, []);

  return { user, isLoading, refresh: refreshSession, signOut };
}
