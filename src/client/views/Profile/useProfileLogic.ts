"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageError, resizeImageToDataUrl } from '@/client/lib/image';
import { useTranslations } from '@/client/hooks/useTranslations';
import { toServerSnapshot, useResumeStore } from '@/client/store/resume-store';
import { useProfileStore } from '@/client/store/profile-store';
import {
  emptyProfileFields,
  PROFILE_FIELDS,
  type ProfileField,
  type ProfileFields,
} from '@/shared/lib/profile';
import type {
  ProfileConflictResponse,
  ProfileUpdateResponse,
  ResumeDTO,
  ResumeSummary,
} from '@/shared/types/persistence';

export type DefaultResumeInfo = {
  id: string;
  title: string;
  updatedAt: string;
  experienceCount: number;
  educationCount: number;
  skillCount: number;
};

export type SaveNotice = 'saved' | 'savedResume' | 'conflict' | 'failed' | null;

const pickFields = (source: ProfileFields): ProfileFields =>
  PROFILE_FIELDS.reduce((acc, field) => ({ ...acc, [field]: source[field] }), emptyProfileFields());

const toDefaultResumeInfo = (resume: ResumeDTO): DefaultResumeInfo => ({
  id: resume.id,
  title: resume.title,
  updatedAt: resume.updatedAt,
  experienceCount: resume.data.experience?.length ?? 0,
  educationCount: resume.data.education?.length ?? 0,
  skillCount: resume.data.skills?.length ?? 0,
});

/** The default FULL resume, or null when the user has none yet. */
async function fetchDefaultResume(): Promise<DefaultResumeInfo | null> {
  const listRes = await fetch('/api/resumes?kind=full', { credentials: 'same-origin' });
  if (!listRes.ok) return null;
  const { resumes } = (await listRes.json()) as { resumes: ResumeSummary[] };
  const target = resumes.find((resume) => resume.isDefault);
  if (!target) return null;

  const detailRes = await fetch(`/api/resumes/${target.id}`, { credentials: 'same-origin' });
  if (!detailRes.ok) return null;
  const { resume } = (await detailRes.json()) as { resume: ResumeDTO };
  return toDefaultResumeInfo(resume);
}

export function useProfileLogic() {
  const { t } = useTranslations('profile');
  const router = useRouter();
  const { profile, status, load, applyServerProfile } = useProfileStore();

  const [fields, setFields] = useState<ProfileFields>(emptyProfileFields);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<SaveNotice>(null);
  const [photoError, setPhotoError] = useState(false);
  const [defaultResume, setDefaultResume] = useState<DefaultResumeInfo | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(true);

  // Always refetch on mount: edits made to the default resume in the builder reach the
  // profile on the server, and this page must show them, not a copy cached earlier.
  useEffect(() => {
    void load(true);
    void fetchDefaultResume()
      .then(setDefaultResume)
      .catch(() => setDefaultResume(null))
      .finally(() => setIsResumeLoading(false));
  }, [load]);

  // The form follows the server's record whenever it changes: first load, a save, or a
  // conflict. Nothing else replaces `profile`, so this never overwrites typing.
  useEffect(() => {
    if (profile) setFields(pickFields(profile));
  }, [profile]);

  const dirty = useMemo(
    () => Boolean(profile) && PROFILE_FIELDS.some((field) => fields[field] !== profile?.[field]),
    [fields, profile]
  );

  const setField = useCallback((field: ProfileField, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setNotice(null);
  }, []);

  const discard = useCallback(() => {
    if (profile) setFields(pickFields(profile));
    setFieldErrors({});
    setNotice(null);
    setPhotoError(false);
  }, [profile]);

  const choosePhoto = useCallback(
    async (file: File) => {
      setPhotoError(false);
      try {
        setField('photoUrl', await resizeImageToDataUrl(file));
      } catch (error) {
        if (!(error instanceof ImageError)) console.error(error);
        setPhotoError(true);
      }
    },
    [setField]
  );

  const removePhoto = useCallback(() => {
    setPhotoError(false);
    setField('photoUrl', '');
  }, [setField]);

  const save = useCallback(async () => {
    if (!profile || !dirty || isSaving) return;

    setIsSaving(true);
    setNotice(null);
    setFieldErrors({});

    // Only what changed: the server merges exactly these into the default resume, so a
    // field the user did not touch cannot overwrite a newer edit made in the builder.
    const patch: Partial<ProfileFields> = {};
    for (const field of PROFILE_FIELDS) {
      if (fields[field] !== profile[field]) patch[field] = fields[field];
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: profile.version, ...patch }),
      });

      if (res.status === 409) {
        const body = (await res.json()) as ProfileConflictResponse;
        applyServerProfile(body.profile);
        setNotice('conflict');
        return;
      }

      if (res.status === 400) {
        const body = (await res.json()) as {
          details?: { issues?: { field?: ProfileField; message?: string }[] };
        };
        const errors: Partial<Record<ProfileField, string>> = {};
        for (const issue of body.details?.issues ?? []) {
          if (issue.field && issue.message) errors[issue.field] = issue.message;
        }
        setFieldErrors(errors);
        setNotice('failed');
        return;
      }

      if (!res.ok) {
        setNotice('failed');
        return;
      }

      const body = (await res.json()) as ProfileUpdateResponse;
      applyServerProfile(body.profile);

      if (body.resume) {
        setDefaultResume(toDefaultResumeInfo(body.resume));
        // The builder holds this same resume in memory. Adopting the version the server
        // just wrote keeps its next autosave from losing a 409 (and the user's typing).
        if (useResumeStore.getState().remoteResumeId === body.resume.id) {
          useResumeStore.getState().applyServerSnapshot(toServerSnapshot(body.resume));
        }
      }
      setNotice(body.resume ? 'savedResume' : 'saved');
    } catch {
      setNotice('failed');
    } finally {
      setIsSaving(false);
    }
  }, [applyServerProfile, dirty, fields, isSaving, profile]);

  // Same hand-off as ResumeList: swap the default resume into the builder's store, then go.
  const openDefaultInBuilder = useCallback(async () => {
    if (!defaultResume) return;
    const res = await fetch(`/api/resumes/${defaultResume.id}`, { credentials: 'same-origin' });
    if (!res.ok) return;
    const { resume } = (await res.json()) as { resume: ResumeDTO };
    useResumeStore.getState().applyServerSnapshot(toServerSnapshot(resume));
    router.push('/builder');
  }, [defaultResume, router]);

  /** Server validation messages are i18n keys ('profile.validation.emailInvalid'). */
  const errorMessage = useCallback(
    (field: ProfileField): string | undefined => {
      const key = fieldErrors[field]?.split('.').pop();
      if (!key) return undefined;
      return (t.validation as Record<string, string>)[key] ?? t.saveFailed;
    },
    [fieldErrors, t]
  );

  return {
    t,
    status,
    isLoading: status === 'idle' || (status === 'loading' && !profile),
    hasProfile: Boolean(profile),
    fields,
    setField,
    errorMessage,
    dirty,
    isSaving,
    notice,
    photoError,
    choosePhoto,
    removePhoto,
    save,
    discard,
    retry: () => void load(true),
    defaultResume,
    isResumeLoading,
    openDefaultInBuilder,
  };
}
