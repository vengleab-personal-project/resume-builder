'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BasicResumeDTO, ResumeSummary } from '@/shared/types/persistence';
import type { BasicResumeData } from '@/shared/types/basic-resume';
import type { ThemeConfig } from '@/shared/types';
import { createEmptyBasicResumeData } from '@/shared/lib/basic-resume';
import { INITIAL_THEME } from '@/shared/config/constants';
import { useTranslations } from '@/client/hooks/useTranslations';
import { generateBasicResumeDocx } from '@/client/features/BasicResume';

const AUTOSAVE_DEBOUNCE_MS = 1500;

export type BasicSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/** The three list sections, all of which are a short value plus one free line. */
export type PairList = 'education' | 'experience' | 'languages';

const PAIR_FIELDS: Record<PairList, readonly [string, string]> = {
  education: ['year', 'detail'],
  experience: ['year', 'detail'],
  languages: ['name', 'skills'],
};

/**
 * Owns every piece of state, effect and request for the basic CV screen.
 *
 * Deliberately not backed by a Zustand store, unlike the professional builder.
 * `useResumeStore` is persisted to localStorage and hydrated globally by
 * `useResumeSync`, and a second global store holding a different resume shape is
 * exactly the collision M1 exists to prevent. This screen is the only thing that
 * reads a basic CV, so the server is its single source of truth.
 */
export const useBasicResumeLogic = () => {
  const { t } = useTranslations('basicResume');

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [data, setData] = useState<BasicResumeData>(createEmptyBasicResumeData);
  const [theme, setTheme] = useState<ThemeConfig>(INITIAL_THEME);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<BasicSaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Suppresses the autosave that would otherwise fire on the state change the
  // server itself just caused -- a load, or adopting the winner of a conflict.
  const skipNextSaveRef = useRef(true);
  const versionRef = useRef(0);

  const adopt = useCallback((resume: BasicResumeDTO) => {
    skipNextSaveRef.current = true;
    setActiveId(resume.id);
    setTitle(resume.title);
    setData(resume.data);
    setTheme(resume.theme);
    setVersion(resume.version);
    versionRef.current = resume.version;
  }, []);

  const open = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/basic-resume/${id}`, { credentials: 'same-origin' });
      if (!res.ok) return;
      const body = (await res.json()) as { resume: BasicResumeDTO };
      adopt(body.resume);
    },
    [adopt]
  );

  const create = useCallback(async () => {
    const res = await fetch('/api/basic-resume', { method: 'POST', credentials: 'same-origin' });
    if (!res.ok) return null;
    const body = (await res.json()) as { resume: BasicResumeDTO };
    adopt(body.resume);
    setResumes((current) => [
      {
        id: body.resume.id,
        title: body.resume.title,
        kind: 'BASIC',
        isDefault: body.resume.isDefault,
        version: body.resume.version,
        createdAt: body.resume.createdAt,
        updatedAt: body.resume.updatedAt,
      },
      ...current,
    ]);
    return body.resume;
  }, [adopt]);

  // First load: open the user's default basic CV, or make them one. A blank
  // screen with a "create" button would be a dead end on a product whose whole
  // point is that you do not have to know how to start a CV.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/basic-resume', { credentials: 'same-origin' });
        if (!res.ok) return;
        const body = (await res.json()) as { resumes: ResumeSummary[] };
        if (cancelled) return;

        setResumes(body.resumes);
        const target = body.resumes.find((row) => row.isDefault) ?? body.resumes[0];
        if (target) {
          await open(target.id);
        } else {
          await create();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, create]);

  // Autosave, debounced, with the same compare-and-swap the full builder uses:
  // the version we read travels with the write, and a 409 hands back the row
  // that won, which we adopt rather than overwrite.
  useEffect(() => {
    if (!activeId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setStatus('saving');
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/basic-resume/${activeId}`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: versionRef.current, title, data, theme }),
          });

          if (res.status === 409) {
            const body = (await res.json()) as { resume: BasicResumeDTO };
            adopt(body.resume);
            setStatus('conflict');
            return;
          }

          if (!res.ok) {
            setStatus('error');
            return;
          }

          const body = (await res.json()) as { resume: BasicResumeDTO };
          versionRef.current = body.resume.version;
          setVersion(body.resume.version);
          setResumes((current) =>
            current.map((row) =>
              row.id === body.resume.id ? { ...row, title: body.resume.title } : row
            )
          );
          setStatus('saved');
        } catch {
          setStatus('error');
        }
      })();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [activeId, title, data, theme, adopt]);

  // Typed edits. The path strings match the interview script's `targetPath`
  // values, so when the voice flow lands both paths write through one place.
  const setScalar = useCallback((path: string, value: string) => {
    setData((current) => {
      if (path === 'interests') {
        return { ...current, interests: value.split(',').map((item) => item.trim()) };
      }
      const [head, tail] = path.split('.');
      if (head === 'contact' && tail) {
        return { ...current, contact: { ...current.contact, [tail]: value } };
      }
      if (head === 'personal' && tail) {
        return { ...current, personal: { ...current.personal, [tail]: value } };
      }
      return { ...current, [head]: value };
    });
  }, []);

  const setPair = useCallback(
    (list: PairList, id: string, field: 'left' | 'right', value: string) => {
      const key = PAIR_FIELDS[list][field === 'left' ? 0 : 1];
      setData((current) => ({
        ...current,
        [list]: current[list].map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)),
      }));
    },
    []
  );

  const addPair = useCallback((list: PairList) => {
    const [leftKey, rightKey] = PAIR_FIELDS[list];
    setData((current) => ({
      ...current,
      [list]: [...current[list], { id: crypto.randomUUID(), [leftKey]: '', [rightKey]: '' }],
    }));
  }, []);

  const removePair = useCallback((list: PairList, id: string) => {
    setData((current) => ({
      ...current,
      [list]: current[list].filter((entry) => entry.id !== id),
    }));
  }, []);

  const exportPdf = useCallback(() => {
    const originalTitle = document.title;
    document.title = data.fullName || title || 'cv';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }, [data.fullName, title]);

  const exportDocx = useCallback(async () => {
    setIsExportingDocx(true);
    try {
      const blob = await generateBasicResumeDocx(data, theme, t);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.fullName || title || 'cv'}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DOCX export failed:', error);
    } finally {
      setIsExportingDocx(false);
    }
  }, [data, theme, title, t]);

  return {
    t,
    resumes,
    activeId,
    title,
    data,
    theme,
    version,
    status,
    isLoading,
    isExportingDocx,
    setTitle,
    setTheme,
    // The voice interview writes the CV server-side, so its responses are
    // adopted here rather than merged locally -- the server's copy is the one
    // that was actually persisted, and re-saving it would race the next turn.
    adoptServerResume: adopt,
    setScalar,
    setPair,
    addPair,
    removePair,
    open,
    create,
    exportPdf,
    exportDocx,
  };
};
