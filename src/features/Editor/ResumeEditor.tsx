"use client";

import React, { useId, useState, useCallback } from "react";
import { useResumeEditorLogic } from "./useResumeEditorLogic";
import { useTranslations } from "@/hooks/useTranslations";
import { EDITOR_CONFIG } from "@/config/constants";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import type { Experience, Education, Certification, Publication, Volunteering, Language, Training, Reference } from "@/types";
import { AISectionGeneratorModal } from "@/components/ui/AISectionGeneratorModal";
import {
  SortableSection,
  PersonalInfoSection,
  SummarySection,
  ExperienceSection,
  EducationSection,
  SkillsSection,
  CertificationsSection,
  PublicationsSection,
  VolunteeringSection,
  LanguagesSection,
  OtherTrainingSection,
  ReferencesSection,
  AIPersonalInfoModal,
} from "./components";

export const ResumeEditor = () => {
  const {
    resumeData,
    updatePersonalInfo,
    updateSummary,
    handleSkillsChange,
    addItem,
    removeItem,
    updateItem,
    reorderItem,
    toggleBreakPage,
    generateSectionWithContext,
    setResumeData,
    sectionOrder,
    updateSectionOrder,
    refineContent,
  } = useResumeEditorLogic();

  // State for AI Section Generator Modal
  const [aiModalConfig, setAiModalConfig] = useState<{
    isOpen: boolean;
    sectionKey: string;
    sectionTitle: string;
    schema: Record<string, unknown>;
  } | null>(null);

  // State for Personal Info AI Modal
  const [isPersonalInfoAiModalOpen, setIsPersonalInfoAiModalOpen] = useState(false);

  const openAiModal = useCallback((sectionKey: string, sectionTitle: string, schema: Record<string, unknown>) => {
    setAiModalConfig({ isOpen: true, sectionKey, sectionTitle, schema });
  }, []);

  const closeAiModal = useCallback(() => {
    setAiModalConfig(null);
  }, []);

  const handlePersonalInfoAiApply = useCallback((data: typeof resumeData.personalInfo) => {
    setResumeData({
      ...resumeData,
      personalInfo: data,
    });
  }, [resumeData, setResumeData]);

  const handlePersonalInfoAiGenerate = useCallback(async (
    instruction: string,
    existingData: typeof resumeData.personalInfo
  ): Promise<typeof resumeData.personalInfo> => {
    const schema = {
      name: "string",
      title: "string",
      email: "string",
      phone: "string",
      address: "string",
      linkedin: "string",
      website: "string",
    };
    
    const items = await generateSectionWithContext<typeof resumeData.personalInfo>(
      `Current info: ${JSON.stringify(existingData)}. Instruction: ${instruction}`,
      "Personal Information",
      schema
    );
    
    return items[0] || existingData;
  }, [generateSectionWithContext]);

  const handleAiSectionGenerate = useCallback(async <T,>(
    briefInfo: string,
    sectionTitle: string,
    schema: Record<string, unknown>
  ): Promise<T[]> => {
    return generateSectionWithContext<T>(briefInfo, sectionTitle, schema);
  }, [generateSectionWithContext]);

  const handleAiSectionApply = useCallback(<T,>(items: T[], mode: 'replace' | 'amend') => {
    if (!aiModalConfig) return;
    const { sectionKey } = aiModalConfig;

    switch (sectionKey) {
      case 'experience':
        setResumeData({
          ...resumeData,
          experience: mode === 'replace' ? items as Experience[] : [...resumeData.experience, ...(items as Experience[])],
        });
        break;
      case 'education':
        setResumeData({
          ...resumeData,
          education: mode === 'replace' ? items as Education[] : [...resumeData.education, ...(items as Education[])],
        });
        break;
      case 'certifications':
        setResumeData({
          ...resumeData,
          certifications: mode === 'replace' ? items as Certification[] : [...(resumeData.certifications || []), ...(items as Certification[])],
        });
        break;
      case 'publications':
        setResumeData({
          ...resumeData,
          publications: mode === 'replace' ? items as Publication[] : [...(resumeData.publications || []), ...(items as Publication[])],
        });
        break;
      case 'volunteering':
        setResumeData({
          ...resumeData,
          volunteering: mode === 'replace' ? items as Volunteering[] : [...(resumeData.volunteering || []), ...(items as Volunteering[])],
        });
        break;
      case 'languages':
        setResumeData({
          ...resumeData,
          languages: mode === 'replace' ? items as Language[] : [...(resumeData.languages || []), ...(items as Language[])],
        });
        break;
      case 'otherTraining':
        setResumeData({
          ...resumeData,
          otherTraining: mode === 'replace' ? items as Training[] : [...(resumeData.otherTraining || []), ...(items as Training[])],
        });
        break;
      case 'references':
        setResumeData({
          ...resumeData,
          references: mode === 'replace' ? items as Reference[] : [...(resumeData.references || []), ...(items as Reference[])],
        });
        break;
      case 'skills':
        if (Array.isArray(items) && items.every(i => typeof i === 'string')) {
          setResumeData({
            ...resumeData,
            skills: mode === 'replace' ? items as string[] : [...new Set([...resumeData.skills, ...(items as string[])])],
          });
        }
        break;
      case 'personalInfo':
        if (items.length > 0 && typeof items[0] === 'object') {
          setResumeData({
            ...resumeData,
            personalInfo: items[0] as typeof resumeData.personalInfo,
          });
        }
        break;
    }
  }, [aiModalConfig, resumeData, setResumeData]);

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
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder?.indexOf(active.id as string) ?? -1;
      const newIndex = sectionOrder?.indexOf(over.id as string) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sectionOrder!, oldIndex, newIndex);
        updateSectionOrder(newOrder);
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonalInfo("photoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "summary":
        return (
          <SortableSection id="summary" key="summary">
            <SummarySection
              summary={resumeData.summary}
              onUpdate={updateSummary}
              onAiGenerate={refineContent}
            />
          </SortableSection>
        );

      case "experience":
        return (
          <SortableSection id="experience" key="experience">
            <ExperienceSection
              experience={resumeData.experience}
              onAdd={() =>
                addItem("experience", {
                  role: t("placeholders.newRole"),
                  company: t("placeholders.newCompany"),
                  dates: "",
                  description: "",
                })
              }
              onRemove={(idx: number) => removeItem("experience", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("experience", idx, field, value)
              }
              onToggleBreakPage={(idx: number) => toggleBreakPage("experience", idx)}
              onReorder={(from: number, to: number) => reorderItem("experience", from, to)}
              onAiGenerate={() =>
                openAiModal("experience", t("experience"), {
                  items: [
                    {
                      role: "string",
                      company: "string",
                      dates: "string",
                      location: "string",
                      description: "string (achievement-oriented bullet points)",
                    },
                  ],
                })
              }
              onAiGenerateDescription={refineContent}
              aiLoading={false}
            />
          </SortableSection>
        );

      case "education":
        return (
          <SortableSection id="education" key="education">
            <EducationSection
              education={resumeData.education}
              onAdd={() =>
                addItem("education", {
                  school: t("placeholders.newSchool"),
                  degree: "",
                  year: "",
                  description: "",
                })
              }
              onRemove={(idx: number) => removeItem("education", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("education", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("education", from, to)}
              onToggleBreakPage={(idx: number) => toggleBreakPage("education", idx)}
              onAiGenerate={() =>
                openAiModal("education", t("education"), {
                  items: [
                    {
                      school: "string",
                      degree: "string",
                      year: "string",
                      description: "string",
                    },
                  ],
                })
              }
              onAiGenerateDescription={refineContent}
              aiLoading={false}
            />
          </SortableSection>
        );

      case "skills":
        return (
          <SortableSection id="skills" key="skills">
            <SkillsSection
              skills={resumeData.skills}
              onUpdate={handleSkillsChange}
              onAiGenerate={() =>
                openAiModal("skills", t("skills"), {
                  items: ["string (skill name)"],
                })
              }
              aiLoading={false}
            />
          </SortableSection>
        );

      case "certifications":
        return (
          <SortableSection id="certifications" key="certifications">
            <CertificationsSection
              certifications={resumeData.certifications || []}
              onAdd={() =>
                addItem("certifications", {
                  name: "",
                  issuer: "",
                  expireDate: "",
                  year: "",
                })
              }
              onRemove={(idx: number) => removeItem("certifications", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("certifications", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("certifications", from, to)}
              onAiGenerate={() =>
                openAiModal("certifications", t("certifications"), {
                  items: [
                    {
                      name: "string",
                      issuer: "string",
                      expireDate: "string",
                      year: "string",
                    },
                  ],
                })
              }
              aiLoading={false}
            />
          </SortableSection>
        );

      case "publications":
        return (
          <SortableSection id="publications" key="publications">
            <PublicationsSection
              publications={resumeData.publications || []}
              onAdd={() =>
                addItem("publications", {
                  title: t("placeholders.newPublication"),
                  link: "",
                })
              }
              onRemove={(idx: number) => removeItem("publications", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("publications", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("publications", from, to)}
              onToggleBreakPage={(idx: number) => toggleBreakPage("publications", idx)}
              onAiGenerate={() =>
                openAiModal("publications", t("publications"), {
                  items: [
                    { title: "string", link: "string", date: "string" },
                  ],
                })
              }
              aiLoading={false}
            />
          </SortableSection>
        );

      case "volunteering":
        return (
          <SortableSection id="volunteering" key="volunteering">
            <VolunteeringSection
              volunteering={resumeData.volunteering || []}
              onAdd={() =>
                addItem("volunteering", {
                  role: "",
                  organization: "",
                  topic: "",
                })
              }
              onRemove={(idx: number) => removeItem("volunteering", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("volunteering", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("volunteering", from, to)}
              onAiGenerate={() =>
                openAiModal("volunteering", t("volunteering"), {
                  items: [
                    {
                      role: "string",
                      organization: "string",
                      topic: "string",
                    },
                  ],
                })
              }
              aiLoading={false}
            />
          </SortableSection>
        );

      case "languages":
        return (
          <SortableSection id="languages" key="languages">
            <LanguagesSection
              languages={resumeData.languages || []}
              onAdd={() => addItem("languages", { name: "", proficiency: "" })}
              onRemove={(idx: number) => removeItem("languages", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("languages", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("languages", from, to)}
              onAiGenerate={() =>
                openAiModal("languages", t("languages"), {
                  items: [{ name: "string", proficiency: "string" }],
                })
              }
              aiLoading={false}
            />
          </SortableSection>
        );

      case "otherTraining":
        return (
          <SortableSection id="otherTraining" key="otherTraining">
            <OtherTrainingSection
              otherTraining={resumeData.otherTraining || []}
              onAdd={() => addItem("otherTraining", { name: "" })}
              onRemove={(idx: number) => removeItem("otherTraining", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("otherTraining", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("otherTraining", from, to)}
              onAiGenerate={() =>
                openAiModal("otherTraining", t("otherTraining"), {
                  items: [{ name: "string" }],
                })
              }
              onAiGenerateContent={refineContent}
              aiLoading={false}
            />
          </SortableSection>
        );

      case "references":
        return (
          <SortableSection id="references" key="references">
            <ReferencesSection
              references={resumeData.references || []}
              onAdd={() =>
                addItem("references", {
                  name: "",
                  title: "",
                  company: "",
                  phone: "",
                  email: "",
                })
              }
              onRemove={(idx: number) => removeItem("references", idx)}
              onUpdate={(idx: number, field: string, value: string | string[]) =>
                updateItem("references", idx, field, value)
              }
              onReorder={(from: number, to: number) => reorderItem("references", from, to)}
              onAiGenerate={() =>
                openAiModal("references", t("references"), {
                  items: [
                    {
                      name: "string",
                      title: "string",
                      company: "string",
                      phone: "string",
                      email: "string",
                    },
                  ],
                })
              }
              aiLoading={false}
            />
          </SortableSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 pb-10">
      <PersonalInfoSection
        personalInfo={resumeData.personalInfo}
        onUpdateField={updatePersonalInfo}
        onPhotoChange={handlePhotoChange}
        onAiGenerate={() => setIsPersonalInfoAiModalOpen(true)}
        aiLoading={false}
      />

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={sectionOrder || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {(sectionOrder || []).map((sectionId) => renderSection(sectionId))}
          </div>
        </SortableContext>
      </DndContext>

      {/* AI Section Generator Modal */}
      {aiModalConfig && (
        <AISectionGeneratorModal
          isOpen={aiModalConfig.isOpen}
          onClose={closeAiModal}
          sectionTitle={aiModalConfig.sectionTitle}
          schema={aiModalConfig.schema}
          onApply={handleAiSectionApply}
          onGenerate={handleAiSectionGenerate}
        />
      )}

      {/* Personal Info AI Modal */}
      <AIPersonalInfoModal
        isOpen={isPersonalInfoAiModalOpen}
        onClose={() => setIsPersonalInfoAiModalOpen(false)}
        personalInfo={resumeData.personalInfo}
        onApply={handlePersonalInfoAiApply}
        onGenerate={handlePersonalInfoAiGenerate}
      />
    </div>
  );
};
