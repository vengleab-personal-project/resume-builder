"use client";

import { useEffect, useRef, useState } from 'react';
import { mmToPx, PAGE_WIDTH_MM } from '@/shared/config/resume-layout';

/** The width print lays the resume out at: an A4 sheet with no side margins. */
const A4_WIDTH_PX = mmToPx(PAGE_WIDTH_MM);

/**
 * Keeps the preview laid out at the printed page's real width and only *scales* it to
 * fit the panel.
 *
 * The canvas used to be a plain flex item, so beside the editor it shrank to whatever
 * was left (~500px on a 1440-1700px window). Text then wrapped differently from the
 * 794px-wide print, so the PDF and the DOCX broke lines - and pages - in places the
 * preview never showed. A transform scales the picture without reflowing it.
 *
 * Until the user picks a zoom, the scale tracks "fit to width"; `frame` is the scaled
 * box the canvas occupies, so the panel neither scrolls sideways nor leaves the
 * unscaled height as empty space.
 */
export const usePreviewScale = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;

    const measure = () => {
      const style = getComputedStyle(viewport);
      const available =
        viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      // A hidden panel (editor view on a small screen) measures 0: keep the last fit.
      if (available > 0) setFit(Math.min(1, available / A4_WIDTH_PX));
      setCanvasHeight(canvas.offsetHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const zoom = manualZoom ?? fit;

  return {
    viewportRef,
    canvasRef,
    zoom,
    setZoom: setManualZoom,
    frame: { width: A4_WIDTH_PX * zoom, height: canvasHeight * zoom },
  };
};
