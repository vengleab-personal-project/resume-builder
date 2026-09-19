"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/client/hooks/useTranslations";
import type { PublicUser, TelegramAuthPayload } from "@/shared/types/auth";
import { authErrorMessage, networkErrorMessage } from "./authErrors";
import { safeNextPath } from "./useAuthLogic";
import { setSessionUser } from "./useSession";

export type TelegramAuthMode = "login" | "link";

interface UseTelegramAuthOptions {
  mode: TelegramAuthMode;
  onLinked?: (user: PublicUser) => void;
}

export function useTelegramAuth({ mode, onLinked }: UseTelegramAuthOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations("auth");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = useCallback(
    async (payload: TelegramAuthPayload) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          mode === "login" ? "/api/auth/telegram" : "/api/auth/telegram/link",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const body = await res.json().catch(() => null);

        if (!res.ok) {
          setError(authErrorMessage(t, body));
          return;
        }

        const user = (body as { user: PublicUser }).user;

        if (mode === "login") {
          setSessionUser(user);
          router.replace(safeNextPath(searchParams.get("next")));
          router.refresh();
          return;
        }

        setSessionUser(user);
        onLinked?.(user);
      } catch {
        setError(networkErrorMessage(t));
      } finally {
        setIsLoading(false);
      }
    },
    [mode, onLinked, router, searchParams, t]
  );

  return { handleAuth, isLoading, error, setError };
}
