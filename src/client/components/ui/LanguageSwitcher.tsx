"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useTranslations } from "@/client/hooks/useTranslations";
import { SupportedLocale } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

interface LanguageSwitcherProps {
  variant?: "pill" | "subtle" | "dark";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "pill",
  className,
}) => {
  const { locale, setLocale, t } = useTranslations("language");

  const languages: { code: SupportedLocale; label: string; short: string }[] = [
    { code: "en", label: t.en, short: "EN" },
    { code: "km", label: t.km, short: "ខ្មែរ" },
  ];

  if (variant === "dark") {
    return (
      <div className={cn("flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60", className)}>
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLocale(lang.code)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              )}
              title={lang.label}
            >
              {lang.short}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Globe size={14} className="text-slate-400" />
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {languages.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLocale(lang.code)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded transition-all",
                  isActive
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title={lang.label}
              >
                {lang.short}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default "pill" style
  return (
    <div className={cn("flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200/80 shadow-xs", className)}>
      {languages.map((lang) => {
        const isActive = locale === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLocale(lang.code)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
              isActive
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
            title={lang.label}
          >
            <span>{lang.short}</span>
          </button>
        );
      })}
    </div>
  );
};
