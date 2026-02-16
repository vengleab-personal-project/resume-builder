"use client";

import React, { memo } from "react";
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

const PublicationsSectionComponent = ({
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
          <div className="absolute -top-1 -right-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => onToggleBreakPage(idx)}
              className={cn(
                "p-1.5 rounded-full transition-all shadow-sm border transform hover:scale-110",
                pub.breakPage
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-400 hover:text-indigo-600 border-slate-200"
              )}
              title={
                pub.breakPage
                  ? t("actions.removePageBreak")
                  : t("actions.addPageBreak")
              }
            >
              <Scissors size={14} />
            </button>
            <button
              onClick={() => onRemove(idx)}
              className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
              title={t("actions.remove")}
            >
              <Trash2 size={14} />
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

export const PublicationsSection = memo(PublicationsSectionComponent);
