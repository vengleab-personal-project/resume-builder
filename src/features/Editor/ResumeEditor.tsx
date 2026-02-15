"use client";

import React from 'react';
import { Plus, Trash2, Scissors } from 'lucide-react';
import { Section, Input, TextArea } from '@/components/ui/FormElements';
import { AIButton } from '@/components/ui/AIButton';
import { useResumeEditorLogic } from './useResumeEditorLogic';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';
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
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { SortableSection } from './components/SortableSection';

export const ResumeEditor: React.FC = () => {
  const {
    resumeData,
    loadingStates,
    skillsText,
    updatePersonalInfo,
    addItem,
    removeItem,
    updateItem,
    updateSummary,
    updateSkills,
    handleSkillsChange,
    refineWithInstruction,
    generateItems,
    setResumeData,
    toggleBreakPage,
    updateSectionOrder,
  } = useResumeEditorLogic();

  const { t } = useTranslations('editor');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = resumeData.sectionOrder?.indexOf(active.id as string) ?? -1;
      const newIndex = resumeData.sectionOrder?.indexOf(over.id as string) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(resumeData.sectionOrder!, oldIndex, newIndex);
        updateSectionOrder(newOrder);
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonalInfo('photoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return (
          <SortableSection id="summary" key="summary">
            <Section 
              title={t('summary')} 
              onAiClick={() => refineWithInstruction('summary', resumeData.summary, "Write a professional 2-3 sentence resume summary for a candidate with these skills: " + resumeData.skills.join(', '), (v) => updateSummary(v))}
              aiLoading={loadingStates['summary']}
            >
               <TextArea 
                  label={t('labels.summary')} 
                  value={resumeData.summary} 
                  onChange={(e) => updateSummary(e.target.value)}
                  onAiClick={() => refineWithInstruction('summary-refine', resumeData.summary, "Make this summary more impactful and professional", (v) => updateSummary(v))}
                  aiLoading={loadingStates['summary-refine']}
               />
            </Section>
          </SortableSection>
        );

      case 'experience':
        return (
          <SortableSection id="experience" key="experience">
            <Section 
              title={`${t('experience')} (${resumeData.experience.length})`}
              onAiClick={() => generateItems('exp-gen', 'Work Experience', (items) => setResumeData({...resumeData, experience: [...resumeData.experience, ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ role: "string", company: "string", dates: "string", bullets: ["string"] }] })}
              aiLoading={loadingStates['exp-gen']}
            >
              {resumeData.experience.map((exp: any, idx: number) => (
                <div key={idx} className="mb-6 p-4 border border-slate-100 rounded-lg bg-slate-50/30 relative group">
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => toggleBreakPage('experience', idx)}
                      className={cn(
                        "p-1.5 rounded-md transition-all shadow-sm border",
                        exp.breakPage 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-slate-300 hover:text-indigo-600 border-slate-100"
                      )}
                      title={exp.breakPage ? t('actions.removePageBreak') : t('actions.addPageBreak')}
                    >
                      <Scissors size={14} />
                    </button>
                    <button 
                      onClick={() => removeItem('experience', idx)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-md transition-all shadow-sm border border-slate-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input 
                    label={t('labels.role')} 
                    value={exp.role} 
                    onChange={(e) => updateItem('experience', idx, 'role', e.target.value)} 
                    onAiClick={() => refineWithInstruction(`exp-role-${idx}`, exp.role, "Suggest a more senior-sounding job title for: " + exp.role, (v) => updateItem('experience', idx, 'role', v))}
                    aiLoading={loadingStates[`exp-role-${idx}`]}
                  />
                  <Input label={t('labels.company')} value={exp.company} onChange={(e) => updateItem('experience', idx, 'company', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('labels.dates')} value={exp.dates} onChange={(e) => updateItem('experience', idx, 'dates', e.target.value)} />
                    <Input label={t('labels.location')} value={exp.location} onChange={(e) => updateItem('experience', idx, 'location', e.target.value)} />
                  </div>
                  <TextArea 
                    label={t('labels.achievements')} 
                    value={(exp.bullets || []).join('\n')} 
                    onChange={(e) => updateItem('experience', idx, 'bullets', e.target.value.split('\n'))} 
                    placeholder={t('placeholders.bullets')}
                    onAiClick={() => refineWithInstruction(`exp-bullets-${idx}`, (exp.bullets || []).join('\n'), "Turn these into strong, achievement-oriented bullet points starting with action verbs", (v) => updateItem('experience', idx, 'bullets', v.split('\n')))}
                    aiLoading={loadingStates[`exp-bullets-${idx}`]}
                  />
                </div>
              ))}
              <button 
                onClick={() => addItem('experience', { role: t('placeholders.newRole'), company: t('placeholders.newCompany'), dates: '', bullets: [] })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addExperience')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'education':
        return (
          <SortableSection id="education" key="education">
            <Section 
              title={`${t('education')} (${resumeData.education.length})`}
              onAiClick={() => generateItems('edu-gen', 'Education', (items) => setResumeData({...resumeData, education: [...resumeData.education, ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ school: "string", degree: "string", year: "string", gpa: "string" }] })}
              aiLoading={loadingStates['edu-gen']}
            >
               {resumeData.education.map((edu: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
                   <div className="absolute top-0 right-0 flex gap-2">
                     <button 
                      onClick={() => toggleBreakPage('education', idx)}
                      className={cn(
                        "p-1 text-xs transition-colors",
                        edu.breakPage ? "text-indigo-600" : "text-slate-300 hover:text-indigo-600"
                      )}
                      title={edu.breakPage ? t('actions.removePageBreak') : t('actions.addPageBreak')}
                    >
                      <Scissors size={12} />
                    </button>
                    <button 
                      onClick={() => removeItem('education', idx)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input label={t('labels.school')} value={edu.school} onChange={(e) => updateItem('education', idx, 'school', e.target.value)} />
                  <Input label={t('labels.degree')} value={edu.degree} onChange={(e) => updateItem('education', idx, 'degree', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('labels.year')} value={edu.year} onChange={(e) => updateItem('education', idx, 'year', e.target.value)} />
                    <Input label={t('labels.gpa')} value={edu.gpa || ''} onChange={(e) => updateItem('education', idx, 'gpa', e.target.value)} />
                  </div>
                </div>
              ))}
               <button 
                onClick={() => addItem('education', { school: t('placeholders.newSchool'), degree: '', year: '', gpa: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addEducation')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'skills':
        return (
          <SortableSection id="skills" key="skills">
            <Section 
              title={t('skills')}
              onAiClick={() => refineWithInstruction('skills-gen', resumeData.skills.join(', '), "Based on this resume, suggest 5 more relevant technical skills for this candidate.", (v) => setResumeData({...resumeData, skills: [...new Set([...resumeData.skills, ...v.split(',').map((s: string)=>s.trim())])], sectionOrder: resumeData.sectionOrder }))}
              aiLoading={loadingStates['skills-gen']}
            >
               <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('labels.skills')}</label>
                    <AIButton label={t('actions.clean')} onClick={() => refineWithInstruction('skills-fix', resumeData.skills.join(', '), "Format these skills nicely, remove duplicates, and capitalize correctly. Return comma separated.", (v) => updateSkills(v))} loading={loadingStates['skills-fix']} />
                  </div>
                  <textarea
                    className="w-full text-sm p-3 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all min-h-[100px]"
                    value={skillsText}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                  />
               </div>
            </Section>
          </SortableSection>
        );

      case 'certifications':
        return (
          <SortableSection id="certifications" key="certifications">
            <Section 
              title={`${t('certifications')} (${(resumeData.certifications || []).length})`}
              onAiClick={() => generateItems('cert-gen', 'Professional Certifications', (items) => setResumeData({...resumeData, certifications: [...(resumeData.certifications || []), ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ name: "string", issuer: "string", expireDate: "string", year: "string" }] })}
              aiLoading={loadingStates['cert-gen']}
            >
              {(resumeData.certifications || []).map((cert: any, idx: number) => {
                const certObj = typeof cert === 'string' ? { name: cert, issuer: '', expireDate: '', year: '' } : cert;
                return (
                  <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
                    <div className="absolute top-0 right-0">
                      <button 
                        onClick={() => removeItem('certifications', idx)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Input label={t('labels.certName')} value={certObj.name} onChange={(e) => updateItem('certifications', idx, 'name', e.target.value)} />
                    <Input label={t('labels.certIssuer')} value={certObj.issuer || ''} onChange={(e) => updateItem('certifications', idx, 'issuer', e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={t('labels.certExpire')} value={certObj.expireDate || ''} onChange={(e) => updateItem('certifications', idx, 'expireDate', e.target.value)} />
                      <Input label={t('labels.certYear')} value={certObj.year || ''} onChange={(e) => updateItem('certifications', idx, 'year', e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button 
                onClick={() => addItem('certifications', { name: '', issuer: '', expireDate: '', year: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addCertification')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'publications':
        return (
          <SortableSection id="publications" key="publications">
            <Section 
              title={`${t('publications')} (${resumeData.publications?.length || 0})`}
              onAiClick={() => generateItems('pub-gen', 'Publications', (items) => setResumeData({...resumeData, publications: [...(resumeData.publications || []), ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ title: "string", link: "string", date: "string" }] })}
              aiLoading={loadingStates['pub-gen']}
            >
              {(resumeData.publications || []).map((pub: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative group">
                   <div className="absolute top-0 right-0 flex gap-2">
                     <button 
                      onClick={() => toggleBreakPage('publications', idx)}
                      className={cn(
                        "p-1 text-xs transition-colors",
                        pub.breakPage ? "text-indigo-600" : "text-slate-300 hover:text-indigo-600"
                      )}
                      title={pub.breakPage ? t('actions.removePageBreak') : t('actions.addPageBreak')}
                    >
                      <Scissors size={12} />
                    </button>
                    <button 
                      onClick={() => removeItem('publications', idx)}
                      className="p-1 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input label={t('labels.title')} value={pub.title} onChange={(e) => updateItem('publications', idx, 'title', e.target.value)} />
                  <Input label={t('labels.link')} value={pub.link} onChange={(e) => updateItem('publications', idx, 'link', e.target.value)} />
                </div>
              ))}
              <button 
                onClick={() => addItem('publications', { title: t('placeholders.newPublication'), link: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addPublication')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'volunteering':
        return (
          <SortableSection id="volunteering" key="volunteering">
            <Section 
              title={`${t('volunteering')} (${(resumeData.volunteering || []).length})`}
              onAiClick={() => generateItems('vol-gen', 'Volunteering', (items) => setResumeData({...resumeData, volunteering: [...(resumeData.volunteering || []), ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ role: "string", organization: "string", topic: "string" }] })}
              aiLoading={loadingStates['vol-gen']}
            >
              {(resumeData.volunteering || []).map((vol: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
                  <div className="absolute top-0 right-0">
                    <button 
                      onClick={() => removeItem('volunteering', idx)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input label={t('labels.volRole')} value={vol.role} onChange={(e) => updateItem('volunteering', idx, 'role', e.target.value)} />
                  <Input label={t('labels.volOrganization')} value={vol.organization || ''} onChange={(e) => updateItem('volunteering', idx, 'organization', e.target.value)} />
                  <Input label={t('labels.volTopic')} value={vol.topic || ''} onChange={(e) => updateItem('volunteering', idx, 'topic', e.target.value)} />
                </div>
              ))}
              <button 
                onClick={() => addItem('volunteering', { role: '', organization: '', topic: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addVolunteering')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'languages':
        return (
          <SortableSection id="languages" key="languages">
            <Section 
              title={`${t('languages')} (${(resumeData.languages || []).length})`}
              onAiClick={() => generateItems('lang-gen', 'Languages', (items) => setResumeData({...resumeData, languages: [...(resumeData.languages || []), ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ name: "string", proficiency: "string" }] })}
              aiLoading={loadingStates['lang-gen']}
            >
              {(resumeData.languages || []).map((lang: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
                  <div className="absolute top-0 right-0">
                    <button 
                      onClick={() => removeItem('languages', idx)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('labels.langName')} value={lang.name} onChange={(e) => updateItem('languages', idx, 'name', e.target.value)} />
                    <Input label={t('labels.langProficiency')} value={lang.proficiency} onChange={(e) => updateItem('languages', idx, 'proficiency', e.target.value)} />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addItem('languages', { name: '', proficiency: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addLanguage')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'otherTraining':
        return (
          <SortableSection id="otherTraining" key="otherTraining">
            <Section 
              title={`${t('otherTraining')} (${(resumeData.otherTraining || []).length})`}
              onAiClick={() => generateItems('train-gen', 'Other Training', (items) => setResumeData({...resumeData, otherTraining: [...(resumeData.otherTraining || []), ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ name: "string" }] })}
              aiLoading={loadingStates['train-gen']}
            >
              {(resumeData.otherTraining || []).map((training: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
                  <div className="absolute top-0 right-0">
                    <button 
                      onClick={() => removeItem('otherTraining', idx)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input label={t('labels.trainingName')} value={training.name || ''} onChange={(e) => updateItem('otherTraining', idx, 'name', e.target.value)} />
                </div>
              ))}
              <button 
                onClick={() => addItem('otherTraining', { name: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addTraining')}
              </button>
            </Section>
          </SortableSection>
        );

      case 'references':
        return (
          <SortableSection id="references" key="references">
            <Section 
              title={`${t('references')} (${(resumeData.references || []).length})`}
              onAiClick={() => generateItems('ref-gen', 'References', (items) => setResumeData({...resumeData, references: [...(resumeData.references || []), ...items], sectionOrder: resumeData.sectionOrder}), { items: [{ name: "string", title: "string", company: "string", phone: "string", email: "string" }] })}
              aiLoading={loadingStates['ref-gen']}
            >
              {(resumeData.references || []).map((ref: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
                  <div className="absolute top-0 right-0">
                    <button 
                      onClick={() => removeItem('references', idx)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input label={t('labels.refName')} value={ref.name} onChange={(e) => updateItem('references', idx, 'name', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('labels.refTitle')} value={ref.title || ''} onChange={(e) => updateItem('references', idx, 'title', e.target.value)} />
                    <Input label={t('labels.refCompany')} value={ref.company || ''} onChange={(e) => updateItem('references', idx, 'company', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={t('labels.refPhone')} value={ref.phone || ''} onChange={(e) => updateItem('references', idx, 'phone', e.target.value)} />
                    <Input label={t('labels.refEmail')} value={ref.email || ''} onChange={(e) => updateItem('references', idx, 'email', e.target.value)} />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addItem('references', { name: '', title: '', company: '', phone: '', email: '' })}
                className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('actions.addReference')}
              </button>
            </Section>
          </SortableSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 pb-10">
      {/* Personal Information - Not sortable, usually always at top */}
      <Section 
        title={t('personalInfo')} 
        defaultOpen={true}
        onAiClick={() => generateItems('pi-gen', 'Personal Information', (data) => setResumeData({...resumeData, personalInfo: data, sectionOrder: resumeData.sectionOrder}), { name: "string", title: "string", email: "string", phone: "string", address: "string", linkedin: "string" })}
        aiLoading={loadingStates['pi-gen']}
      >
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            {t('labels.photo')}
          </label>
          <div className="flex items-center gap-4">
            {resumeData.personalInfo.photoUrl ? (
              <div className="relative w-16 h-16 group">
                <img 
                  src={resumeData.personalInfo.photoUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border border-slate-200"
                />
                <button 
                  onClick={() => updatePersonalInfo('photoUrl', '')}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                <Plus size={20} />
              </div>
            )}
            <label className="cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              {resumeData.personalInfo.photoUrl ? t('actions.change') : t('actions.upload')}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </label>
          </div>
        </div>
        <Input label={t('labels.fullName')} value={resumeData.personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} />
        <Input label={t('labels.jobTitle')} value={resumeData.personalInfo.title || ''} onChange={(e) => updatePersonalInfo('title', e.target.value)} />
        <Input 
          label={t('labels.email')} 
          value={resumeData.personalInfo.email} 
          onChange={(e) => updatePersonalInfo('email', e.target.value)} 
          onAiClick={() => refineWithInstruction('email', resumeData.personalInfo.email, "Format this email address correctly", (v) => updatePersonalInfo('email', v))}
          aiLoading={loadingStates['email']}
        />
        <Input label={t('labels.phone')} value={resumeData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} />
        <Input label={t('labels.address')} value={resumeData.personalInfo.address} onChange={(e) => updatePersonalInfo('address', e.target.value)} />
        <Input label={t('labels.linkedin')} value={resumeData.personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} />
      </Section>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={resumeData.sectionOrder || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {(resumeData.sectionOrder || []).map((sectionId) => renderSection(sectionId))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
