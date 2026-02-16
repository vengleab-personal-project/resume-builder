"use client";

import React, { memo } from "react";
import { Plus, Trash2, Scissors } from "lucide-react";
import { Section, Input, RichTextEditor } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Experience } from "@/types";

type ExperienceSectionProps = {
  experience: Experience[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onToggleBreakPage: (index: number) => void;
  onRefineRole: (index: number) => void;
  onAiGenerate: () => void;
  onAiGenerateDescription: (instruction: string, existingData: string) => Promise<string>;
  aiLoading: boolean;
  roleLoadingStates: Record<string, boolean>;
};

const ExperienceSectionComponent = ({
  experience,
  onAdd,
  onRemove,
  onUpdate,
  onToggleBreakPage,
  onRefineRole,
  onAiGenerate,
  onAiGenerateDescription,
  aiLoading,
  roleLoadingStates,
}: ExperienceSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={`${t("experience")} (${experience.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      {experience.map((exp, idx) => (
        <div
          key={idx}
          className="mb-6 p-4 border border-slate-100 rounded-lg bg-slate-50/30 relative group"
        >
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => onToggleBreakPage(idx)}
              className={cn(
                "p-1.5 rounded-md transition-all shadow-sm border",
                exp.breakPage
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-300 hover:text-indigo-600 border-slate-100"
              )}
              title={
                exp.breakPage
                  ? t("actions.removePageBreak")
                  : t("actions.addPageBreak")
              }
            >
              <Scissors size={EDITOR_CONFIG.ICON_SIZE_MEDIUM} />
            </button>
            <button
              onClick={() => onRemove(idx)}
              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-md transition-all shadow-sm border border-slate-100"
            >
              <Trash2 size={EDITOR_CONFIG.ICON_SIZE_MEDIUM} />
            </button>
          </div>
          <Input
            label={t("labels.role")}
            value={exp.role}
            onChange={(e) => onUpdate(idx, "role", e.target.value)}
            onAiClick={() => onRefineRole(idx)}
            aiLoading={roleLoadingStates[`exp-role-${idx}`]}
          />
          <Input
            label={t("labels.company")}
            value={exp.company}
            onChange={(e) => onUpdate(idx, "company", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("labels.dates")}
              value={exp.dates}
              onChange={(e) => onUpdate(idx, "dates", e.target.value)}
            />
            <Input
              label={t("labels.location")}
              value={exp.location}
              onChange={(e) => onUpdate(idx, "location", e.target.value)}
            />
          </div>
          <RichTextEditor
            label={t("labels.achievements")}
            value={exp.description || ""}
            onChange={(v: string) => onUpdate(idx, "description", v)}
            placeholder={t("placeholders.bullets")}
            onAiGenerate={onAiGenerateDescription}
            minHeight={EDITOR_CONFIG.MIN_HEIGHT_BULLETS}
          />
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t("actions.addExperience")}
      </button>
    </Section>
  );
};

export const ExperienceSection = memo(ExperienceSectionComponent);
