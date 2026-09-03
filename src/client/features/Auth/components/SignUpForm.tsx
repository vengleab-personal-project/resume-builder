"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/client/components/ui/FormElements";
import { cn } from "@/shared/lib/utils";
import { useTranslations } from "@/client/hooks/useTranslations";
import { SignUpState } from "../useSignUpLogic";

interface SignUpFormProps {
  state: SignUpState;
  actions: {
    setFullName: (val: string) => void;
    setEmail: (val: string) => void;
    setPassword: (val: string) => void;
    setConfirmPassword: (val: string) => void;
    handleSignUp: (e: React.FormEvent) => Promise<void>;
  };
}

export const SignUpForm = ({ state, actions }: SignUpFormProps) => {
  const { t } = useTranslations("auth");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <form onSubmit={actions.handleSignUp} className="space-y-5">
        <Input 
          label={t.signup.fullName} 
          type="text" 
          placeholder={t.signup.fullNamePlaceholder} 
          value={state.fullName}
          onChange={(e) => actions.setFullName(e.target.value)}
          required
        />
        <Input 
          label={t.signup.email} 
          type="email" 
          placeholder={t.signup.emailPlaceholder} 
          value={state.email}
          onChange={(e) => actions.setEmail(e.target.value)}
          required
        />
        <Input 
          label={t.signup.password} 
          type="password" 
          placeholder={t.signup.passwordPlaceholder} 
          value={state.password}
          onChange={(e) => actions.setPassword(e.target.value)}
          required
        />
        <Input 
          label={t.signup.confirmPassword} 
          type="password" 
          placeholder={t.signup.confirmPasswordPlaceholder} 
          value={state.confirmPassword}
          onChange={(e) => actions.setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={state.isLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2",
            state.isLoading && "opacity-70"
          )}
        >
          {state.isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.signup.creatingAccount}</span>
            </>
          ) : (
            t.signup.createAccount
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          {t.signup.haveAccount}{" "}
          <Link 
            href="/login" 
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t.signup.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
};