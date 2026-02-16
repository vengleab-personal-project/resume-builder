"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Section, Input } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Certification } from "@/types";

type CertificationsSectionProps = {
  certifications: Certification[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

export const CertificationsSection = ({
  certifications,
  onAdd,
  onRemove,
  onUpdate,
  onAiGenerate,
  aiLoading,
}: CertificationsSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={`${t("certifications")} (${certifications.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      {certifications.map((cert, idx) => {
        const certObj =
          typeof cert === "string"
            ? { name: cert, issuer: "", expireDate: "", year: "" }
            : cert;
        return (
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
              label={t("labels.certName")}
              value={certObj.name}
              onChange={(e) => onUpdate(idx, "name", e.target.value)}
            />
            <Input
              label={t("labels.certIssuer")}
              value={certObj.issuer || ""}
              onChange={(e) => onUpdate(idx, "issuer", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("labels.certExpire")}
                value={certObj.expireDate || ""}
                onChange={(e) => onUpdate(idx, "expireDate", e.target.value)}
              />
              <Input
                label={t("labels.certYear")}
                value={certObj.year || ""}
                onChange={(e) => onUpdate(idx, "year", e.target.value)}
              />
            </div>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t("actions.addCertification")}
      </button>
    </Section>
  );
};
