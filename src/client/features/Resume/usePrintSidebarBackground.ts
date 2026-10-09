import { useEffect } from 'react';

const SIDEBAR_BG_VAR = '--resume-sidebar-bg';

// The sheet's top and bottom print margins sit outside the page's content box, so
// nothing inside the resume (even a fixed layer) can paint into them. The page
// background is the only thing that reaches them: expose the sidebar colour on
// <html> so globals.css can paint a sidebar-width strip there, on every page.
// `enabled` is false for non-printing renders of the same template (thumbnails).
export const usePrintSidebarBackground = (color: string, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.style.setProperty(SIDEBAR_BG_VAR, color);
    return () => {
      root.style.removeProperty(SIDEBAR_BG_VAR);
    };
  }, [color, enabled]);
};
