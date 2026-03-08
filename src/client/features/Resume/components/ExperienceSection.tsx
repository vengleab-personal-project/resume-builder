import React from 'react'
import { Briefcase } from 'lucide-react'

import { Experience } from '@/shared/types'
import { normalizeHtmlSpaces } from '@/shared/lib/htmlUtils'

import { MainSectionHeading } from './SectionHeading'

type ExperienceSectionProps = {
  experience: Experience[]
  primaryColor: string
  title: string
}

export const ExperienceSection = ({ experience, primaryColor, title }: ExperienceSectionProps) => (
  <section className="mb-10">
    <MainSectionHeading title={title} icon={<Briefcase size={20} />} primaryColor={primaryColor} />
    <div className="space-y-8 relative pl-2">
      {/* Timeline Vertical Line */}
      <div className="absolute left-[13px] top-3 bottom-0 w-0.5 bg-slate-200" />

      {experience.map((exp, idx) => (
        <React.Fragment key={idx}>
          <div className={`pl-6 relative ${exp.breakPage ? 'print:break-after-page mb-8' : ''}`}>
            {/* Timeline Dot */}
            <div
              className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-[2px] bg-white shadow-sm z-10 box-border"
              style={{ borderColor: primaryColor }}
            />

            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {exp.company}{exp.location ? ` - ${exp.location}` : ''}
              </h3>
              <span className="text-sm font-bold whitespace-nowrap ml-4" style={{ color: primaryColor }}>
                {exp.dates}
              </span>
            </div>

            <p className="text-md font-bold text-slate-700 mb-2 uppercase tracking-wide opacity-90">
              {exp.role}
            </p>

            {exp.description && (
              <div 
                className="text-sm text-slate-600 leading-relaxed prose prose-sm prose-slate max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1.5"
                dangerouslySetInnerHTML={{ __html: normalizeHtmlSpaces(exp.description) }} 
              />
            )}
          </div>
          {exp.breakPage && <div className="hidden print:block h-0" />}
        </React.Fragment>
      ))}
    </div>
  </section>
)
