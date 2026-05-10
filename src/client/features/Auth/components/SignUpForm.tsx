"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/client/components/ui/FormElements";
import { cn } from "@/shared/lib/utils";
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
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <form onSubmit={actions.handleSignUp} className="space-y-5">
        <Input 
          label="Full Name" 
          type="text" 
          placeholder="John Doe" 
          value={state.fullName}
          onChange={(e) => actions.setFullName(e.target.value)}
          required
        />
        <Input 
          label="Email Address" 
          type="email" 
          placeholder="name@company.com" 
          value={state.email}
          onChange={(e) => actions.setEmail(e.target.value)}
          required
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          value={state.password}
          onChange={(e) => actions.setPassword(e.target.value)}
          required
        />
        <Input 
          label="Confirm Password" 
          type="password" 
          placeholder="••••••••" 
          value={state.confirmPassword}
          onChange={(e) => actions.setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex items-start gap-2 mb-6">
          <input 
            type="checkbox" 
            id="terms" 
            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            required
          />
          <label htmlFor="terms" className="text-xs font-medium text-slate-600 cursor-pointer leading-tight">
            I agree to the <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
          </label>
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
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};