"use client";

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { ENV } from '@/shared/config/env';
import { SHARE_PATH_PREFIX } from '@/shared/config/share';
import type { ShareAccessKey, ShareContentKey, ShareLinkDTO } from '@/shared/types/persistence';

export type NewShareLinkDraft = {
  label: string;
  access: ShareAccessKey;
  passcode: string;
  content: ShareContentKey;
};

export type ShareFieldErrors = Partial<Record<'label' | 'passcode', string>>;

const EMPTY_DRAFT: NewShareLinkDraft = { label: '', access: 'CODE', passcode: '', content: 'LIVE' };

type ApiError = { error?: string; details?: { issues?: { field?: string; message?: string }[] } };

/** The share dialog's state: the resume's links, the new-link form, and every action on a link. */
export function useShareLinksLogic(resumeId: string | null, open: boolean) {
  const { t, locale } = useTranslations('share');

  const [links, setLinks] = useState<ShareLinkDTO[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [draft, setDraft] = useState<NewShareLinkDraft>(EMPTY_DRAFT);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ShareFieldErrors>({});
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** Server validation messages are i18n keys ('share.validation.labelRequired'). */
  const resolveMessage = useCallback(
    (message?: string) => {
      const key = message?.split('.').pop();
      return (key && (t.validation as Record<string, string>)[key]) || t.actionFailed;
    },
    [t]
  );

  const load = useCallback(async () => {
    if (!resumeId) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/resumes/${resumeId}/shares`, { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const body = (await res.json()) as { links: ShareLinkDTO[] };
      setLinks(body.links);
      setStatus('ready');
      setIsFormOpen(body.links.length === 0);
    } catch {
      setStatus('error');
    }
  }, [resumeId]);

  useEffect(() => {
    if (!open) return;
    setDraft(EMPTY_DRAFT);
    setFieldErrors({});
    setNotice(null);
    void load();
  }, [open, load]);

  const shareUrl = useCallback((link: ShareLinkDTO) => {
    const origin = ENV.APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${origin.replace(/\/$/, '')}${SHARE_PATH_PREFIX}/${link.code}`;
  }, []);

  const updateDraft = useCallback(<K extends keyof NewShareLinkDraft>(key: K, value: NewShareLinkDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const create = useCallback(async () => {
    if (!resumeId || isCreating) return;
    setIsCreating(true);
    setFieldErrors({});
    setNotice(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: draft.label,
          access: draft.access,
          content: draft.content,
          // The CV's headings on the shared page follow the language the owner uses.
          locale,
          ...(draft.access === 'PASSCODE' ? { passcode: draft.passcode } : {}),
        }),
      });
      if (res.status === 201) {
        const { link } = (await res.json()) as { link: ShareLinkDTO };
        setLinks((prev) => [link, ...prev]);
        setDraft(EMPTY_DRAFT);
        setIsFormOpen(false);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as ApiError;
      if (res.status === 409 && body.error === 'LIMIT_REACHED') {
        setNotice(t.limitReached);
        return;
      }
      const errors: ShareFieldErrors = {};
      for (const issue of body.details?.issues ?? []) {
        if (issue.field === 'label' || issue.field === 'passcode') errors[issue.field] = resolveMessage(issue.message);
      }
      setFieldErrors(errors);
      if (!Object.keys(errors).length) setNotice(t.actionFailed);
    } catch {
      setNotice(t.actionFailed);
    } finally {
      setIsCreating(false);
    }
  }, [draft, isCreating, locale, resolveMessage, resumeId, t]);

  /** PATCH one link and swap the server's copy into the list. */
  const patch = useCallback(
    async (link: ShareLinkDTO, body: Record<string, unknown>): Promise<boolean> => {
      setBusyId(link.id);
      setNotice(null);
      try {
        const res = await fetch(`/api/shares/${link.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const error = (await res.json().catch(() => ({}))) as ApiError;
          setNotice(resolveMessage(error.details?.issues?.[0]?.message));
          return false;
        }
        const { link: updated } = (await res.json()) as { link: ShareLinkDTO };
        setLinks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        return true;
      } catch {
        setNotice(t.actionFailed);
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [resolveMessage, t]
  );

  const toggleActive = useCallback((link: ShareLinkDTO) => patch(link, { isActive: !link.isActive }), [patch]);
  const refreshSnapshot = useCallback((link: ShareLinkDTO) => patch(link, { refreshSnapshot: true }), [patch]);

  const changePasscode = useCallback(
    async (link: ShareLinkDTO, passcode: string) => {
      const ok = await patch(link, { passcode });
      if (ok) setNotice(t.passcodeChanged);
      return ok;
    },
    [patch, t]
  );

  const remove = useCallback(
    async (link: ShareLinkDTO) => {
      if (!window.confirm(t.confirmDelete)) return;
      setBusyId(link.id);
      try {
        const res = await fetch(`/api/shares/${link.id}`, { method: 'DELETE' });
        if (res.ok) setLinks((prev) => prev.filter((item) => item.id !== link.id));
        else setNotice(t.actionFailed);
      } catch {
        setNotice(t.actionFailed);
      } finally {
        setBusyId(null);
      }
    },
    [t]
  );

  const copy = useCallback(
    async (link: ShareLinkDTO) => {
      try {
        await navigator.clipboard.writeText(shareUrl(link));
        setCopiedId(link.id);
        setTimeout(() => setCopiedId((current) => (current === link.id ? null : current)), 2000);
      } catch {
        // Clipboard can be refused (permissions, insecure origin); the URL is on screen to copy by hand.
        setNotice(t.actionFailed);
      }
    },
    [shareUrl, t]
  );

  return {
    t,
    links,
    status,
    retry: () => void load(),
    shareUrl,
    draft,
    updateDraft,
    isFormOpen,
    openForm: () => setIsFormOpen(true),
    closeForm: () => {
      setIsFormOpen(false);
      setFieldErrors({});
    },
    fieldErrors,
    isCreating,
    create,
    busyId,
    copiedId,
    notice,
    toggleActive,
    refreshSnapshot,
    changePasscode,
    remove,
    copy,
  };
}
