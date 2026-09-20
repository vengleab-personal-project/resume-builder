import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
  /**
   * Desktop only. The mobile drawer is open/closed per visit and deliberately
   * not remembered — a drawer that reopens itself on every page load would be
   * worse than useless.
   */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

/**
 * Chrome preferences that should survive a reload but mean nothing to the
 * server. Kept in its own domain store rather than bolted onto an existing one,
 * per the one-file-per-domain convention.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'resume-builder-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
