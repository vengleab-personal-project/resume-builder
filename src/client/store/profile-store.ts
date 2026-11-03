import { create } from 'zustand';
import type { ProfileDTO } from '@/shared/types/persistence';

// Not persisted, like coin-store: the profile is the server's record, and the pieces
// that depend on it (seeding a new resume, filling an import's blanks) need the current
// value, not a stale local copy. It is cleared when the signed-in user changes
// (useResumeSync), so one user's identity can never seed another's resume.
interface ProfileState {
  profile: ProfileDTO | null;
  status: 'idle' | 'loading' | 'ready' | 'error';

  /** Fetches the profile once and shares it; `force` refetches (the profile page). */
  load: (force?: boolean) => Promise<ProfileDTO | null>;
  applyServerProfile: (profile: ProfileDTO) => void;
  reset: () => void;
}

// One request in flight at a time: the builder, the seeding paths and the profile page
// can all ask for the profile in the same tick.
let inflight: Promise<ProfileDTO | null> | null = null;

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  status: 'idle',

  load: async (force = false) => {
    const { profile } = get();
    if (profile && !force) return profile;
    if (inflight) return inflight;

    set({ status: 'loading' });
    inflight = (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) {
          set({ status: 'error' });
          return get().profile;
        }
        const body = (await res.json()) as { profile: ProfileDTO };
        set({ profile: body.profile, status: 'ready' });
        return body.profile;
      } catch {
        // A transient failure keeps whatever was loaded; callers fall back to a
        // blank (placeholder) resume rather than blocking on the profile.
        set({ status: 'error' });
        return get().profile;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },

  applyServerProfile: (profile) => set({ profile, status: 'ready' }),

  reset: () => {
    inflight = null;
    set({ profile: null, status: 'idle' });
  },
}));
