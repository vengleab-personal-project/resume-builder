"use client";

import React from 'react';
import { useResumeSync } from '@/client/features/Resume/useResumeSync';

// useResumeSync owns a debounce timer, a store subscription and a sendBeacon
// listener, all of which must exist exactly once for the whole app. Mounting it
// from a component in the (app) layout is what guarantees that -- calling the
// hook from a page would restart the sync on every navigation.
export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  useResumeSync();
  return <>{children}</>;
}
