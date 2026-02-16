"use client";

import React, { memo, useId } from "react";
import { Plus, Trash2, Scissors, GripVertical } from "lucide-react";
import { Section, Input, RichTextEditor } from "@/components/ui/FormElements";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { EDITOR_CONFIG } from "@/config/constants";
import type { Experience } from "@/types";
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
  useSortable,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

type ExperienceSectionProps = {
  experience: Experience[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onToggleBreakPage: (index: number) => void;
  onAiGenerate: () => void;
  onAiGenerateDescription: (
    instruction: string,
    existingData: string,
  ) => Promise<string>;
  aiLoading: boolean;
};

type SortableExperienceItemProps = {
  exp: Experience;
  idx: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | string[]) => void;
  onToggleBreakPage: (index: number) => void;
  onAiGenerateDescription: (
    instruction: string,
    existingData: string,
  ) => Promise<string>;
  t: (key: any) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
};

const SortableExperienceItem = ({
  exp,
  idx,
  onRemove,
  onUpdate,
  onToggleBreakPage,
  onAiGenerateDescription,
  t,
}: SortableExperienceItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `exp-${idx}` });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-6 p-4 border border-slate-100 rounded-lg bg-slate-50/30 relative group"
    >
      <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110 cursor-grab active:cursor-grabbing"
          title={t("actions.dragToReorder")}
        >
          <GripVertical size={14} />
        </button>
      </div>
      <div className="absolute -top-2 -right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
              ? t("actions.removePageBreak")
              : t("actions.addPageBreak")
          }
        >
          <Scissors size={14} />
        </button>
        <button
          onClick={() => onRemove(idx)}
          className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
          title={t("actions.remove")}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <Input
        label={t("labels.role")}
        value={exp.role}
        onChange={(e) => onUpdate(idx, "role", e.target.value)}
      />
      <Input
        label={t("labels.company")}
        value={exp.company}
        onChange={(e) => onUpdate(idx, "company", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("labels.dates")}
          value={exp.dates}
          onChange={(e) => onUpdate(idx, "dates", e.target.value)}
        />
        <Input
          label={t("labels.location")}
          value={exp.location}
          onChange={(e) => onUpdate(idx, "location", e.target.value)}
        />
      </div>
      <RichTextEditor
        label={t("labels.achievements")}
        value={exp.description || ""}
        onChange={(v: string) => onUpdate(idx, "description", v)}
        placeholder={t("placeholders.bullets")}
        onAiGenerate={onAiGenerateDescription}
        minHeight={EDITOR_CONFIG.MIN_HEIGHT_BULLETS}
      />
    </div>
  );
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
        distance: EDITOR_CONFIG.DRAG_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = parseInt(active.id.toString().replace("exp-", ""));
      const newIndex = parseInt(over.id.toString().replace("exp-", ""));
      onReorder(oldIndex, newIndex);
    }
  };

  const items = Array.isArray(experience)
    ? experience.map((_, idx) => `exp-${idx}`)
    : [];

  return (
    <Section
      title={`${t("experience")} (${Array.isArray(experience) ? experience.length : 0})`}
      onAiClick={onAiGenerate}
      aiLoading={aiLoading}
    >
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {Array.isArray(experience) &&
            experience.map((exp, idx) => (
              <SortableExperienceItem
                key={idx}
                exp={exp}
                idx={idx}
                onRemove={onRemove}
                onUpdate={onUpdate}
                onToggleBreakPage={onToggleBreakPage}
                onAiGenerateDescription={onAiGenerateDescription}
                t={t}
              />
            ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} />{" "}
        {t("actions.addExperience")}
      </button>
    </Section>
  );
};

export const ExperienceSection = memo(ExperienceSectionComponent);
