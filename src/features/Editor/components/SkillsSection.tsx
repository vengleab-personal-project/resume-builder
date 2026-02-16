"use client";

import React from "react";
import { Section, RichTextEditor } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/config/constants";

type SkillsSectionProps = {
  skillsText: string;
  onUpdate: (value: string) => void;
  onAiGenerate: () => void;
  onAiGenerateContent: (instruction: string, existingData: string) => Promise<string>;
  aiLoading: boolean;
};

export const SkillsSection = ({
  skillsText,
  onUpdate,
  onAiGenerate,
  onAiGenerateContent,
  aiLoading,
}: SkillsSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={t("skills")}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      <RichTextEditor
        label={t("labels.skills")}
        value={skillsText}
        onChange={onUpdate}
        onAiGenerate={onAiGenerateContent}
        minHeight={EDITOR_CONFIG.MIN_HEIGHT_SKILLS}
      />
    </Section>
  );
};
