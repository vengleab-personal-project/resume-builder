"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Section, Input } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Reference } from "@/types";

type ReferencesSectionProps = {
  references: Reference[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

export const ReferencesSection = ({
  references,
  onAdd,
  onRemove,
  onUpdate,
  onAiGenerate,
  aiLoading,
}: ReferencesSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={`${t("references")} (${references.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      {references.map((ref, idx) => (
        <div
          key={idx}
          className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative"
        >
          <div className="absolute top-0 right-0">
            <button
              onClick={() => onRemove(idx)}
              className="p-1 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={EDITOR_CONFIG.ICON_SIZE_MEDIUM} />
            </button>
          </div>
          <Input
            label={t("labels.refName")}
            value={ref.name}
            onChange={(e) => onUpdate(idx, "name", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("labels.refTitle")}
              value={ref.title || ""}
              onChange={(e) => onUpdate(idx, "title", e.target.value)}
            />
            <Input
              label={t("labels.refCompany")}
              value={ref.company || ""}
              onChange={(e) => onUpdate(idx, "company", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("labels.refPhone")}
              value={ref.phone || ""}
              onChange={(e) => onUpdate(idx, "phone", e.target.value)}
            />
            <Input
              label={t("labels.refEmail")}
              value={ref.email || ""}
              onChange={(e) => onUpdate(idx, "email", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t("actions.addReference")}
      </button>
    </Section>
  );
};
