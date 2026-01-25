"use client";

import React, { useState } from 'react';
import { useResumeStore } from '@/lib/store';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Experience, Education, Publication } from '@/lib/types';

// Collapsible Section Helper
const Section = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg bg-white mb-3">
      <button 
        className="w-full flex items-center justify-between p-3 text-left font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && <div className="p-3 border-t border-slate-100">{children}</div>}
    </div>
  );
};

// Generic Input Helper
const Input = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div className="mb-3">
    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
    <input
      type={type}
      className="w-full text-sm p-2 border border-slate-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: any) => (
  <div className="mb-3">
    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
    <textarea
      className="w-full text-sm p-2 border border-slate-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-24"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default function ResumeEditor() {
  const { resumeData, setResumeData } = useResumeStore();

  const updatePersonalInfo = (key: string, val: string) => {
    setResumeData({ 
      ...resumeData, 
      personalInfo: { ...resumeData.personalInfo, [key]: val } 
    });
  };

  // Generic List Adder
  const addItem = (key: 'experience' | 'education' | 'publications', item: any) => {
    setResumeData({
      ...resumeData,
      [key]: [...(resumeData[key] || []), item]
    });
  };

  // Generic List Remover
  const removeItem = (key: 'experience' | 'education' | 'publications' | 'skills' | 'certifications', index: number) => {
    const list = [...(resumeData[key] || [])];
    list.splice(index, 1);
    setResumeData({ ...resumeData, [key]: list });
  };

  // Generic List Updater
  const updateItem = (key: 'experience' | 'education' | 'publications', index: number, field: string, val: any) => {
    const list = [...(resumeData[key] as any[])];
    list[index] = { ...list[index], [field]: val };
    setResumeData({ ...resumeData, [key]: list });
  };

  // Skills/Certs (String Arrays)
  const updateStringArray = (key: 'skills' | 'certifications', val: string) => {
    // Basic comma separated parsing for bulk add, or just render inputs
    // For simplicity, let's treat it as a textarea implementation for bulk edit
  };

  return (
    <div className="flex flex-col gap-2">
      <Section title="Personal Information" defaultOpen={true}>
        <Input label="Full Name" value={resumeData.personalInfo.name} onChange={(v: string) => updatePersonalInfo('name', v)} />
        <Input label="Job Title (Inferred)" value={resumeData.personalInfo.name} onChange={() => {}} placeholder="e.g. Senior Developer" />
        <Input label="Email" value={resumeData.personalInfo.email} onChange={(v: string) => updatePersonalInfo('email', v)} />
        <Input label="Phone" value={resumeData.personalInfo.phone} onChange={(v: string) => updatePersonalInfo('phone', v)} />
        <Input label="City, Country" value={resumeData.personalInfo.address} onChange={(v: string) => updatePersonalInfo('address', v)} />
        <Input label="Photo URL" value={resumeData.personalInfo.photoUrl} onChange={(v: string) => updatePersonalInfo('photoUrl', v)} />
        <Input label="LinkedIn" value={resumeData.personalInfo.linkedin} onChange={(v: string) => updatePersonalInfo('linkedin', v)} />
      </Section>

      <Section title="Profile Summary">
         <TextArea label="Professional Summary" value={resumeData.summary} onChange={(v: string) => setResumeData({...resumeData, summary: v})} />
      </Section>

      <Section title={`Experience (${resumeData.experience.length})`}>
        {resumeData.experience.map((exp, idx) => (
          <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative group">
            <button 
              onClick={() => removeItem('experience', idx)}
              className="absolute top-0 right-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <Input label="Job Title" value={exp.role} onChange={(v: string) => updateItem('experience', idx, 'role', v)} />
            <Input label="Company" value={exp.company} onChange={(v: string) => updateItem('experience', idx, 'company', v)} />
            <div className="flex gap-2">
              <Input label="Dates" value={exp.dates} onChange={(v: string) => updateItem('experience', idx, 'dates', v)} />
              <Input label="Location" value={exp.location} onChange={(v: string) => updateItem('experience', idx, 'location', v)} />
            </div>
            <TextArea 
              label="Description (Bullets)" 
              value={(exp.bullets || []).join('\n')} 
              onChange={(v: string) => updateItem('experience', idx, 'bullets', v.split('\n'))} 
              placeholder="One bullet per line"
            />
          </div>
        ))}
        <button 
          onClick={() => addItem('experience', { role: 'New Role', company: 'New Company', dates: '', bullets: [] })}
          className="w-full py-2 text-indigo-600 text-sm font-medium border border-dashed border-indigo-200 rounded hover:bg-indigo-50 flex items-center justify-center gap-1"
        >
          <Plus size={14} /> Add Experience
        </button>
      </Section>

      <Section title={`Education (${resumeData.education.length})`}>
         {resumeData.education.map((edu, idx) => (
          <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 relative">
             <button 
              onClick={() => removeItem('education', idx)}
              className="absolute top-0 right-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <Input label="School" value={edu.school} onChange={(v: string) => updateItem('education', idx, 'school', v)} />
            <Input label="Degree" value={edu.degree} onChange={(v: string) => updateItem('education', idx, 'degree', v)} />
            <Input label="Year" value={edu.year} onChange={(v: string) => updateItem('education', idx, 'year', v)} />
          </div>
        ))}
         <button 
          onClick={() => addItem('education', { school: 'New School', degree: '', year: '' })}
          className="w-full py-2 text-indigo-600 text-sm font-medium border border-dashed border-indigo-200 rounded hover:bg-indigo-50 flex items-center justify-center gap-1"
        >
          <Plus size={14} /> Add Education
        </button>
      </Section>

      <Section title="Skills & Certifications">
         <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Skills (Comma separated)</label>
            <textarea
              className="w-full text-sm p-2 border border-slate-300 rounded outline-none h-20"
              value={resumeData.skills.join(', ')}
              onChange={(e) => setResumeData({...resumeData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
            />
         </div>
         <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Certifications (One per line)</label>
            <textarea
              className="w-full text-sm p-2 border border-slate-300 rounded outline-none h-20"
              value={resumeData.certifications.join('\n')}
              onChange={(e) => setResumeData({...resumeData, certifications: e.target.value.split('\n').filter(Boolean)})}
            />
         </div>
      </Section>

      <Section title={`Publications (${resumeData.publications?.length || 0})`}>
        {(resumeData.publications || []).map((pub, idx) => (
          <div key={idx} className="mb-3 relative">
             <button 
              onClick={() => removeItem('publications', idx)}
              className="absolute top-0 right-0 p-1 text-slate-300 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
            <Input label="Title" value={pub.title} onChange={(v: string) => updateItem('publications', idx, 'title', v)} />
            <Input label="Link" value={pub.link} onChange={(v: string) => updateItem('publications', idx, 'link', v)} />
          </div>
        ))}
        <button 
          onClick={() => addItem('publications', { title: 'New Publication', link: '' })}
          className="w-full py-2 text-indigo-600 text-sm font-medium border border-dashed border-indigo-200 rounded hover:bg-indigo-50 flex items-center justify-center gap-1"
        >
          <Plus size={14} /> Add Publication
        </button>
      </Section>
    </div>
  );
}
