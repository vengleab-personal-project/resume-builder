"use client";

import React, { memo } from "react";
import { Section, TagInput } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";

type SkillsSectionProps = {
  skills: string[];
  onUpdate: (tags: string[]) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

const SkillsSectionComponent = ({
  skills,
  onUpdate,
  onAiGenerate,
  aiLoading,
}: SkillsSectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section
      title={t("skills")}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      <TagInput
        label={t("labels.skills")}
        tags={skills}
        onChange={onUpdate}
        placeholder={t("placeholders.addSkill")}
        addButtonLabel={t("buttons.add")}
      />
    </Section>
  );
};

export const SkillsSection = memo(SkillsSectionComponent);
