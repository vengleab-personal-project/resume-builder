"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/client/components/ui/FormElements";
import { cn } from "@/shared/lib/utils";
import { Lock } from "lucide-react";
import { AuthState } from "../useAuthLogic";

interface LoginFormProps {
  state: AuthState;
  actions: {
    setEmail: (val: string) => void;
    setPassword: (val: string) => void;
    handleLogin: (e: React.FormEvent) => Promise<void>;
  };
}

export const LoginForm = ({ state, actions }: LoginFormProps) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <form onSubmit={actions.handleLogin} className="space-y-5">
        <Input 
          label="Email Address" 
          type="email" 
          placeholder="name@company.com" 
          value={state.email}
          onChange={(e) => actions.setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={state.password}
            onChange={(e) => actions.setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer">
              Remember me
            </label>
          </div>
          <Link 
            href="/forgot-password" 
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={state.isLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
            state.isLoading && "opacity-70"
          )}
        >
          {state.isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account?{" "}
          <Link 
            href="/signup" 
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};