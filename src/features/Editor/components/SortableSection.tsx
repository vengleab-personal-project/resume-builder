"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { EDITOR_CONFIG } from '@/config/constants';

interface SortableSectionProps {
  id: string;
  children: React.ReactNode;
}

export const SortableSection: React.FC<SortableSectionProps> = ({ id, children }) => {
  const { t } = useTranslations('editor');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-4 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
        title={t('drag.reorder')}
      >
        <GripVertical size={EDITOR_CONFIG.ICON_SIZE_XL} />
      </div>
      {children}
    </div>
  );
};
