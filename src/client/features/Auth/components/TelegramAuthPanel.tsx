"use client";

import React from "react";
import { ENV } from "@/shared/config/env";
import { useTranslations } from "@/client/hooks/useTranslations";
import type { TelegramAuthPayload } from "@/shared/types/auth";
import { TelegramLoginButton } from "./TelegramLoginButton";

interface TelegramAuthPanelProps {
  onAuth: (payload: TelegramAuthPayload) => void;
  isLoading: boolean;
}

// The "or / Telegram" block shared by the login and signup forms. The divider
// is gated on the same env var as the widget itself so an unconfigured bot
// leaves no stranded "or" separator behind.
export const TelegramAuthPanel = ({ onAuth, isLoading }: TelegramAuthPanelProps) => {
  const { t } = useTranslations("auth");

  if (!ENV.TELEGRAM_BOT_USERNAME) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {t.telegram.or}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-xs text-slate-500">
          {isLoading ? t.telegram.signingIn : t.telegram.continueWith}
        </p>
        <TelegramLoginButton onAuth={onAuth} />
      </div>
    </div>
  );
};
