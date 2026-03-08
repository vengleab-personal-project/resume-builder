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
import { Plus, Trash2, Scissors, BookOpen } from "lucide-react";
import { Section, Input } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { cn } from "@/shared/lib/utils";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Publication } from "@/shared/types";

type PublicationsSectionProps = {
  publications: Publication[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onToggleBreakPage: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

const PublicationsSectionComponent = ({
  publications,
  onAdd,
  onRemove,
  onUpdate,
  onToggleBreakPage,
  onReorder,
  onAiGenerate,
  aiLoading,
  readOnly = false,
  defaultOpen = false,
}: PublicationsSectionProps) => {
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
      const oldIndex = publications.findIndex(pub => (pub.id || publications.indexOf(pub).toString()) === active.id);
      const newIndex = publications.findIndex(pub => (pub.id || publications.indexOf(pub).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.publications} (${publications.length})`}
      icon={
        <div className="bg-rose-500 p-1.5 rounded-lg text-white">
          <BookOpen size={16} />
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
          items={publications.map((pub, idx) => pub.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {publications.map((pub, idx) => {
            const itemId = pub.id || idx.toString();
            return (
              <SortableItem key={itemId} id={itemId} disabled={readOnly}>
                {!readOnly && (
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button
                      onClick={() => onToggleBreakPage(idx)}
                      className={cn(
                        "p-1.5 rounded-full transition-all shadow-sm border transform hover:scale-110",
                        pub.breakPage
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-400 hover:text-indigo-600 border-slate-200"
                      )}
                      title={
                        pub.breakPage
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
                      label={t.labels.title}
                      value={pub.title}
                      onChange={(e) => onUpdate(idx, "title", e.target.value)}
                      placeholder="e.g. Impact of AI on Modern Medicine"
                      readOnly={readOnly}
                    />
                    <Input
                      label={t.labels.link}
                      value={pub.link || ""}
                      onChange={(e) => onUpdate(idx, "link", e.target.value)}
                      placeholder="e.g. https://doi.org/..."
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
          {t.actions.addPublication}
        </button>
      )}
    </Section>
  );
};

export const PublicationsSection = memo(PublicationsSectionComponent);
