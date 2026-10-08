"use client";

import React, { useEffect, useRef } from "react";
import { ENV } from "@/shared/config/env";
import type { TelegramAuthPayload } from "@/shared/types/auth";

declare global {
  interface Window {
    __onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

interface TelegramLoginButtonProps {
  onAuth: (payload: TelegramAuthPayload) => void;
  size?: "small" | "medium" | "large";
  requestAccess?: boolean;
  className?: string;
}

export const TelegramLoginButton = ({
  onAuth,
  size = "large",
  requestAccess = false,
  className,
}: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(onAuth);

  useEffect(() => {
    handlerRef.current = onAuth;
  }, [onAuth]);

  useEffect(() => {
    const botUsername = ENV.TELEGRAM_BOT_USERNAME;
    const container = containerRef.current;
    if (!botUsername || !container) return;

    // The widget resolves data-onauth as a global expression, so the handler
    // has to live on window. It delegates to a ref rather than closing over
    // `onAuth` so a re-render never leaves a stale callback installed.
    window.__onTelegramAuth = (user) => handlerRef.current(user);

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", size);
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-userpic", "false");
    // data-onauth, not data-auth-url: a redirect callback would hand failures
    // to a full page load and lose the in-app, translated error message.
    script.setAttribute("data-onauth", "__onTelegramAuth(user)");
    if (requestAccess) {
      script.setAttribute("data-request-access", "write");
    }

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
      delete window.__onTelegramAuth;
    };
  }, [size, requestAccess]);

  // An unconfigured bot username means the widget can only render a broken
  // iframe, so the whole control is omitted rather than shown failing.
  if (!ENV.TELEGRAM_BOT_USERNAME) return null;

  return <div ref={containerRef} className={className} />;
};
