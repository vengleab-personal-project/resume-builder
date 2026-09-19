"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Input } from "@/client/components/ui/FormElements";
import { cn } from "@/shared/lib/utils";
import { useTranslations } from "@/client/hooks/useTranslations";
import { AuthState } from "../useAuthLogic";
import { useTelegramAuth } from "../useTelegramAuth";
import { TelegramAuthPanel } from "./TelegramAuthPanel";

interface LoginFormProps {
  state: AuthState;
  actions: {
    setUsername: (val: string) => void;
    setPassword: (val: string) => void;
    handleLogin: (e: React.FormEvent) => Promise<void>;
  };
}

export const LoginForm = ({ state, actions }: LoginFormProps) => {
  const { t } = useTranslations("auth");
  const telegram = useTelegramAuth({ mode: "login" });

  const error = state.error ?? telegram.error;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <form onSubmit={actions.handleLogin} className="space-y-5">
        <Input
          label={t.login.username}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t.login.usernamePlaceholder}
          value={state.username}
          onChange={(e) => actions.setUsername(e.target.value)}
          required
        />
        <Input
          label={t.login.password}
          type="password"
          autoComplete="current-password"
          placeholder={t.login.passwordPlaceholder}
          value={state.password}
          onChange={(e) => actions.setPassword(e.target.value)}
          required
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-700"
          >
            <AlertCircle size={14} className="mt-px flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={state.isLoading || telegram.isLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
            state.isLoading && "opacity-70"
          )}
        >
          {state.isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.login.signingIn}</span>
            </>
          ) : (
            t.login.signIn
          )}
        </button>
      </form>

      <TelegramAuthPanel onAuth={telegram.handleAuth} isLoading={telegram.isLoading} />

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          {t.login.noAccount}{" "}
          <Link
            href="/signup"
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t.login.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
};
