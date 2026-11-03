"use client";

import { useCallback, useEffect, useState } from 'react';
import { SHARE_CLIENT_HEADER, SHARE_PATH_PREFIX } from '@/shared/config/share';
import type { SharedResumeContent } from '@/shared/types/persistence';

export type SharedResumePhase = 'loading' | 'passcode' | 'ready' | 'unavailable' | 'failed';
export type PasscodeError = 'wrong' | 'rateLimited' | 'again' | null;

/**
 * The public viewer of a share link. The page's HTML never contains the CV: this hook
 * fetches it from /s/<code>/content once the script runs, sending the header that
 * route requires - which is what keeps the CV away from crawlers and plain fetchers.
 */
export function useSharedResumeLogic(code: string, needsPasscode: boolean) {
  const base = `${SHARE_PATH_PREFIX}/${encodeURIComponent(code)}`;

  const [phase, setPhase] = useState<SharedResumePhase>(needsPasscode ? 'passcode' : 'loading');
  const [content, setContent] = useState<SharedResumeContent | null>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<PasscodeError>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchContent = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await fetch(`${base}/content`, {
        headers: { [SHARE_CLIENT_HEADER]: '1' },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.status === 401) {
        // The unlock expired, or the owner changed the passcode.
        setPasscodeError('again');
        setPhase('passcode');
        return;
      }
      if (res.status === 404) {
        setPhase('unavailable');
        return;
      }
      if (!res.ok) {
        setPhase('failed');
        return;
      }
      setContent((await res.json()) as SharedResumeContent);
      setPhase('ready');
    } catch {
      setPhase('failed');
    }
  }, [base]);

  useEffect(() => {
    if (!needsPasscode) void fetchContent();
  }, [needsPasscode, fetchContent]);

  const submitPasscode = useCallback(async () => {
    if (!passcode || isSubmitting) return;
    setIsSubmitting(true);
    setPasscodeError(null);
    try {
      const res = await fetch(`${base}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setPasscode('');
        await fetchContent();
        return;
      }
      if (res.status === 401 || res.status === 400) setPasscodeError('wrong');
      else if (res.status === 429) setPasscodeError('rateLimited');
      else if (res.status === 404) setPhase('unavailable');
      else setPhase('failed');
    } catch {
      setPhase('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [base, fetchContent, isSubmitting, passcode]);

  // The PDF is the browser's print, as in the builder; the document title becomes the
  // default file name, and is only set (from content already on screen) while printing.
  const print = useCallback(() => {
    const original = document.title;
    const name = content?.data.personalInfo?.name?.trim();
    if (name) document.title = name;
    window.print();
    setTimeout(() => {
      document.title = original;
    }, 1000);
  }, [content]);

  return {
    phase,
    content,
    passcode,
    setPasscode,
    passcodeError,
    isSubmitting,
    submitPasscode,
    retry: () => void fetchContent(),
    print,
  };
}
