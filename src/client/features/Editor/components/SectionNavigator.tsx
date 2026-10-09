"use client";

import React, { useState } from 'react';
import {
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Plus,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  HeartHandshake,
  Languages,
  BookCheck,
  Users,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from '@/client/hooks/useTranslations';
import type { ResumeData } from '@/shared/types';

interface SectionNavigatorProps {
  sectionOrder: string[];
  onReorder: (newOrder: string[]) => void;
  resumeData: ResumeData;
  activeSectionId?: string;
  onNavigateSection: (sectionId: string) => void;
  onAddSection?: (sectionId: string) => void;
  className?: string;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  personalInfo: User,
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Sparkles,
  certifications: Award,
  publications: BookOpen,
  volunteering: HeartHandshake,
  languages: Languages,
  otherTraining: BookCheck,
  references: Users,
};

const ALL_POSSIBLE_SECTIONS = [
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'publications',
  'volunteering',
  'languages',
  'otherTraining',
  'references',
];

interface SortableSectionItemProps {
  id: string;
  label: string;
  count?: number;
  isComplete: boolean;
  isActive: boolean;
  onClick: () => void;
}

function SortableSectionItem({
  id,
  label,
  count,
  isComplete,
  isActive,
  onClick,
}: SortableSectionItemProps) {
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
    zIndex: isDragging ? 50 : undefined,
  };

  const Icon = SECTION_ICONS[id] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all ${
        isActive
          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-sm'
          : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      } ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-0.5"
          title="Drag to reorder"
        >
          <GripVertical size={13} />
        </button>

        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 flex-1 text-left truncate"
        >
          <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="truncate">{label}</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {count !== undefined && count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            {count}
          </span>
        )}
        {isComplete ? (
          <CheckCircle2 size={13} className="text-emerald-500" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        )}
      </div>
    </div>
  );
}

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sectionOrder,
  onReorder,
  resumeData,
  activeSectionId,
  onNavigateSection,
  onAddSection,
  className = '',
}) => {
  const { t: tEditor } = useTranslations('editor');
  const { t: tNav } = useTranslations('sectionNav');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as string);
      const newIndex = sectionOrder.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(sectionOrder, oldIndex, newIndex));
      }
    }
  };

  const getSectionMetadata = (id: string) => {
    switch (id) {
      case 'personalInfo':
        return {
          label: tEditor.personalInfo,
          isComplete: Boolean(resumeData.personalInfo?.name && resumeData.personalInfo.name !== 'Your Name'),
        };
      case 'summary':
        return {
          label: tEditor.summary,
          isComplete: Boolean(resumeData.summary && resumeData.summary.trim().length > 0),
        };
      case 'experience':
        return {
          label: tEditor.experience,
          count: resumeData.experience?.length || 0,
          isComplete: (resumeData.experience?.length || 0) > 0,
        };
      case 'education':
        return {
          label: tEditor.education,
          count: resumeData.education?.length || 0,
          isComplete: (resumeData.education?.length || 0) > 0,
        };
      case 'skills':
        return {
          label: tEditor.skills,
          count: resumeData.skills?.length || 0,
          isComplete: (resumeData.skills?.length || 0) > 0,
        };
      case 'certifications':
        return {
          label: tEditor.certifications,
          count: resumeData.certifications?.length || 0,
          isComplete: (resumeData.certifications?.length || 0) > 0,
        };
      case 'publications':
        return {
          label: tEditor.publications,
          count: resumeData.publications?.length || 0,
          isComplete: (resumeData.publications?.length || 0) > 0,
        };
      case 'volunteering':
        return {
          label: tEditor.volunteering,
          count: resumeData.volunteering?.length || 0,
          isComplete: (resumeData.volunteering?.length || 0) > 0,
        };
      case 'languages':
        return {
          label: tEditor.languages,
          count: resumeData.languages?.length || 0,
          isComplete: (resumeData.languages?.length || 0) > 0,
        };
      case 'otherTraining':
        return {
          label: tEditor.otherTraining,
          count: resumeData.otherTraining?.length || 0,
          isComplete: (resumeData.otherTraining?.length || 0) > 0,
        };
      case 'references':
        return {
          label: tEditor.references,
          count: resumeData.references?.length || 0,
          isComplete: (resumeData.references?.length || 0) > 0,
        };
      default:
        return { label: id, isComplete: false };
    }
  };

  const unusedSections = ALL_POSSIBLE_SECTIONS.filter(
    (id) => !sectionOrder.includes(id)
  );

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Header & Add Section Dropdown */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {tNav.title}
        </span>
        
        {unusedSections.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Plus size={13} />
              <span>{tNav.addSection}</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                {unusedSections.map((secId) => {
                  const meta = getSectionMetadata(secId);
                  const Icon = SECTION_ICONS[secId] || FileText;
                  return (
                    <button
                      key={secId}
                      type="button"
                      onClick={() => {
                        onAddSection?.(secId);
                        setShowAddMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 text-left"
                    >
                      <Icon size={13} />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personal Info Fixed Item */}
      <button
        type="button"
        onClick={() => onNavigateSection('personalInfo')}
        className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all ${
          activeSectionId === 'personalInfo'
            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-sm'
            : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <User size={14} className={activeSectionId === 'personalInfo' ? 'text-indigo-600' : 'text-slate-400'} />
          <span className="truncate">{tEditor.personalInfo}</span>
        </div>
        {getSectionMetadata('personalInfo').isComplete ? (
          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
        ) : (
          <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
        )}
      </button>

      {/* Sortable Context for Remaining Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {sectionOrder.map((sectionId) => {
              const meta = getSectionMetadata(sectionId);
              return (
                <SortableSectionItem
                  key={sectionId}
                  id={sectionId}
                  label={meta.label}
                  count={meta.count}
                  isComplete={meta.isComplete}
                  isActive={activeSectionId === sectionId}
                  onClick={() => onNavigateSection(sectionId)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  );
};
