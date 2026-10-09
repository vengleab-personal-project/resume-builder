"use client";

import { RefObject, useEffect, useState } from 'react';
import { clearPrintBreaks, paginateResume, Pagination } from './pagination';

/** A last page holding less than this is worth a "nearly fits on one less page" hint. */
const NEARLY_FITS_PX = 180;

/**
 * Keeps the print pagination in step with the preview: re-paginates whenever the
 * resume's content or size changes (and once more just before printing), marking the
 * blocks print must break at, and returns what the page markers need to draw.
 */
export const usePrintPagination = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => schedule());
    const printing = window.matchMedia('print');
    const measure = () => {
      // Never measure the print layout itself: it is not the screen layout the breaks
      // are computed from, and switching to print can fire the observers below.
      if (printing.matches) return;
      const next = paginateResume(container);
      // Only re-render when the pages actually moved. A re-render re-applies the
      // descriptions' HTML, which drops the break marker on a bullet and fires the
      // mutation observer - so an unconditional update would loop every frame.
      setPagination((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      // Templates are replaced when the user switches them; watch the current boxes.
      resizeObserver.disconnect();
      resizeObserver.observe(container);
      container.querySelectorAll('#resume-preview, #resume-preview > *, [data-print-columns] > *').forEach((el) =>
        resizeObserver.observe(el)
      );
    };

    // Batched to one measure per frame. Content can grow inside the A4 min-height
    // without resizing the frame, so edits are watched as well as sizes. (Attribute
    // changes are not watched: measuring writes the break markers.)
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });

    // Fonts arriving late reflow the text without any DOM change.
    void document.fonts?.ready.then(schedule);
    // A pending frame may not run before the print snapshot is taken.
    window.addEventListener('beforeprint', measure);

    measure();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('beforeprint', measure);
      clearPrintBreaks(container);
    };
  }, [containerRef]);

  const flows = pagination?.flows ?? [];
  const pageCount = pagination?.pageCount ?? 1;
  const nearlyFits =
    pageCount === 2 && flows.every((flow) => !flow.breaks.length || flow.lastPageUsed < NEARLY_FITS_PX);

  return { flows, nearlyFits };
};
