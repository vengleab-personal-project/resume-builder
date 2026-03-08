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
import { Plus, Trash2, Languages } from "lucide-react";
import { Section, Input } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Language } from "@/shared/types";

type LanguagesSectionProps = {
  languages: Language[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

const LanguagesSectionComponent = ({
  languages,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onAiGenerate,
  aiLoading,
}: LanguagesSectionProps) => {
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
      const oldIndex = languages.findIndex(lang => (lang.id || languages.indexOf(lang).toString()) === active.id);
      const newIndex = languages.findIndex(lang => (lang.id || languages.indexOf(lang).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.languages} (${languages.length})`}
      icon={
        <div className="bg-cyan-500 p-1.5 rounded-lg text-white">
          <Languages size={16} />
        </div>
      }
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
          items={languages.map((lang, idx) => lang.id || idx.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {languages.map((lang, idx) => {
            const itemId = lang.id || idx.toString();
            return (
              <SortableItem key={itemId} id={itemId}>
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
                    title={t.actions.remove}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 pr-8">
                  <Input
                    label={t.labels.langName}
                    value={lang.name}
                    onChange={(e) => onUpdate(idx, "name", e.target.value)}
                    placeholder="e.g. English"
                  />
                  <Input
                    label={t.labels.langProficiency}
                    value={lang.proficiency}
                    onChange={(e) => onUpdate(idx, "proficiency", e.target.value)}
                    placeholder="e.g. Native"
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
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t.actions.addLanguage}
      </button>
    </Section>
  );
};

export const LanguagesSection = memo(LanguagesSectionComponent);
