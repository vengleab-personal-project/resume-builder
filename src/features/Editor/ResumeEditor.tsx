"use client";

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Section, Input, TextArea } from '@/components/ui/FormElements';
import { AIButton } from '@/components/ui/AIButton';
import { useResumeEditorLogic } from './useResumeEditorLogic';

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
    setResumeData
  } = useResumeEditorLogic();

  return (
    <div className="flex flex-col gap-2 pb-10">
      <Section 
        title="Personal Information" 
        defaultOpen={true}
        onAiClick={() => generateItems('pi-gen', 'Personal Information', (data) => setResumeData({...resumeData, personalInfo: data}), { name: "string", email: "string", phone: "string", address: "string", linkedin: "string" })}
        aiLoading={loadingStates['pi-gen']}
      >
        <Input label="Full Name" value={resumeData.personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} />
        <Input 
          label="Email" 
          value={resumeData.personalInfo.email} 
          onChange={(e) => updatePersonalInfo('email', e.target.value)} 
          onAiClick={() => refineWithInstruction('email', resumeData.personalInfo.email, "Format this email address correctly", (v) => updatePersonalInfo('email', v))}
          aiLoading={loadingStates['email']}
        />
        <Input label="Phone" value={resumeData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} />
        <Input label="City, Country" value={resumeData.personalInfo.address} onChange={(e) => updatePersonalInfo('address', e.target.value)} />
        <Input label="LinkedIn" value={resumeData.personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} />
      </Section>

      <Section 
        title="Profile Summary" 
        onAiClick={() => refineWithInstruction('summary', resumeData.summary, "Write a professional 2-3 sentence resume summary for a candidate with these skills: " + resumeData.skills.join(', '), (v) => updateSummary(v))}
        aiLoading={loadingStates['summary']}
      >
         <TextArea 
            label="Professional Summary" 
            value={resumeData.summary} 
            onChange={(e) => updateSummary(e.target.value)}
            onAiClick={() => refineWithInstruction('summary-refine', resumeData.summary, "Make this summary more impactful and professional", (v) => updateSummary(v))}
            aiLoading={loadingStates['summary-refine']}
         />
      </Section>

      <Section 
        title={`Experience (${resumeData.experience.length})`}
        onAiClick={() => generateItems('exp-gen', 'Work Experience', (items) => setResumeData({...resumeData, experience: [...resumeData.experience, ...items]}), { items: [{ role: "string", company: "string", dates: "string", bullets: ["string"] }] })}
        aiLoading={loadingStates['exp-gen']}
      >
        {resumeData.experience.map((exp: any, idx: number) => (
          <div key={idx} className="mb-6 p-4 border border-slate-100 rounded-lg bg-slate-50/30 relative group">
            <button 
              onClick={() => removeItem('experience', idx)}
              className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-md transition-all shadow-sm"
            >
              <Trash2 size={14} />
            </button>
            <Input 
              label="Job Title" 
              value={exp.role} 
              onChange={(e) => updateItem('experience', idx, 'role', e.target.value)} 
              onAiClick={() => refineWithInstruction(`exp-role-${idx}`, exp.role, "Suggest a more senior-sounding job title for: " + exp.role, (v) => updateItem('experience', idx, 'role', v))}
              aiLoading={loadingStates[`exp-role-${idx}`]}
            />
            <Input label="Company" value={exp.company} onChange={(e) => updateItem('experience', idx, 'company', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Dates" value={exp.dates} onChange={(e) => updateItem('experience', idx, 'dates', e.target.value)} />
              <Input label="Location" value={exp.location} onChange={(e) => updateItem('experience', idx, 'location', e.target.value)} />
            </div>
            <TextArea 
              label="Achievements" 
              value={(exp.bullets || []).join('\n')} 
              onChange={(e) => updateItem('experience', idx, 'bullets', e.target.value.split('\n'))} 
              placeholder="One bullet per line"
              onAiClick={() => refineWithInstruction(`exp-bullets-${idx}`, (exp.bullets || []).join('\n'), "Turn these into strong, achievement-oriented bullet points starting with action verbs", (v) => updateItem('experience', idx, 'bullets', v.split('\n')))}
              aiLoading={loadingStates[`exp-bullets-${idx}`]}
            />
          </div>
        ))}
        <button 
          onClick={() => addItem('experience', { role: 'New Role', company: 'New Company', dates: '', bullets: [] })}
          className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Experience
        </button>
      </Section>

      <Section 
        title={`Education (${resumeData.education.length})`}
        onAiClick={() => generateItems('edu-gen', 'Education', (items) => setResumeData({...resumeData, education: [...resumeData.education, ...items]}), { items: [{ school: "string", degree: "string", year: "string" }] })}
        aiLoading={loadingStates['edu-gen']}
      >
         {resumeData.education.map((edu: any, idx: number) => (
          <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
             <button 
              onClick={() => removeItem('education', idx)}
              className="absolute top-0 right-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <Input label="School" value={edu.school} onChange={(e) => updateItem('education', idx, 'school', e.target.value)} />
            <Input label="Degree" value={edu.degree} onChange={(e) => updateItem('education', idx, 'degree', e.target.value)} />
            <Input label="Year" value={edu.year} onChange={(e) => updateItem('education', idx, 'year', e.target.value)} />
          </div>
        ))}
         <button 
          onClick={() => addItem('education', { school: 'New School', degree: '', year: '' })}
          className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Education
        </button>
      </Section>

      <Section 
        title="Skills & Certifications"
        onAiClick={() => refineWithInstruction('skills-gen', resumeData.skills.join(', '), "Based on this resume, suggest 5 more relevant technical skills for this candidate.", (v) => setResumeData({...resumeData, skills: [...new Set([...resumeData.skills, ...v.split(',').map((s: string)=>s.trim())])] }))}
        aiLoading={loadingStates['skills-gen']}
      >
         <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Skills (Comma separated)</label>
              <AIButton label="Clean" onClick={() => refineWithInstruction('skills-fix', resumeData.skills.join(', '), "Format these skills nicely, remove duplicates, and capitalize correctly. Return comma separated.", (v) => updateSkills(v))} loading={loadingStates['skills-fix']} />
            </div>
            <textarea
              className="w-full text-sm p-3 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all min-h-[100px]"
              value={resumeData.skills.join(', ')}
              onChange={(e) => updateSkills(e.target.value)}
            />
         </div>
         <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Certifications</label>
            <textarea
              className="w-full text-sm p-3 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all min-h-[100px]"
              value={resumeData.certifications.join('\n')}
              onChange={(e) => updateCertifications(e.target.value)}
            />
         </div>
      </Section>

      <Section 
        title={`Publications (${resumeData.publications?.length || 0})`}
        onAiClick={() => generateItems('pub-gen', 'Publications', (items) => setResumeData({...resumeData, publications: [...(resumeData.publications || []), ...items]}), { items: [{ title: "string", link: "string", date: "string" }] })}
        aiLoading={loadingStates['pub-gen']}
      >
        {(resumeData.publications || []).map((pub: any, idx: number) => (
          <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative group">
             <button 
              onClick={() => removeItem('publications', idx)}
              className="absolute top-0 right-0 p-1 text-slate-300 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
            <Input label="Title" value={pub.title} onChange={(e) => updateItem('publications', idx, 'title', e.target.value)} />
            <Input label="Link" value={pub.link} onChange={(e) => updateItem('publications', idx, 'link', e.target.value)} />
          </div>
        ))}
        <button 
          onClick={() => addItem('publications', { title: 'New Publication', link: '' })}
          className="w-full py-2.5 text-indigo-600 text-sm font-semibold border-2 border-dashed border-indigo-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Publication
        </button>
      </Section>
    </div>
  );
};
