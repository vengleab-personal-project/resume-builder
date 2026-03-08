"use client";

import React, { memo } from "react";
import { FileText } from "lucide-react";
import { Section, RichTextEditor } from "@/client/components/ui/FormElements";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";

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
    <Section
      title={t.summary}
      icon={
        <div className="bg-amber-500 p-1.5 rounded-lg text-white">
          <FileText size={16} />
        </div>
      }
    >
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
