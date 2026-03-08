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
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const SkillsSectionComponent = ({
  skills,
  onUpdate,
  onAiGenerate,
  aiLoading,
  readOnly = false,
  defaultOpen = true,
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
      onAiClick={readOnly ? undefined : onAiGenerate}
      aiLoading={aiLoading}
      defaultOpen={defaultOpen}
    >
      <TagInput
        label={t.labels.skills}
        tags={skills}
        onChange={onUpdate}
        placeholder={t.actions.addSkill}
        readOnly={readOnly}
      />
    </Section>
  );
};

export const SkillsSection = memo(SkillsSectionComponent);
