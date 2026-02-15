"use client";

import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink, FileText, GraduationCap, Briefcase } from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { useTranslations } from '@/hooks/useTranslations';
import { Certification } from '@/types';

const hasData = (arr: unknown[] | undefined) => arr && arr.filter(Boolean).length > 0;

const normalizeCertification = (cert: string | Certification): Certification => {
  if (typeof cert === 'string') {
    return { name: cert };
  }
  return cert;
};

export const ResumePreview: React.FC = () => {
  const { resumeData, theme, originalFileUrl, viewMode } = useResumeStore();
  const {
    personalInfo,
    education,
    experience,
    skills,
    certifications,
    publications,
    summary,
    volunteering = [],
    languages = [],
    otherTraining = [],
    references = [],
  } = resumeData;
  const { t } = useTranslations('editor');
  const { t: tPreview } = useTranslations('preview');

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

  // Calculate top offset for sidebar content to push it below the header area
  // But actually the header spans both columns visually in the screenshot top part?
  // Let's implement:
  // Top Header (Blue) -> Full Width? No, it looks like:
  // Left Column (Sidebar) | Right Column (Main)
  // Inside Right Column: Top Blue Banner (Name/Title)
  // Inside Left Column: Photo overlapping
  
  // Re-analyzing Crop 1:
  // The blue background is BEHIND the Name/Title.
  // The Name/Title is clearly aligned with the Start of the content in the right column?
  // Actually, "SO Vengleab" starts further left than "EDUCATION".
  // The blue banner goes all the way to the left edge? YES.
  // So: Full Width Header.

  return (
    <div
      className="w-full h-full min-h-[1122px] bg-white flex flex-col overflow-visible print:shadow-none print:w-full print:h-auto relative"
      id="resume-preview"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Top Blue Header Banner */}
      <header 
        className="w-full h-40 shrink-0 relative print:h-40"
        style={{ backgroundColor: theme.primaryColor, WebkitPrintColorAdjust: 'exact' }}
      >
        <div className="flex w-full h-full items-center">
             {/* Left Spacer for Sidebar width */}
             <div className="w-[32%] shrink-0 h-full relative">
                 {/* Photo Container - Absolute positioned to overlap */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/6 w-40 h-40 z-20">
                    <div className="w-full h-full rounded-full bg-white p-1.5 shadow-lg">
                        {personalInfo.photoUrl ? (
                            <img
                            src={personalInfo.photoUrl}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400 uppercase">
                            {personalInfo?.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                 </div>
             </div>
             
             {/* Right Content (Name/Title) */}
             <div className="flex-1 px-8 text-white z-10">
                <h1 className="text-4xl font-extrabold uppercase tracking-wide mb-2">
                    {personalInfo?.name || t('preview.yourName')}
                </h1>
                 {personalInfo.title && (
                    <p className="text-xl font-medium opacity-90">
                    {personalInfo.title}
                    </p>
                )}
             </div>
        </div>
      </header>

      {/* Main Content Area (2 Columns) */}
      <div className="flex flex-1 relative">
         
         {/* Sidebar (Left) */}
         <aside 
            className="w-[32%] py-8 px-6 flex flex-col gap-8 shrink-0 relative z-0"
            style={{ backgroundColor: theme.backgroundColor, WebkitPrintColorAdjust: 'exact' }}
         >
             {/* Spacer for Photo overlap */}
             <div className="h-20" /> 

             {/* Contact */}
             <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                    {t('preview.contact')}
                </h3>
                <div className="flex flex-col gap-3 text-xs text-slate-700 font-medium">
                    {personalInfo.phone && (
                        <div className="flex items-center gap-3">
                            <Phone size={14} className="shrink-0 text-slate-600 fill-current" style={{ color: theme.primaryColor }} />
                            <span>{personalInfo.phone}</span>
                        </div>
                    )}
                    {personalInfo.email && (
                        <div className="flex items-center gap-3">
                            <Mail size={14} className="shrink-0" style={{ color: theme.primaryColor }} />
                            <span className="break-all">{personalInfo.email}</span>
                        </div>
                    )}
                    {personalInfo.address && (
                        <div className="flex items-center gap-3">
                            <MapPin size={14} className="shrink-0" style={{ color: theme.primaryColor }} />
                            <span>{personalInfo.address}</span>
                        </div>
                    )}
                    {personalInfo.linkedin && (
                        <div className="flex items-center gap-3">
                            <Linkedin size={14} className="shrink-0" style={{ color: theme.primaryColor }} />
                            <a
                                href={`https://${personalInfo.linkedin.replace(/^https?:\/\//, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline break-all"
                            >
                                {personalInfo.linkedin}
                            </a>
                        </div>
                    )}
                    {personalInfo.website && (
                         <div className="flex items-center gap-3">
                            <Globe size={14} className="shrink-0" style={{ color: theme.primaryColor }} />
                            <a
                                href={`https://${personalInfo.website.replace(/^https?:\/\//, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline break-all"
                            >
                                {personalInfo.website}
                            </a>
                        </div>
                    )}
                </div>
             </section>

             {/* Skills */}
             {hasData(skills) && (
                <section>
                     <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                        {t('preview.skills')}
                    </h3>
                    <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
                        {skills.filter(Boolean).map((skill: string, idx: number) => (
                        <li key={idx} className="pl-1 leading-snug">
                            {skill}
                        </li>
                        ))}
                    </ul>
                </section>
             )}

            {/* Certifications */}
            {hasData(certifications) && (
                <section>
                     <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                        {t('preview.certifications')}
                    </h3>
                    <div className="text-xs space-y-4 text-slate-700">
                         {certifications.filter(Boolean).map((cert: string | Certification, idx: number) => {
                             const normalized = normalizeCertification(cert);
                             return (
                                 <div key={idx}>
                                     <p className="font-bold text-sm mb-0.5" style={{ color: theme.primaryColor }}>
                                         {normalized.name}
                                     </p>
                                     {normalized.issuer && (
                                         <p className="opacity-90 italic mb-0.5">{normalized.issuer}</p>
                                     )}
                                     <p className="opacity-75 text-[10px]">
                                         {normalized.expireDate ? `Expire: ${normalized.expireDate}` : (normalized.year ? `Year: ${normalized.year}` : '')}
                                     </p>
                                 </div>
                             );
                         })}
                    </div>
                </section>
            )}

            {/* Volunteering */}
            {hasData(volunteering) && (
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                       {t('preview.volunteering')}
                   </h3>
                   <div className="text-xs space-y-4 text-slate-700">
                       {volunteering.filter(Boolean).map((vol: any, idx: number) => (
                           <div key={idx}>
                               <p className="font-bold text-sm mb-0.5">{vol.role}</p>
                               {vol.organization && <p className="font-semibold opacity-90 mb-0.5">{vol.organization}</p>}
                               {vol.topic && <p className="italic opacity-80">Topic: {vol.topic}</p>}
                           </div>
                       ))}
                   </div>
                </section>
            )}

             {/* Languages */}
             {hasData(languages) && (
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                       {t('preview.languages')}
                   </h3>
                   <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
                       {languages.filter(Boolean).map((lang: any, idx: number) => (
                           <li key={idx} className="pl-1">
                               <span className="font-bold">{lang.name}</span>
                               {lang.proficiency ? ` (${lang.proficiency})` : ''}
                           </li>
                       ))}
                   </ul>
                </section>
             )}

            {/* Other Training */}
            {hasData(otherTraining) && (
                 <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                       {t('preview.otherTraining')}
                   </h3>
                   <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
                       {otherTraining.filter(Boolean).map((train: any, idx: number) => (
                           <li key={idx} className="pl-1">
                               {train.name || train}
                           </li>
                       ))}
                   </ul>
                </section>
            )}

            {/* References */}
            {hasData(references) && (
                 <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                       {t('preview.references')}
                   </h3>
                   <div className="text-xs space-y-4 text-slate-700">
                       {references.filter(Boolean).map((ref: any, idx: number) => (
                           <div key={idx}>
                               <p className="font-bold text-sm mb-0.5">{ref.name}</p>
                               {(ref.title || ref.company) && (
                                   <p className="mb-1 opacity-90 font-medium">
                                       {ref.title}{ref.title && ref.company ? ' | ' : ''}{ref.company}
                                   </p>
                               )}
                               <div className="space-y-0.5 opacity-80 text-[11px]">
                                   {ref.phone && <p><span className="font-semibold">Phone:</span> {ref.phone}</p>}
                                   {ref.email && <p><span className="font-semibold">Email:</span> {ref.email}</p>}
                               </div>
                           </div>
                       ))}
                   </div>
                </section>
            )}
            
            {/* Publications (in sidebar) */}
            {hasData(publications) && (
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 border-b-2 border-slate-300 pb-1 text-slate-800">
                       {t('preview.publications')}
                   </h3>
                   <ul className="text-xs space-y-2 text-slate-700">
                        {(publications || []).map((pub: any, idx: number) => (
                             <li key={idx} className="flex flex-col">
                                <span className="font-semibold">{pub.title}</span>
                                {pub.date && <span className="text-[10px] opacity-75">{pub.date}</span>}
                                {pub.link && (
                                <a href={pub.link} target="_blank" className="text-[10px] underline opacity-80 flex items-center gap-1 mt-0.5 hover:text-blue-600" rel="noreferrer">
                                    {t('preview.view')} <ExternalLink size={10} />
                                </a>
                                )}
                            </li>
                        ))}
                   </ul>
                </section>
            )}

            {/* Sidebar Background Extension for Print */}
            <div 
                className="absolute inset-y-0 left-0 w-full -z-10 bg-inherit print:fixed print:left-0 print:h-screen print:w-[32%]" 
                style={{ backgroundColor: theme.backgroundColor, WebkitPrintColorAdjust: 'exact' }}
            />
         </aside>

         {/* Main Content (Right) */}
         <main className="flex-1 p-8 pb-16 bg-white shrink-0 relative z-0">
             
            {/* Education */}
            {hasData(education) && (
            <section className="mb-10">
                <h2
                className="text-lg font-bold uppercase tracking-[0.2em] mb-6 border-b-2 pb-2 flex items-center gap-3"
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                <div className="p-1 rounded bg-white shadow-sm border border-slate-100">
                     <GraduationCap size={20} />
                </div>
                {t('preview.education')}
                </h2>
                <div className="space-y-6 relative pl-2">
                    {/* Timeline Vertical Line */}
                    <div className="absolute left-[13px] top-3 bottom-4 w-0.5 bg-slate-200" />
                    
                    {(education || []).map((edu: any, idx: number) => (
                        <React.Fragment key={idx}>
                        <div className={`pl-6 relative ${edu.breakPage ? "print:break-after-page mb-8" : ""}`}>
                            {/* Timeline Dot */}
                            <div
                                className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-[2px] bg-white shadow-sm z-10 box-border"
                                style={{ borderColor: theme.primaryColor }}
                            />
                            
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                    {edu.degree}
                                </h3>
                                <span className="text-sm font-bold whitespace-nowrap ml-4" style={{ color: theme.primaryColor }}>
                                    {edu.year}
                                </span>
                            </div>
                            
                            <div className="text-sm font-medium text-slate-600 mb-1">
                                {edu.school}{edu.location ? `, ${edu.location}` : ''}
                            </div>
                            
                            {edu.gpa && (
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    <span className="font-bold text-slate-700">GPA:</span> {edu.gpa}
                                </p>
                            )}
                        </div>
                        {edu.breakPage && <div className="hidden print:block h-0" />}
                        </React.Fragment>
                    ))}
                </div>
            </section>
            )}

            {/* Work Experience */}
            {hasData(experience) && (
            <section className="mb-10">
                 <h2
                className="text-lg font-bold uppercase tracking-[0.2em] mb-6 border-b-2 pb-2 flex items-center gap-3"
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                <div className="p-1 rounded bg-white shadow-sm border border-slate-100">
                     <Briefcase size={20} />
                </div>
                {t('preview.experience')}
                </h2>
                <div className="space-y-8 relative pl-2">
                    {/* Timeline Vertical Line */}
                    <div className="absolute left-[13px] top-3 bottom-0 w-0.5 bg-slate-200" />

                    {(experience || []).map((exp: any, idx: number) => (
                        <React.Fragment key={idx}>
                        <div className={`pl-6 relative ${exp.breakPage ? "print:break-after-page mb-8" : ""}`}>
                             {/* Timeline Dot */}
                             <div
                                className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-[2px] bg-white shadow-sm z-10 box-border"
                                style={{ borderColor: theme.primaryColor }}
                            />

                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                    {exp.company}{exp.location ? ` - ${exp.location}` : ''}
                                </h3>
                                <span className="text-sm font-bold whitespace-nowrap ml-4" style={{ color: theme.primaryColor }}>
                                    {exp.dates}
                                </span>
                            </div>
                            
                            <p className="text-md font-bold text-slate-700 mb-2 uppercase tracking-wide opacity-90">
                                {exp.role}
                            </p>

                            {hasData(exp.bullets) && (
                            <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm text-slate-600 leading-relaxed">
                                {(exp.bullets || []).map((bullet: string, bIdx: number) => (
                                <li key={bIdx}>{bullet}</li>
                                ))}
                            </ul>
                            )}
                        </div>
                        {exp.breakPage && <div className="hidden print:block h-0" />}
                        </React.Fragment>
                    ))}
                </div>
            </section>
            )}

            {/* Summary (if desired, optional) */}
            {summary && (
                <section className="mb-10 pt-4 border-t border-slate-100">
                    <h2
                        className="text-lg font-bold uppercase tracking-[0.2em] mb-4 text-slate-800"
                    >
                        {t('preview.profile')}
                    </h2>
                    <p className="text-sm leading-7 text-slate-600">
                        {summary}
                    </p>
                </section>
            )}
            
            {/* White Background Extension for Print */}
             <div 
                className="absolute inset-0 -z-10 bg-white print:fixed print:left-[32%] print:right-0 print:top-0 print:bottom-0 print:h-[200vh]" 
                style={{ WebkitPrintColorAdjust: 'exact' }}
            />
         </main>
      </div>
    </div>
  );
};
