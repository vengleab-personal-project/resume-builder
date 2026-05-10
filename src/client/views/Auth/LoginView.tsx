"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { LoginForm, useAuthLogic } from "@/client/features/Auth";

export const LoginView = () => {
  const { state, actions } = useAuthLogic();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 mt-2 text-sm">Please enter your details to sign in</p>
        </div>

        {/* Login Form Feature */}
        <LoginForm state={state} actions={actions} />

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};