"use client";

import React, { memo } from "react";
import { Plus, Trash2, User } from "lucide-react";
import { Section, Input } from "@/client/components/ui/FormElements";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { ResumeData } from "@/shared/types";

type PersonalInfoSectionProps = {
  personalInfo: ResumeData['personalInfo'];
  onUpdateField: (key: string, value: string) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const PersonalInfoSectionComponent = ({
  personalInfo,
  onUpdateField,
  onPhotoChange,
  onAiGenerate,
  aiLoading,
  readOnly = false,
  defaultOpen = true,
}: PersonalInfoSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={t.personalInfo}
      icon={
        <div className="bg-indigo-500 p-1.5 rounded-lg text-white">
          <User size={16} />
        </div>
      }
      defaultOpen={defaultOpen}
      onAiClick={readOnly ? undefined : onAiGenerate}
      aiLoading={aiLoading}
    >
      <div className="mb-4">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          {t.labels.photo}
        </label>
        <div className="flex items-center gap-4">
          {personalInfo.photoUrl ? (
            <div className="relative w-16 h-16 group">
              <img
                src={personalInfo.photoUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border border-slate-200"
              />
              {!readOnly && (
                <button
                  onClick={() => onUpdateField("photoUrl", "")}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
              <Plus size={EDITOR_CONFIG.ICON_SIZE_XL} />
            </div>
          )}
          {!readOnly && (
            <label className="cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              {personalInfo.photoUrl ? t.actions.change : t.actions.upload}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onPhotoChange}
              />
            </label>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Input
          label={t.labels.fullName}
          value={personalInfo.name}
          onChange={(e) => onUpdateField("name", e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-transparent border-none p-0 focus:ring-0 focus:bg-transparent" : ""}
        />
        <Input
          label={t.labels.jobTitle}
          value={personalInfo.title || ""}
          onChange={(e) => onUpdateField("title", e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-transparent border-none p-0 focus:ring-0 focus:bg-transparent" : ""}
        />
        <Input
          label={t.labels.email}
          value={personalInfo.email}
          onChange={(e) => onUpdateField("email", e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-transparent border-none p-0 focus:ring-0 focus:bg-transparent" : ""}
        />
        <Input
          label={t.labels.phone}
          value={personalInfo.phone}
          onChange={(e) => onUpdateField("phone", e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-transparent border-none p-0 focus:ring-0 focus:bg-transparent" : ""}
        />
        <Input
          label={t.labels.address}
          value={personalInfo.address}
          onChange={(e) => onUpdateField("address", e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-transparent border-none p-0 focus:ring-0 focus:bg-transparent" : ""}
        />
        <Input
          label={t.labels.linkedin}
          value={personalInfo.linkedin}
          onChange={(e) => onUpdateField("linkedin", e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-transparent border-none p-0 focus:ring-0 focus:bg-transparent" : ""}
        />
      </div>
    </Section>
  );
};

export const PersonalInfoSection = memo(PersonalInfoSectionComponent);
