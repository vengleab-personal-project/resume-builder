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
import { Plus, Trash2, Users } from "lucide-react";
import { Section, Input } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Reference } from "@/shared/types";

type ReferencesSectionProps = {
  references: Reference[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const ReferencesSectionComponent = ({
  references,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onAiGenerate,
  aiLoading,
  readOnly = false,
  defaultOpen = false,
}: ReferencesSectionProps) => {
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
      const oldIndex = references.findIndex(ref => (ref.id || references.indexOf(ref).toString()) === active.id);
      const newIndex = references.findIndex(ref => (ref.id || references.indexOf(ref).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.references} (${references.length})`}
      icon={
        <div className="bg-teal-500 p-1.5 rounded-lg text-white">
          <Users size={16} />
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
          items={references.map((ref, idx) => ref.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {references.map((ref, idx) => {
            const itemId = ref.id || idx.toString();
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Input
                      label={t.labels.refName}
                      value={ref.name}
                      onChange={(e) => onUpdate(idx, "name", e.target.value)}
                      placeholder="e.g. John Doe"
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.refTitle}
                      value={ref.title || ""}
                      onChange={(e) => onUpdate(idx, "title", e.target.value)}
                      placeholder="e.g. Senior Manager"
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.refCompany}
                      value={ref.company || ""}
                      onChange={(e) => onUpdate(idx, "company", e.target.value)}
                      placeholder="e.g. Acme Corp"
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.refPhone}
                      value={ref.phone || ""}
                      onChange={(e) => onUpdate(idx, "phone", e.target.value)}
                      placeholder="+1 234 567 890"
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.refEmail}
                      value={ref.email || ""}
                      onChange={(e) => onUpdate(idx, "email", e.target.value)}
                      placeholder="john.doe@example.com"
                      readOnly={readOnly}
                    />
                  </div>
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
          <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t.actions.addReference}
        </button>
      )}
    </Section>
  );
};

export const ReferencesSection = memo(ReferencesSectionComponent);
