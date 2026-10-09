"use client";

import { useEffect, useRef } from 'react';
import { toServerSnapshot, useResumeStore } from '@/client/store/resume-store';
import { useSession } from '@/client/features/Auth/useSession';
import { useProfileStore } from '@/client/store/profile-store';
import { profileHasContent, seedResumeData } from '@/shared/lib/profile';
import type { ResumeDTO, ResumeSummary } from '@/shared/types/persistence';
import type { ResumeData } from '@/shared/types';

const AUTOSAVE_DEBOUNCE_MS = 1500;

// A freshly seeded store is not worth a row in Postgres, and uploading it would
// overwrite nothing but still create clutter. This is the same emptiness test
// the builder uses to decide whether to open the ingest modal.
function hasRealContent(data: ResumeData): boolean {
  if (!data) return false;
  const name = data.personalInfo?.name?.trim() ?? '';
  return (
    (data.experience?.length ?? 0) > 0 ||
    (data.education?.length ?? 0) > 0 ||
    (data.skills?.length ?? 0) > 0 ||
    (data.summary?.trim().length ?? 0) > 0 ||
    (name !== '' && name !== 'Your Name')
  );
}

const snapshotFromDTO = toServerSnapshot;

export function useResumeSync(): void {
  const { user, isLoading } = useSession();

  const hydratedForUserRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const hasPendingRef = useRef(false);
  const isDirtyRef = useRef(false);

  // The save routine reads everything it needs from the store at call time, so
  // it never closes over a stale document.
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const scheduleRef = useRef<() => void>(() => {});

  useEffect(() => {
    saveRef.current = async () => {
      const store = useResumeStore.getState();
      if (!store.ownerUserId) return;

      if (isSavingRef.current) {
        hasPendingRef.current = true;
        return;
      }

      isSavingRef.current = true;
      store.setSyncMeta({ syncStatus: 'syncing' });

      try {
        // No server row yet: the user started from an empty local document and
        // has now typed something worth keeping.
        if (!store.remoteResumeId || store.remoteVersion === null) {
          const res = await fetch('/api/resumes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: store.resumeData,
              sectionOrder: store.sectionOrder,
              theme: store.theme,
            }),
          });
          if (!res.ok) {
            store.setSyncMeta({ syncStatus: 'error' });
            return;
          }
          const { resume } = (await res.json()) as { resume: ResumeDTO };
          store.setSyncMeta({
            title: resume.title,
            remoteResumeId: resume.id,
            remoteVersion: resume.version,
            lastSyncedAt: resume.updatedAt,
            syncStatus: 'saved',
          });
          isDirtyRef.current = false;
          return;
        }

        const res = await fetch(`/api/resumes/${store.remoteResumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version: store.remoteVersion,
            data: store.resumeData,
            sectionOrder: store.sectionOrder,
            theme: store.theme,
          }),
        });

        if (res.status === 409) {
          // Another tab or device won the race. Its record is adopted rather
          // than overwritten, and the status flips to `conflict` so the UI can
          // say so -- the one thing that must not happen is a silent overwrite.
          const body = (await res.json()) as { resume: ResumeDTO };
          useResumeStore.getState().applyServerSnapshot(snapshotFromDTO(body.resume));
          useResumeStore.getState().setSyncMeta({ syncStatus: 'conflict' });
          isDirtyRef.current = false;
          return;
        }

        if (!res.ok) {
          store.setSyncMeta({ syncStatus: 'error' });
          return;
        }

        const { resume } = (await res.json()) as { resume: ResumeDTO };
        store.setSyncMeta({
          remoteVersion: resume.version,
          lastSyncedAt: resume.updatedAt,
          syncStatus: 'saved',
        });
        isDirtyRef.current = false;
      } catch {
        useResumeStore.getState().setSyncMeta({ syncStatus: 'error' });
      } finally {
        isSavingRef.current = false;
        if (hasPendingRef.current) {
          hasPendingRef.current = false;
          scheduleRef.current();
        }
      }
    };

    scheduleRef.current = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void saveRef.current();
      }, AUTOSAVE_DEBOUNCE_MS);
    };
  }, []);

  // Hydration. Runs once per signed-in user id.
  useEffect(() => {
    if (isLoading) return;

    const store = useResumeStore.getState();

    if (!user) {
      hydratedForUserRef.current = null;
      // The profile is the previous user's identity; nothing may seed from it now.
      useProfileStore.getState().reset();
      store.setSyncMeta({ syncStatus: 'idle' });
      return;
    }

    if (hydratedForUserRef.current !== user.id) useProfileStore.getState().reset();

    // Shared-browser guard: a different owner means the cached document belongs
    // to somebody else and must not be adopted, let alone uploaded.
    if (store.ownerUserId && store.ownerUserId !== user.id) {
      store.resetForUser(user.id);
    } else if (!store.ownerUserId) {
      store.setSyncMeta({ ownerUserId: user.id });
    }

    if (hydratedForUserRef.current === user.id) return;
    hydratedForUserRef.current = user.id;

    let cancelled = false;

    void (async () => {
      useResumeStore.getState().setSyncMeta({ syncStatus: 'syncing' });

      try {
        // `kind=full` is explicit rather than relying on the route's default:
        // this hook hydrates `useResumeStore`, whose shape is ResumeData, and a
        // basic CV arriving here would be a foreign shape in the store rather
        // than a caught error. Stating the kind means a future change to the
        // route's default cannot reach this line.
        const listRes = await fetch('/api/resumes?kind=full', { credentials: 'same-origin' });
        if (!listRes.ok) {
          if (!cancelled) useResumeStore.getState().setSyncMeta({ syncStatus: 'error' });
          return;
        }

        const { resumes } = (await listRes.json()) as { resumes: ResumeSummary[] };

        if (resumes.length > 0) {
          // Server wins on first load: the account is the source of truth, and
          // localStorage may be an arbitrarily old copy from another device.
          const target = resumes.find((resume) => resume.isDefault) ?? resumes[0];
          const detailRes = await fetch(`/api/resumes/${target.id}`, {
            credentials: 'same-origin',
          });
          if (!detailRes.ok) {
            if (!cancelled) useResumeStore.getState().setSyncMeta({ syncStatus: 'error' });
            return;
          }
          const { resume } = (await detailRes.json()) as { resume: ResumeDTO };
          if (cancelled) return;
          useResumeStore.getState().applyServerSnapshot(snapshotFromDTO(resume));
          isDirtyRef.current = false;
          return;
        }

        // Nothing on the server. A local document with real content is this
        // user's work from before they had an account, so it is uploaded once.
        const local = useResumeStore.getState();
        // A document that is only the profile's identity (an earlier seed, persisted
        // with the store) is not the user's work: uploading it would create a resume
        // nobody asked for and carry a stale identity back over the current profile.
        if (local.isProfileSeed || !hasRealContent(local.resumeData)) {
          // A blank start is not blank for someone with a profile: begin from it, so
          // their name and contact details are already on the page. It stays local
          // (`isApplyingRemote` skips the autosave) until they actually edit - an
          // untouched seed is no more worth a row than the placeholder document was.
          const profile = await useProfileStore.getState().load();
          if (cancelled) return;
          if (profileHasContent(profile)) {
            useResumeStore.setState({
              resumeData: seedResumeData(profile),
              isProfileSeed: true,
              isApplyingRemote: true,
            });
          }
          useResumeStore.getState().setSyncMeta({ syncStatus: 'idle' });
          return;
        }

        const createRes = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: local.resumeData,
            sectionOrder: local.sectionOrder,
            theme: local.theme,
          }),
        });
        if (!createRes.ok) {
          if (!cancelled) useResumeStore.getState().setSyncMeta({ syncStatus: 'error' });
          return;
        }
        const { resume } = (await createRes.json()) as { resume: ResumeDTO };
        if (cancelled) return;
        useResumeStore.getState().setSyncMeta({
          title: resume.title,
          remoteResumeId: resume.id,
          remoteVersion: resume.version,
          lastSyncedAt: resume.updatedAt,
          syncStatus: 'saved',
        });
        isDirtyRef.current = false;
      } catch {
        if (!cancelled) useResumeStore.getState().setSyncMeta({ syncStatus: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading]);

  // Autosave subscription.
  useEffect(() => {
    if (!user) return;

    const unsubscribe = useResumeStore.subscribe((state, prev) => {
      if (state.isApplyingRemote) {
        // The change came from applyServerSnapshot, not the user. Clearing the
        // flag re-enters this listener once with an unchanged document, which
        // the identity check below then ignores.
        useResumeStore.setState({ isApplyingRemote: false });
        return;
      }

      if (
        state.resumeData === prev.resumeData &&
        state.sectionOrder === prev.sectionOrder &&
        state.theme === prev.theme
      ) {
        return;
      }

      isDirtyRef.current = true;
      scheduleRef.current();
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [user]);

  // Last-chance flush. A closing tab kills in-flight fetches, so the pending
  // edit goes out through sendBeacon, which the browser is obliged to deliver.
  useEffect(() => {
    if (!user) return;

    const flush = () => {
      if (!isDirtyRef.current) return;

      const store = useResumeStore.getState();
      if (!store.remoteResumeId || store.remoteVersion === null) return;

      const payload = JSON.stringify({
        version: store.remoteVersion,
        data: store.resumeData,
        sectionOrder: store.sectionOrder,
        theme: store.theme,
      });

      const sent = navigator.sendBeacon(
        `/api/resumes/${store.remoteResumeId}/beacon`,
        new Blob([payload], { type: 'application/json' })
      );
      if (sent) isDirtyRef.current = false;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flush);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flush);
    };
  }, [user]);
}
