"use client";

import React, { memo } from "react";
import { Plus, Trash2, Scissors } from "lucide-react";
import { Section, Input, RichTextEditor } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Education } from "@/types";

type EducationSectionProps = {
  education: Education[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onToggleBreakPage: (index: number) => void;
  onAiGenerate: () => void;
  onAiGenerateDescription: (instruction: string, existingData: string) => Promise<string>;
  aiLoading: boolean;
};

const EducationSectionComponent = ({
  education,
  onAdd,
  onRemove,
  onUpdate,
  onToggleBreakPage,
  onAiGenerate,
  onAiGenerateDescription,
  aiLoading,
}: EducationSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={`${t("education")} (${education.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      {education.map((edu, idx) => (
        <div
          key={idx}
          className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative"
        >
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => onToggleBreakPage(idx)}
              className={cn(
                "p-1 text-xs transition-colors",
                edu.breakPage
                  ? "text-indigo-600"
                  : "text-slate-300 hover:text-indigo-600"
              )}
              title={
                edu.breakPage
                  ? t("actions.removePageBreak")
                  : t("actions.addPageBreak")
              }
            >
              <Scissors size={EDITOR_CONFIG.ICON_SIZE_SMALL} />
            </button>
            <button
              onClick={() => onRemove(idx)}
              className="p-1 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={EDITOR_CONFIG.ICON_SIZE_MEDIUM} />
            </button>
          </div>
          <Input
            label={t("labels.school")}
            value={edu.school}
            onChange={(e) => onUpdate(idx, "school", e.target.value)}
          />
          <Input
            label={t("labels.degree")}
            value={edu.degree}
            onChange={(e) => onUpdate(idx, "degree", e.target.value)}
          />
          <Input
            label={t("labels.year")}
            value={edu.year}
            onChange={(e) => onUpdate(idx, "year", e.target.value)}
          />
          <RichTextEditor
            label={t("labels.description")}
            value={edu.description || ""}
            onChange={(v) => onUpdate(idx, "description", v)}
            placeholder="e.g., 3.8/4.0, First Class Honours, Summa Cum Laude"
            onAiGenerate={onAiGenerateDescription}
            minHeight={EDITOR_CONFIG.MIN_HEIGHT_DESCRIPTION}
          />
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t("actions.addEducation")}
      </button>
    </Section>
  );
};

export const EducationSection = memo(EducationSectionComponent);
