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

  const openAiModal = useCallback((sectionKey: string, sectionTitle: string, schema: Record<string, unknown>) => {
    setAiModalConfig({ isOpen: true, sectionKey, sectionTitle, schema });
  }, []);

  const closeAiModal = useCallback(() => {
    setAiModalConfig(null);
  }, []);

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
              onRemove={(idx) => removeItem("experience", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("experience", idx, field, value)
              }
              onToggleBreakPage={(idx) => toggleBreakPage("experience", idx)}
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
              onRemove={(idx) => removeItem("education", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("education", idx, field, value)
              }
              onToggleBreakPage={(idx) => toggleBreakPage("education", idx)}
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
              onRemove={(idx) => removeItem("certifications", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("certifications", idx, field, value)
              }
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
              onRemove={(idx) => removeItem("publications", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("publications", idx, field, value)
              }
              onToggleBreakPage={(idx) => toggleBreakPage("publications", idx)}
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
              onRemove={(idx) => removeItem("volunteering", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("volunteering", idx, field, value)
              }
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
              onRemove={(idx) => removeItem("languages", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("languages", idx, field, value)
              }
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
              onRemove={(idx) => removeItem("otherTraining", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("otherTraining", idx, field, value)
              }
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
              onRemove={(idx) => removeItem("references", idx)}
              onUpdate={(idx, field, value) =>
                updateItem("references", idx, field, value)
              }
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
        onAiGenerate={() =>
          openAiModal("personalInfo", t("personalInfo"), {
            name: "string",
            title: "string",
            email: "string",
            phone: "string",
            address: "string",
            linkedin: "string",
            website: "string",
          })
        }
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
    </div>
  );
};
