"use client";

import React, { useId } from "react";
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
    loadingStates,
    updatePersonalInfo,
    updateSummary,
    handleSkillsChange,
    addItem,
    removeItem,
    updateItem,
    toggleBreakPage,
    refineWithInstruction,
    generateItems,
    setResumeData,
    sectionOrder,
    updateSectionOrder,
    refineContent,
  } = useResumeEditorLogic();

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
              onRefineRole={(idx) =>
                refineWithInstruction(
                  `exp-role-${idx}`,
                  resumeData.experience[idx].role,
                  `Suggest a more senior-sounding job title for: ${resumeData.experience[idx].role}`,
                  (v) => {
                    const newList = [...resumeData.experience];
                    newList[idx] = { ...newList[idx], role: v };
                    setResumeData({ ...resumeData, experience: newList });
                  }
                )
              }
              onAiGenerate={() =>
                generateItems(
                  "exp-gen",
                  "Work Experience",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      experience: [...resumeData.experience, ...(items as typeof resumeData.experience)],
                    }),
                  {
                    items: [
                      {
                        role: "string",
                        company: "string",
                        dates: "string",
                        description: "string (HTML richtext with <ul><li> for bullet points)",
                      },
                    ],
                  }
                )
              }
              onAiGenerateDescription={refineContent}
              aiLoading={loadingStates["exp-gen"]}
              roleLoadingStates={loadingStates}
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
                generateItems(
                  "edu-gen",
                  "Education",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      education: [...resumeData.education, ...(items as typeof resumeData.education)],
                    }),
                  {
                    items: [
                      {
                        school: "string",
                        degree: "string",
                        year: "string",
                        description: "string",
                      },
                    ],
                  }
                )
              }
              onAiGenerateDescription={refineContent}
              aiLoading={loadingStates["edu-gen"]}
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
                refineWithInstruction(
                  "skills-gen",
                  resumeData.skills.join(", "),
                  "Based on this resume, suggest 5 more relevant technical skills for this candidate.",
                  (v) =>
                    setResumeData({
                      ...resumeData,
                      skills: [
                        ...new Set([
                          ...resumeData.skills,
                          ...v.split(",").map((s: string) => s.trim()),
                        ]),
                      ],
                    })
                )
              }
              aiLoading={loadingStates["skills-gen"]}
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
                generateItems(
                  "cert-gen",
                  "Professional Certifications",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      certifications: [
                        ...(resumeData.certifications || []),
                        ...(items as typeof resumeData.certifications),
                      ],
                    }),
                  {
                    items: [
                      {
                        name: "string",
                        issuer: "string",
                        expireDate: "string",
                        year: "string",
                      },
                    ],
                  }
                )
              }
              aiLoading={loadingStates["cert-gen"]}
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
                generateItems(
                  "pub-gen",
                  "Publications",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      publications: [
                        ...(resumeData.publications || []),
                        ...(items as typeof resumeData.publications),
                      ],
                    }),
                  {
                    items: [
                      { title: "string", link: "string", date: "string" },
                    ],
                  }
                )
              }
              aiLoading={loadingStates["pub-gen"]}
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
                generateItems(
                  "vol-gen",
                  "Volunteering",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      volunteering: [
                        ...(resumeData.volunteering || []),
                        ...(items as typeof resumeData.volunteering),
                      ],
                    }),
                  {
                    items: [
                      {
                        role: "string",
                        organization: "string",
                        topic: "string",
                      },
                    ],
                  }
                )
              }
              aiLoading={loadingStates["vol-gen"]}
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
                generateItems(
                  "lang-gen",
                  "Languages",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      languages: [...(resumeData.languages || []), ...(items as typeof resumeData.languages)],
                    }),
                  { items: [{ name: "string", proficiency: "string" }] }
                )
              }
              aiLoading={loadingStates["lang-gen"]}
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
                generateItems(
                  "train-gen",
                  "Other Training",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      otherTraining: [
                        ...(resumeData.otherTraining || []),
                        ...(items as typeof resumeData.otherTraining),
                      ],
                    }),
                  { items: [{ name: "string" }] }
                )
              }
              onAiGenerateContent={refineContent}
              aiLoading={loadingStates["train-gen"]}
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
                generateItems(
                  "ref-gen",
                  "References",
                  (items) =>
                    setResumeData({
                      ...resumeData,
                      references: [...(resumeData.references || []), ...(items as typeof resumeData.references)],
                    }),
                  {
                    items: [
                      {
                        name: "string",
                        title: "string",
                        company: "string",
                        phone: "string",
                        email: "string",
                      },
                    ],
                  }
                )
              }
              aiLoading={loadingStates["ref-gen"]}
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
          generateItems(
            "pi-gen",
            "Personal Information",
            (data) => setResumeData({ ...resumeData, personalInfo: data as typeof resumeData.personalInfo }),
            {
              name: "string",
              title: "string",
              email: "string",
              phone: "string",
              address: "string",
              linkedin: "string",
              website: "string",
            }
          )
        }
        aiLoading={loadingStates["pi-gen"]}
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
    </div>
  );
};
