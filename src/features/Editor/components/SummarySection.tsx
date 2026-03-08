"use client";

import React, { memo } from "react";
import { Section, RichTextEditor } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/config/constants";

type SummarySectionProps = {
  summary: string;
  onUpdate: (value: string) => void;
  onAiGenerate: (instruction: string, existingData: string) => Promise<string>;
};

const SummarySectionComponent = ({
  summary,
  onUpdate,
  onAiGenerate,
}: SummarySectionProps) => {
  const { t } = useTranslations("editor");

  return (
    <Section title={t.summary}>
      <RichTextEditor
        label={t.labels.summary}
        value={summary}
        onChange={onUpdate}
        onAiGenerate={onAiGenerate}
        minHeight={EDITOR_CONFIG.MIN_HEIGHT_SUMMARY}
      />
    </Section>
  );
};

export const SummarySection = memo(SummarySectionComponent);
