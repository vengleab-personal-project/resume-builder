"use client";

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
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, Trash2, Award } from "lucide-react";
import { Section, Input } from "@/client/components/ui/FormElements";
import { SortableItem } from "./SortableItem";
import { useTranslations } from "@/client/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/shared/config/constants";
import type { Certification } from "@/shared/types";

type CertificationsSectionProps = {
  certifications: Certification[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAiGenerate: () => void;
  aiLoading: boolean;
};

const CertificationsSectionComponent = ({
  certifications,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onAiGenerate,
  aiLoading,
}: CertificationsSectionProps) => {
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
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = certifications.findIndex(c => (c.id || certifications.indexOf(c).toString()) === active.id);
      const newIndex = certifications.findIndex(c => (c.id || certifications.indexOf(c).toString()) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Section
      title={`${t.certifications} (${certifications.length})`}
      icon={
        <div className="bg-yellow-500 p-1.5 rounded-lg text-white">
          <Award size={16} />
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
          items={certifications.map((c, idx) => c.id || idx.toString())}
          strategy={verticalListSortingStrategy}
        >
          {certifications.map((cert, idx) => {
            const certObj =
              typeof cert === "string"
                ? { id: idx.toString(), name: cert, issuer: "", expireDate: "", year: "" }
                : cert;
            const itemId = certObj.id || idx.toString();
            
            return (
              <SortableItem key={itemId} id={itemId}>
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-all transform hover:scale-110"
                    title={t.actions.remove}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="pr-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Input
                      label={t.labels.certName}
                      value={certObj.name}
                      onChange={(e) => onUpdate(idx, "name", e.target.value)}
                    />
                    <Input
                      label={t.labels.certIssuer}
                      value={certObj.issuer || ""}
                      onChange={(e) => onUpdate(idx, "issuer", e.target.value)}
                    />
                    <Input
                      label={t.labels.certExpire}
                      value={certObj.expireDate || ""}
                      onChange={(e) => onUpdate(idx, "expireDate", e.target.value)}
                      placeholder="MM/DD/YYYY"
                    />
                    <Input
                      label={t.labels.certYear}
                      value={certObj.year || ""}
                      onChange={(e) => onUpdate(idx, "year", e.target.value)}
                      placeholder="YYYY"
                    />
                  </div>
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
        <Plus size={EDITOR_CONFIG.ICON_SIZE_LARGE} /> {t.actions.addCertification}
      </button>
    </Section>
  );
};

export const CertificationsSection = memo(CertificationsSectionComponent);
