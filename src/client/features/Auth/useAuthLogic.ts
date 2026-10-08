"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/client/hooks/useTranslations";
import { AUTH_ROUTES } from "@/shared/config/auth";
import type { PublicUser } from "@/shared/types/auth";
import { authErrorMessage, networkErrorMessage } from "./authErrors";
import { setSessionUser } from "./useSession";

export interface AuthState {
  username: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

// An open redirect would turn the login page into a phishing hop, so only a
// same-site absolute path is ever honoured from ?next=.
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return AUTH_ROUTES.AFTER_LOGIN;
  }
  return next;
}

export function useAuthLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations("auth");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(authErrorMessage(t, body));
        return;
      }

      setSessionUser((body as { user: PublicUser }).user);
      router.replace(safeNextPath(searchParams.get("next")));
      // The protected layouts are server components; without a refresh they
      // would render from the cache produced while logged out.
      router.refresh();
    } catch {
      setError(networkErrorMessage(t));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: {
      username,
      password,
      isLoading,
      error,
    },
    actions: {
      setUsername,
      setPassword,
      setError,
      handleLogin,
    },
  };
}
