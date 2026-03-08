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
import { Plus, Trash2, Heart } from "lucide-react";
import { Section, Input } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Volunteering } from "@/shared/types";

type VolunteeringSectionProps = {
  volunteering: Volunteering[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const VolunteeringSectionComponent = ({
  volunteering,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onAiGenerate,
  aiLoading,
  readOnly = false,
  defaultOpen = false,
}: VolunteeringSectionProps) => {
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
      const oldIndex = volunteering.findIndex(vol => (vol.id || volunteering.indexOf(vol).toString()) === active.id);
      const newIndex = volunteering.findIndex(vol => (vol.id || volunteering.indexOf(vol).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.volunteering} (${volunteering.length})`}
      icon={
        <div className="bg-pink-500 p-1.5 rounded-lg text-white">
          <Heart size={16} />
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
          items={volunteering.map((vol, idx) => vol.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {volunteering.map((vol, idx) => {
            const itemId = vol.id || idx.toString();
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
                      label={t.labels.volRole}
                      value={vol.role}
                      onChange={(e) => onUpdate(idx, "role", e.target.value)}
                      placeholder={t.placeholders.newRole}
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.volOrganization}
                      value={vol.organization || ""}
                      onChange={(e) => onUpdate(idx, "organization", e.target.value)}
                      placeholder={t.placeholders.newCompany}
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.volTopic}
                      value={vol.topic || ""}
                      onChange={(e) => onUpdate(idx, "topic", e.target.value)}
                      placeholder="e.g. Community Outreach"
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
          <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} />{" "}
          {t.actions.addVolunteering}
        </button>
      )}
    </Section>
  );
};

export const VolunteeringSection = memo(VolunteeringSectionComponent);
