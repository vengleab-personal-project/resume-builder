"use client";

import React from "react";
import { Plus, Trash2, Scissors } from "lucide-react";
import { Section, Input } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Publication } from "@/types";

type PublicationsSectionProps = {
  publications: Publication[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onToggleBreakPage: (index: number) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

export const PublicationsSection = ({
  publications,
  onAdd,
  onRemove,
  onUpdate,
  onToggleBreakPage,
  onAiGenerate,
  aiLoading,
}: PublicationsSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={`${t("publications")} (${publications.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      {publications.map((pub, idx) => (
        <div
          key={idx}
          className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative group"
        >
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => onToggleBreakPage(idx)}
              className={cn(
                "p-1 text-xs transition-colors",
                pub.breakPage
                  ? "text-indigo-600"
                  : "text-slate-300 hover:text-indigo-600"
              )}
              title={
                pub.breakPage
                  ? t("actions.removePageBreak")
                  : t("actions.addPageBreak")
              }
            >
              <Scissors size={EDITOR_CONFIG.ICON_SIZE_SMALL} />
            </button>
            <button
              onClick={() => onRemove(idx)}
              className="p-1 text-slate-300 hover:text-red-500"
            >
              <Trash2 size={EDITOR_CONFIG.ICON_SIZE_MEDIUM} />
            </button>
          </div>
          <Input
            label={t("labels.title")}
            value={pub.title}
            onChange={(e) => onUpdate(idx, "title", e.target.value)}
          />
          <Input
            label={t("labels.link")}
            value={pub.link || ""}
            onChange={(e) => onUpdate(idx, "link", e.target.value)}
          />
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t("actions.addPublication")}
      </button>
    </Section>
  );
};
