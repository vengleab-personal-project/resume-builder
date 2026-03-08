import React, { useId, memo } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, Trash2, Scissors } from "lucide-react";
import { Section, Input, RichTextEditor } from "@/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Experience } from "@/types";

type ExperienceSectionProps = {
  experience: Experience[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleBreakPage: (index: number) => void;
  onAiGenerate: () => void;
  onAiGenerateDescription: (
    instruction: string,
    existingData: string,
  ) => Promise<string>;
  aiLoading: boolean;
};

const ExperienceSectionComponent = ({
  experience,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onToggleBreakPage,
  onAiGenerate,
  onAiGenerateDescription,
  aiLoading,
}: ExperienceSectionProps) => {
  const { t } = useTranslations("editor");
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = experience.findIndex(exp => (exp.id || experience.indexOf(exp).toString()) === active.id);
      const newIndex = experience.findIndex(exp => (exp.id || experience.indexOf(exp).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.experience} (${experience.length})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext 
          items={experience.map((exp, idx) => exp.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {experience.map((exp, idx) => {
            const itemId = exp.id || idx.toString();
            return (
              <SortableItem key={itemId} id={itemId}>
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    onClick={() => onToggleBreakPage(idx)}
                    className={cn(
                      "p-1.5 rounded-full transition-all shadow-sm border transform hover:scale-110",
                      exp.breakPage
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-400 hover:text-indigo-600 border-slate-200",
                    )}
                    title={
                      exp.breakPage
                        ? t.actions.removePageBreak
                        : t.actions.addPageBreak
                    }
                  >
                    <Scissors size={14} />
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
                    title={t.actions.remove}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="pr-16">
                  <Input
                    label={t.labels.role}
                    value={exp.role}
                    onChange={(e) => onUpdate(idx, "role", e.target.value)}
                    placeholder={t.placeholders.newRole}
                  />
                  <Input
                    label={t.labels.company}
                    value={exp.company}
                    onChange={(e) => onUpdate(idx, "company", e.target.value)}
                    placeholder={t.placeholders.newCompany}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t.labels.dates}
                      value={exp.dates}
                      onChange={(e) => onUpdate(idx, "dates", e.target.value)}
                      placeholder="e.g. Jan 2022 - Present"
                    />
                    <Input
                      label={t.labels.location}
                      value={exp.location || ""}
                      onChange={(e) => onUpdate(idx, "location", e.target.value)}
                      placeholder="e.g. London, UK"
                    />
                  </div>
                  <RichTextEditor
                    label={t.labels.achievements}
                    value={exp.description || ""}
                    onChange={(v: string) => onUpdate(idx, "description", v)}
                    placeholder={t.placeholders.bullets}
                    onAiGenerate={onAiGenerateDescription}
                    minHeight={EDITOR_CONFIG.MIN_HEIGHT_BULLETS}
                  />
                </div>
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} />{" "}
        {t.actions.addExperience}
      </button>
    </Section>
  );
};

export const ExperienceSection = memo(ExperienceSectionComponent);
