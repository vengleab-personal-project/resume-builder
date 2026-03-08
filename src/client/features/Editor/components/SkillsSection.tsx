"use client";

import React, { memo } from "react";
import { Brain } from "lucide-react";
import { Section, TagInput } from "@/client/components/ui/FormElements";
import { useTranslations } from "@/client/hooks/useTranslations";

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
      title={t.skills}
      icon={
        <div className="bg-purple-500 p-1.5 rounded-lg text-white">
          <Brain size={16} />
        </div>
      }
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      <TagInput
        label={t.labels.skills}
        tags={skills}
        onChange={onUpdate}
        placeholder={t.actions.addSkill}
      />
    </Section>
  );
};

export const SkillsSection = memo(SkillsSectionComponent);
