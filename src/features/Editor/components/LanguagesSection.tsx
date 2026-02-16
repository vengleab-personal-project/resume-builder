"use client";

import React, { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Section, Input } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Language } from "@/types";

type LanguagesSectionProps = {
  languages: Language[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

const LanguagesSectionComponent = ({
  languages,
  onAdd,
  onRemove,
  onUpdate,
  onAiGenerate,
  aiLoading,
}: LanguagesSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={`${t("languages")} (${languages.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      {languages.map((lang, idx) => (
        <div
          key={idx}
          className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative"
        >
          <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => onRemove(idx)}
              className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
              title={t("actions.remove")}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("labels.langName")}
              value={lang.name}
              onChange={(e) => onUpdate(idx, "name", e.target.value)}
            />
            <Input
              label={t("labels.langProficiency")}
              value={lang.proficiency}
              onChange={(e) => onUpdate(idx, "proficiency", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t("actions.addLanguage")}
      </button>
    </Section>
  );
};

export const LanguagesSection = memo(LanguagesSectionComponent);
