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
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { Section, RichTextEditor } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Training } from "@/shared/types";

type OtherTrainingSectionProps = {
  otherTraining: Training[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  onAiGenerateContent: (instruction: string, existingData: string) => Promise<string>;
  aiLoading: boolean;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const OtherTrainingSectionComponent = ({
  otherTraining,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onAiGenerate,
  onAiGenerateContent,
  aiLoading,
  readOnly = false,
  defaultOpen = false,
}: OtherTrainingSectionProps) => {
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
      const oldIndex = otherTraining.findIndex(t => (t.id || otherTraining.indexOf(t).toString()) === active.id);
      const newIndex = otherTraining.findIndex(t => (t.id || otherTraining.indexOf(t).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.otherTraining} (${otherTraining.length})`}
      icon={
        <div className="bg-orange-500 p-1.5 rounded-lg text-white">
          <ClipboardList size={16} />
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
          items={otherTraining.map((training, idx) => training.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {otherTraining.map((training, idx) => {
            const itemId = training.id || idx.toString();
            return (
              <SortableItem key={itemId} id={itemId} disabled={readOnly}>
                {!readOnly && (
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button
                      onClick={() => onRemove(idx)}
                      className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
                      title={t.actions.remove}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <div className={readOnly ? "pr-0" : "pr-10"}>
                  <RichTextEditor
                    label={t.labels.trainingName}
                    value={training.name || ""}
                    onChange={(v: string) => onUpdate(idx, "name", v)}
                    onAiGenerate={readOnly ? undefined : onAiGenerateContent}
                    minHeight={EDITOR_CONFIG.MIN_HEIGHT_TRAINING}
                    placeholder="e.g. AWS Certified Solutions Architect"
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
          <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t.actions.addTraining}
        </button>
      )}
    </Section>
  );
};

export const OtherTrainingSection = memo(OtherTrainingSectionComponent);
