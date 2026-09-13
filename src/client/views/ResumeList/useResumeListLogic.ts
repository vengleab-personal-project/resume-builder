"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore, type ServerResumeSnapshot } from '@/client/store/resume-store';
import type { ResumeDTO, ResumeSummary } from '@/shared/types/persistence';
import {
  INITIAL_RESUME_DATA,
  INITIAL_SECTION_ORDER,
  INITIAL_THEME,
} from '@/shared/config/constants';
import type { ResumeData, ThemeConfig } from '@/shared/types';

function snapshotFromDTO(resume: ResumeDTO): ServerResumeSnapshot {
  return {
    id: resume.id,
    version: resume.version,
    title: resume.title,
    data: resume.data,
    sectionOrder: resume.sectionOrder,
    theme: resume.theme,
    updatedAt: resume.updatedAt,
  };
}

async function fetchResume(id: string): Promise<ResumeDTO | null> {
  const res = await fetch(`/api/resumes/${id}`, { credentials: 'same-origin' });
  if (!res.ok) return null;
  const body = (await res.json()) as { resume: ResumeDTO };
  return body.resume;
}

export function useResumeListLogic() {
  const router = useRouter();
  const activeResumeId = useResumeStore((state) => state.remoteResumeId);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setFailed(false);
    try {
      const res = await fetch('/api/resumes', { credentials: 'same-origin' });
      if (!res.ok) {
        setFailed(true);
        return [] as ResumeSummary[];
      }
      const body = (await res.json()) as { resumes: ResumeSummary[] };
      setResumes(body.resumes);
      return body.resumes;
    } catch {
      setFailed(true);
      return [] as ResumeSummary[];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openResume = useCallback(async (id: string) => {
    setPendingId(id);
    try {
      const resume = await fetchResume(id);
      if (!resume) return false;
      useResumeStore.getState().applyServerSnapshot(snapshotFromDTO(resume));
      return true;
    } finally {
      setPendingId(null);
    }
  }, []);

  const openAndEdit = useCallback(
    async (id: string) => {
      const ok = await openResume(id);
      if (ok) router.push('/builder');
    },
    [openResume, router]
  );

  const createResume = useCallback(async () => {
    setPendingId('new');
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Resume',
          data: INITIAL_RESUME_DATA as unknown as ResumeData,
          sectionOrder: INITIAL_SECTION_ORDER,
          theme: INITIAL_THEME as unknown as ThemeConfig,
        }),
      });
      if (!res.ok) return;
      const { resume } = (await res.json()) as { resume: ResumeDTO };
      useResumeStore.getState().applyServerSnapshot(snapshotFromDTO(resume));
      router.push('/builder');
    } finally {
      setPendingId(null);
    }
  }, [router]);

  const duplicateResume = useCallback(
    async (summary: ResumeSummary) => {
      setPendingId(summary.id);
      try {
        const source = await fetchResume(summary.id);
        if (!source) return;

        const res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${source.title} (Copy)`.slice(0, 120),
            data: source.data,
            sectionOrder: source.sectionOrder,
            theme: source.theme,
            isDefault: false,
          }),
        });
        if (!res.ok) return;
        await load();
      } finally {
        setPendingId(null);
      }
    },
    [load]
  );

  const renameResume = useCallback(
    async (summary: ResumeSummary, title: string) => {
      const trimmed = title.trim();
      if (!trimmed || trimmed === summary.title) return;

      setPendingId(summary.id);
      try {
        const res = await fetch(`/api/resumes/${summary.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: summary.version, title: trimmed }),
        });
        if (res.status === 409) {
          await load();
          return;
        }
        if (!res.ok) return;

        const { resume } = (await res.json()) as { resume: ResumeDTO };
        setResumes((previous) =>
          previous.map((row) =>
            row.id === resume.id
              ? { ...row, title: resume.title, version: resume.version, updatedAt: resume.updatedAt }
              : row
          )
        );

        // The renamed row may be the one currently open in the builder; its
        // version just moved, so the next autosave must compare against it or
        // it will (correctly, but confusingly) hit a conflict on a rename it
        // never saw.
        if (useResumeStore.getState().remoteResumeId === resume.id) {
          useResumeStore.getState().setSyncMeta({ remoteVersion: resume.version, title: resume.title });
        }
      } finally {
        setPendingId(null);
      }
    },
    [load]
  );

  const setDefaultResume = useCallback(
    async (summary: ResumeSummary) => {
      if (summary.isDefault) return;

      setPendingId(summary.id);
      try {
        const res = await fetch(`/api/resumes/${summary.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: summary.version, isDefault: true }),
        });
        if (!res.ok && res.status !== 409) return;

        const { resume } = (await res.json()) as { resume: ResumeDTO };
        if (useResumeStore.getState().remoteResumeId === resume.id) {
          useResumeStore.getState().setSyncMeta({ remoteVersion: resume.version });
        }
        await load();
      } finally {
        setPendingId(null);
      }
    },
    [load]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      const wasActive = useResumeStore.getState().remoteResumeId === id;

      setPendingId(id);
      setResumes((previous) => previous.filter((row) => row.id !== id));

      try {
        await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      } finally {
        const remaining = await load();

        if (wasActive) {
          const next = remaining.find((row) => row.isDefault) ?? remaining[0];
          if (next) {
            await openResume(next.id);
          } else {
            const ownerUserId = useResumeStore.getState().ownerUserId;
            useResumeStore.getState().resetForUser(ownerUserId);
          }
        }

        setPendingId(null);
      }
    },
    [load, openResume]
  );

  return {
    resumes,
    isLoading,
    failed,
    pendingId,
    activeResumeId,
    refresh: load,
    createResume,
    openAndEdit,
    duplicateResume,
    renameResume,
    setDefaultResume,
    deleteResume,
  };
}
