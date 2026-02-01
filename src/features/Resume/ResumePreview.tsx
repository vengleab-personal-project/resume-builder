"use client";

import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink, FileText, Eye, Download } from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { useTranslations } from '@/hooks/useTranslations';

// Helper to check if a section has data to avoid empty empty headers
const hasData = (arr: unknown[] | undefined) => arr && arr.filter(Boolean).length > 0;

export const ResumePreview: React.FC = () => {
  const { resumeData, theme, originalFileUrl, exportedFileUrl, viewMode, setViewMode } = useResumeStore();
  const { personalInfo, education, experience, skills, certifications, publications, summary } = resumeData;
  const { t } = useTranslations('editor');
  const { t: tPreview } = useTranslations('preview');

  if (viewMode === 'exported') {
    return (
      <div className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-hidden print:hidden relative">
        {exportedFileUrl ? (
          <iframe
            src={exportedFileUrl}
            className="w-full h-full flex-1 border-none"
            title="Exported PDF"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-400">
              <Download size={40} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{tPreview('noExportedPdf.title')}</h3>
              <p className="text-sm text-slate-500">
                {tPreview('noExportedPdf.description')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'original') {
    return (
      <div className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-hidden print:hidden relative">
        {originalFileUrl ? (
          <iframe
            src={originalFileUrl}
            className="w-full h-full flex-1 border-none"
            title="Original PDF"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
              <FileText size={40} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{tPreview('noPdfUploaded.title')}</h3>
              <p className="text-sm text-slate-500">
                {tPreview('noPdfUploaded.description')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[1122px] bg-white flex overflow-hidden print:shadow-none print:w-full print:h-auto relative" id="resume-preview">
      {/* Left Sidebar */}
      <aside 
        className="w-[32%] text-white p-6 flex flex-col gap-8 flex-shrink-0 relative z-10"
        style={{ backgroundColor: theme.primaryColor, fontFamily: theme.fontFamily }}
      >
        {/* Sidebar Background Extension for Print */}
        <div 
          className="absolute inset-y-0 left-0 w-full -z-10 print:fixed print:h-[297mm]" 
          style={{ backgroundColor: theme.primaryColor }}
        />
        
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          {personalInfo.photoUrl ? (
            <img 
              src={personalInfo.photoUrl} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-white/20 mb-4"
            />
          ) : (
             <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-4xl font-bold mb-4 border-4 border-white/20 uppercase">
               {personalInfo?.name?.charAt(0) || '?'}
             </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-3 text-sm">
          {personalInfo.email && (
            <div className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" />
              <span className="break-all">{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-2">
              <Phone size={16} className="shrink-0" />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.address && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0" />
              <span>{personalInfo.address}</span>
            </div>
          )}
          {personalInfo.linkedin && (
             <div className="flex items-center gap-2">
               <Linkedin size={16} className="shrink-0" />
               <a href={`https://${personalInfo.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                 {t('labels.linkedin')}
               </a>
             </div>
          )}
           {personalInfo.website && (
             <div className="flex items-center gap-2">
               <Globe size={16} className="shrink-0" />
               <a href={`https://${personalInfo.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                 {t('labels.website') || 'Website'}
               </a>
             </div>
          )}
        </div>

        {/* Skills */}
        {hasData(skills) && (
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-3 border-b border-white/20 pb-1">
              {t('preview.skills')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.filter(Boolean).map((skill: string, idx: number) => (
                <span key={idx} className="bg-white/10 px-2 py-1 rounded text-sm mb-1 inline-block">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {hasData(certifications) && (
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-3 border-b border-white/20 pb-1">
              {t('preview.certifications')}
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {certifications.filter(Boolean).map((cert: string, idx: number) => (
                <li key={idx}>{cert}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Publications */}
        {hasData(publications) && (
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-3 border-b border-white/20 pb-1">
              {t('preview.publications')}
            </h3>
             <ul className="text-sm space-y-3">
              {(publications || []).map((pub: any, idx: number) => (
                <li key={idx} className="flex flex-col">
                  <span className="font-semibold">{pub.title}</span>
                  {pub.date && <span className="text-xs opacity-75">{pub.date}</span>}
                  {pub.link && (
                    <a href={pub.link} target="_blank" className="text-xs underline opacity-80 flex items-center gap-1 mt-0.5" rel="noreferrer">
                      {t('preview.view')} <ExternalLink size={10} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main Body */}
      <main 
        className="flex-1 p-8 pb-16 text-slate-800 bg-white relative z-20"
        style={{ fontFamily: theme.fontFamily }}
      >
        {/* Header Name & Title (Title inferred or just name) */}
        <header className="mb-8">
          <h1 
            className="text-4xl font-extrabold uppercase tracking-tight mb-2"
            style={{ color: theme.primaryColor }}
          >
            {personalInfo?.name || t('preview.yourName')}
          </h1>
          {/* We could add a subtitle/role here if we extracted it, but for now just name */}
        </header>

        {/* Summary */}
        {summary && (
          <section className="mb-8">
             <h2 
               className="text-xl font-bold uppercase tracking-widest mb-3 border-b-2 pb-1"
               style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
             >
               {t('preview.profile')}
             </h2>
             <p className="text-sm leading-relaxed text-slate-600">
               {summary}
             </p>
          </section>
        )}

        {/* Experience */}
        {hasData(experience) && (
          <section className="mb-8">
            <h2 
               className="text-xl font-bold uppercase tracking-widest mb-4 border-b-2 pb-1"
               style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
             >
               {t('preview.experience')}
             </h2>
             <div className="space-y-6">
               {(experience || []).map((exp: any, idx: number) => (
                 <React.Fragment key={idx}>
                   <div className={exp.breakPage ? "print:break-after-page mb-8" : ""}>
                     <div className="flex justify-between items-baseline mb-1">
                       <h3 className="text-lg font-bold text-slate-800">{exp.role}</h3>
                       <span className="text-sm font-medium text-slate-500">{exp.dates}</span>
                     </div>
                     <div className="text-md font-semibold text-slate-700 mb-2 flex justify-between">
                       {exp.company}
                       {exp.location && <span className="text-sm font-normal text-slate-500 italic">{exp.location}</span>}
                      </div>
                     <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-600">
                       {(exp.bullets || []).map((bullet: string, bIdx: number) => (
                         <li key={bIdx}>{bullet}</li>
                       ))}
                     </ul>
                   </div>
                   {exp.breakPage && <div className="hidden print:block h-0" />}
                 </React.Fragment>
               ))}
             </div>
          </section>
        )}

        {/* Education */}
        {hasData(education) && (
          <section className="mb-8">
            <h2 
               className="text-xl font-bold uppercase tracking-widest mb-4 border-b-2 pb-1"
               style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
            >
               {t('preview.education')}
            </h2>
            <div className="space-y-4">
              {(education || []).map((edu: any, idx: number) => (
                <React.Fragment key={idx}>
                  <div className={edu.breakPage ? "print:break-after-page mb-6" : ""}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-lg font-bold text-slate-800">{edu.school}</h3>
                      <span className="text-sm font-medium text-slate-500">{edu.year}</span>
                    </div>
                    <div className="text-md text-slate-700">{edu.degree}</div>
                    {edu.location && <div className="text-sm text-slate-500 italic">{edu.location}</div>}
                  </div>
                  {edu.breakPage && <div className="hidden print:block h-0" />}
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* Footer spacing/margin */}
        <footer className="h-8 print:h-12" />
      </main>
    </div>
  );
};
