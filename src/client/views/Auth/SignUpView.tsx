"use client";

import React from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { SignUpForm, useSignUpLogic } from "@/client/features/Auth";
import { useTranslations } from "@/client/hooks/useTranslations";
import { LanguageSwitcher } from "@/client/components/ui/LanguageSwitcher";

export const SignUpView = () => {
  const { state, actions } = useSignUpLogic();
  const { t } = useTranslations("auth");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher variant="subtle" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.signup.title}</h1>
          <p className="text-slate-500 mt-2 text-sm">{t.signup.subtitle}</p>
        </div>

        {/* Sign Up Form Feature */}
        <SignUpForm state={state} actions={actions} />

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
};