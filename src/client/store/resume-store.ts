import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResumeData, ThemeConfig, AIConfig, ViewMode } from '@/shared/types';
import type { SyncStatus } from '@/shared/types/persistence';
import { INITIAL_RESUME_DATA, INITIAL_THEME, INITIAL_AI_CONFIG, INITIAL_SECTION_ORDER } from '@/shared/config/constants';

export const DEFAULT_RESUME_TITLE = 'Untitled Resume';

export interface ServerResumeSnapshot {
  id: string;
  version: number;
  title: string;
  data: ResumeData;
  sectionOrder: string[];
  theme: ThemeConfig;
  updatedAt: string;
}

export interface SyncMeta {
  remoteResumeId: string | null;
  remoteVersion: number | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  ownerUserId: string | null;
}

interface ResumeState extends SyncMeta {
  title: string;
  resumeData: ResumeData;
  sectionOrder: string[];
  theme: ThemeConfig;
  aiConfig: AIConfig;
  isParsing: boolean;
  viewMode: ViewMode;
  // Set while a server snapshot is being written into the store, so the
  // autosave subscription can tell "the server told us this" apart from "the
  // user typed this" and not immediately echo it back.
  isApplyingRemote: boolean;
  setResumeData: (data: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
  setSectionOrder: (order: string[] | ((prev: string[]) => string[])) => void;
  updateNestedResumeData: (path: string, value: unknown) => void; // Helper for deep updates
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setAIConfig: (config: Partial<AIConfig>) => void;
  setIsParsing: (isParsing: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  resetData: () => void;
  applyServerSnapshot: (snapshot: ServerResumeSnapshot) => void;
  setSyncMeta: (meta: Partial<SyncMeta & { isApplyingRemote: boolean; title: string }>) => void;
  resetForUser: (userId: string | null) => void;
}

const INITIAL_SYNC_META: SyncMeta = {
  remoteResumeId: null,
  remoteVersion: null,
  syncStatus: 'idle',
  lastSyncedAt: null,
  ownerUserId: null,
};

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      title: DEFAULT_RESUME_TITLE,
      resumeData: INITIAL_RESUME_DATA as unknown as ResumeData,
      sectionOrder: INITIAL_SECTION_ORDER as unknown as string[],
      theme: INITIAL_THEME as unknown as ThemeConfig,
      aiConfig: INITIAL_AI_CONFIG as unknown as AIConfig,
      isParsing: false,
      viewMode: ViewMode.EDITOR,
      isApplyingRemote: false,
      ...INITIAL_SYNC_META,
      setResumeData: (data) => set((state) => ({
        resumeData: typeof data === 'function' ? data(state.resumeData) : data
      })),
      setSectionOrder: (order) => set((state) => ({
        sectionOrder: typeof order === 'function' ? order(state.sectionOrder) : order
      })),
      updateNestedResumeData: (path, value) => set((state) => {
        // Note: Simple implementation for now, could be improved with lodash set
        return { resumeData: { ...state.resumeData } };
      }),
      setTheme: (newTheme) => set((state) => ({ theme: { ...state.theme, ...newTheme } })),
      setAIConfig: (newConfig) => set((state) => ({ aiConfig: { ...state.aiConfig, ...newConfig } })),
      setIsParsing: (isParsing) => set({ isParsing }),
      setViewMode: (mode) => set({ viewMode: mode }),
      resetData: () => set({
        resumeData: INITIAL_RESUME_DATA as unknown as ResumeData,
        sectionOrder: INITIAL_SECTION_ORDER as unknown as string[],
        theme: INITIAL_THEME as unknown as ThemeConfig,
        aiConfig: INITIAL_AI_CONFIG as unknown as AIConfig,
      }),
      applyServerSnapshot: (snapshot) => set({
        title: snapshot.title,
        resumeData: snapshot.data,
        sectionOrder: snapshot.sectionOrder,
        theme: snapshot.theme,
        remoteResumeId: snapshot.id,
        remoteVersion: snapshot.version,
        lastSyncedAt: snapshot.updatedAt,
        syncStatus: 'saved',
        isApplyingRemote: true,
      }),
      setSyncMeta: (meta) => set(meta),
      // A shared browser must never let user B inherit user A's cached resume:
      // a different owner wipes the local document back to a blank one.
      resetForUser: (userId) => set({
        title: DEFAULT_RESUME_TITLE,
        resumeData: INITIAL_RESUME_DATA as unknown as ResumeData,
        sectionOrder: INITIAL_SECTION_ORDER as unknown as string[],
        theme: INITIAL_THEME as unknown as ThemeConfig,
        ...INITIAL_SYNC_META,
        ownerUserId: userId,
      }),
    }),
    {
      name: 'resume-storage',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // v1 had no sync metadata at all, v2 had no title. Everything else
      // persisted is still valid, so each step only needs to seed the fields
      // that version introduced -- leaving remoteResumeId null makes the sync
      // hook treat it as a fresh local document and upload it on first login.
      migrate: (persisted, version) => {
        let next = persisted as Partial<ResumeState>;
        if (version < 2) next = { ...next, ...INITIAL_SYNC_META };
        if (version < 3) next = { ...next, title: DEFAULT_RESUME_TITLE };
        return next;
      },
      partialize: (state) => ({
        title: state.title,
        resumeData: state.resumeData,
        sectionOrder: state.sectionOrder,
        theme: state.theme,
        aiConfig: state.aiConfig,
        remoteResumeId: state.remoteResumeId,
        remoteVersion: state.remoteVersion,
        lastSyncedAt: state.lastSyncedAt,
        ownerUserId: state.ownerUserId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (
            !state.aiConfig ||
            state.aiConfig.provider === 'openai' ||
            state.aiConfig.model === 'gemini-3-flash-preview' ||
            state.aiConfig.model === 'gpt-4o'
          ) {
            state.aiConfig = INITIAL_AI_CONFIG as unknown as AIConfig;
          }
        }
      },
    }
  )
);
