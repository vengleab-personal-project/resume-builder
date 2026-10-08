"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/client/hooks/useTranslations";
import type { PublicUser } from "@/shared/types/auth";
import { authErrorMessage, networkErrorMessage } from "./authErrors";
import { safeNextPath } from "./useAuthLogic";
import { setSessionUser } from "./useSession";

export interface SignUpState {
  displayName: string;
  username: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
}

export function useSignUpLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations("auth");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t.signup.passwordMismatch);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(authErrorMessage(t, body));
        return;
      }

      // Signup issues a session cookie, so the new account lands straight in
      // the app rather than being bounced back to the login form.
      setSessionUser((body as { user: PublicUser }).user);
      router.replace(safeNextPath(searchParams.get("next")));
      router.refresh();
    } catch {
      setError(networkErrorMessage(t));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: {
      displayName,
      username,
      password,
      confirmPassword,
      isLoading,
      error,
    },
    actions: {
      setDisplayName,
      setUsername,
      setPassword,
      setConfirmPassword,
      setError,
      handleSignUp,
    },
  };
}
