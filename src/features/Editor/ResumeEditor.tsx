"use client";

import React from 'react';
import { Plus, Trash2, Scissors } from 'lucide-react';
import { Section, Input, TextArea } from '@/components/ui/FormElements';
import { AIButton } from '@/components/ui/AIButton';
import { useResumeEditorLogic } from './useResumeEditorLogic';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

export const ResumeEditor: React.FC = () => {
  const {
    resumeData,
    loadingStates,
    updatePersonalInfo,
    addItem,
    removeItem,
    updateItem,
    updateSummary,
    updateSkills,
    updateCertifications,
    refineWithInstruction,
    generateItems,
    setResumeData,
    toggleBreakPage
  } = useResumeEditorLogic();

  const { t } = useTranslations('editor');

  const [skillsText, setSkillsText] = React.useState(resumeData.skills.join(', '));
  const [certsText, setCertsText] = React.useState(resumeData.certifications.join('\n'));

  React.useEffect(() => {
    const currentText = resumeData.skills.join(', ');
    // Only update local state if the store has changed in a way that's not just whitespace/formatting
    // This allows the user to type commas and spaces without them being "cleaned" immediately
    const normalizedLocal = skillsText.split(',').map(s => s.trim()).filter(Boolean).join(', ');
    if (currentText !== normalizedLocal) {
      setSkillsText(currentText);
    }
  }, [resumeData.skills]);

  React.useEffect(() => {
    const currentText = resumeData.certifications.join('\n');
    const normalizedLocal = certsText.split('\n').map(s => s.trim()).filter(Boolean).join('\n');
    if (currentText !== normalizedLocal) {
      setCertsText(currentText);
    }
  }, [resumeData.certifications]);

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSkillsText(val);
    updateSkills(val);
  };

  const handleCertsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCertsText(val);
    updateCertifications(val);
  };

  return (
    <div className="flex flex-col gap-2 pb-10">
      <Section 
        title={t('personalInfo')} 
        defaultOpen={true}
        onAiClick={() => generateItems('pi-gen', 'Personal Information', (data) => setResumeData({...resumeData, personalInfo: data}), { name: "string", email: "string", phone: "string", address: "string", linkedin: "string" })}
        aiLoading={loadingStates['pi-gen']}
      >
        <Input label={t('labels.fullName')} value={resumeData.personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} />
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

      <Section 
        title={`${t('experience')} (${resumeData.experience.length})`}
        onAiClick={() => generateItems('exp-gen', 'Work Experience', (items) => setResumeData({...resumeData, experience: [...resumeData.experience, ...items]}), { items: [{ role: "string", company: "string", dates: "string", bullets: ["string"] }] })}
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
                title={exp.breakPage ? "Remove page break" : "Add page break after this item"}
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
              label={t('labels.jobTitle')} 
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

      <Section 
        title={`${t('education')} (${resumeData.education.length})`}
        onAiClick={() => generateItems('edu-gen', 'Education', (items) => setResumeData({...resumeData, education: [...resumeData.education, ...items]}), { items: [{ school: "string", degree: "string", year: "string" }] })}
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
                title={edu.breakPage ? "Remove page break" : "Add page break after this item"}
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
            <Input label={t('labels.year')} value={edu.year} onChange={(e) => updateItem('education', idx, 'year', e.target.value)} />
          </div>
        ))}
         <button 
          onClick={() => addItem('education', { school: t('placeholders.newSchool'), degree: '', year: '' })}
          className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> {t('actions.addEducation')}
        </button>
      </Section>

      <Section 
        title={t('skills')}
        onAiClick={() => refineWithInstruction('skills-gen', resumeData.skills.join(', '), "Based on this resume, suggest 5 more relevant technical skills for this candidate.", (v) => setResumeData({...resumeData, skills: [...new Set([...resumeData.skills, ...v.split(',').map((s: string)=>s.trim())])] }))}
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
              onChange={handleSkillsChange}
            />
         </div>
         <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('labels.certifications')}</label>
            <textarea
              className="w-full text-sm p-3 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all min-h-[100px]"
              value={certsText}
              onChange={handleCertsChange}
            />
         </div>
      </Section>

      <Section 
        title={`${t('publications')} (${resumeData.publications?.length || 0})`}
        onAiClick={() => generateItems('pub-gen', 'Publications', (items) => setResumeData({...resumeData, publications: [...(resumeData.publications || []), ...items]}), { items: [{ title: "string", link: "string", date: "string" }] })}
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
                title={pub.breakPage ? "Remove page break" : "Add page break after this item"}
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
    </div>
  );
};
