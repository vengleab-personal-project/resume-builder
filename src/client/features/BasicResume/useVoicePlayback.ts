'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Plays the spoken question, and gets out of the way.
 *
 * Interruptible on purpose: a user who already knows the question should be
 * able to start answering without waiting for the prompt to finish, and a new
 * prompt must never overlap the previous one.
 *
 * Autoplay is not guaranteed — browsers block audio until the page has been
 * interacted with, so `play()` rejecting is an expected outcome, not an error.
 * The question text is always on screen, so a blocked prompt costs nothing.
 */
export const useVoicePlayback = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => stop, [stop]);

  /** Takes base64 WAV as the turn routes return it. */
  const speak = useCallback(
    async (base64Wav: string | null) => {
      stop();
      if (!base64Wav) return;

      const bytes = Uint8Array.from(atob(base64Wav), (char) => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      try {
        setIsSpeaking(true);
        await audio.play();
      } catch {
        // Autoplay blocked, or the tab is backgrounded. The question is on
        // screen either way.
        setIsSpeaking(false);
      }
    },
    [stop]
  );

  return { isSpeaking, speak, stop };
};
