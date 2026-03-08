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
import { Plus, Trash2, Scissors, GraduationCap } from "lucide-react";
import { Section, Input, RichTextEditor } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { cn } from "@/shared/lib/utils";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Education } from "@/shared/types";

type EducationSectionProps = {
  education: Education[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onToggleBreakPage: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  onAiGenerateDescription: (instruction: string, existingData: string) => Promise<string>;
  aiLoading: boolean;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const EducationSectionComponent = ({
  education,
  onAdd,
  onRemove,
  onUpdate,
  onToggleBreakPage,
  onReorder,
  onAiGenerate,
  onAiGenerateDescription,
  aiLoading,
  readOnly = false,
  defaultOpen = false,
}: EducationSectionProps) => {
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
      const oldIndex = education.findIndex(edu => (edu.id || education.indexOf(edu).toString()) === active.id);
      const newIndex = education.findIndex(edu => (edu.id || education.indexOf(edu).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.education} (${education.length})`}
      icon={
        <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
          <GraduationCap size={16} />
        </div>
      }
      onAiClick={readOnly ? undefined : onAiGenerate}
      aiLoading={aiLoading}
      defaultOpen={defaultOpen}
    >
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext 
          items={education.map((edu, idx) => edu.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {education.map((edu, idx) => {
            const itemId = edu.id || idx.toString();
            return (
              <SortableItem key={itemId} id={itemId} disabled={readOnly}>
                {!readOnly && (
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button
                      onClick={() => onToggleBreakPage(idx)}
                      className={cn(
                        "p-1.5 rounded-full transition-all shadow-sm border transform hover:scale-110",
                        edu.breakPage
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-400 hover:text-indigo-600 border-slate-200"
                      )}
                      title={
                        edu.breakPage
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
                )}
                <div className={cn(readOnly ? "pr-0" : "pr-16")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Input
                      label={t.labels.school}
                      value={edu.school}
                      onChange={(e) => onUpdate(idx, "school", e.target.value)}
                      placeholder={t.placeholders.newSchool}
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.degree}
                      value={edu.degree}
                      onChange={(e) => onUpdate(idx, "degree", e.target.value)}
                      placeholder="e.g. Bachelor of Science"
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.year}
                      value={edu.year}
                      onChange={(e) => onUpdate(idx, "year", e.target.value)}
                      placeholder="e.g. 2018 - 2022"
                      readOnly={readOnly}
                    />
                  </div>
                  <RichTextEditor
                    label={t.labels.description}
                    value={edu.description || ""}
                    onChange={(v: string) => onUpdate(idx, "description", v)}
                    placeholder="e.g., 3.8/4.0, First Class Honours, Summa Cum Laude"
                    onAiGenerate={readOnly ? undefined : onAiGenerateDescription}
                    minHeight={EDITOR_CONFIG.MIN_HEIGHT_DESCRIPTION}
                    readOnly={readOnly}
                  />
                </div>
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
      {!readOnly && (
        <button
          onClick={onAdd}
          className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t.actions.addEducation}
        </button>
      )}
    </Section>
  );
};

export const EducationSection = memo(EducationSectionComponent);
