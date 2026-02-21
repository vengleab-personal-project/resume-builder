"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EDITOR_CONFIG } from '@/config/constants';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group mb-4 last:mb-0", className, isDragging && "opacity-50 ring-2 ring-indigo-500 ring-offset-2")}
    >
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200">
        {children}
        
        {/* Drag handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
};
