import React from 'react'
import { GraduationCap } from 'lucide-react'

import { Education } from '@/types'

import { MainSectionHeading } from './SectionHeading'

type EducationSectionProps = {
  education: Education[]
  primaryColor: string
  title: string
}

export const EducationSection = ({ education, primaryColor, title }: EducationSectionProps) => (
  <section className="mb-10">
    <MainSectionHeading title={title} icon={<GraduationCap size={20} />} primaryColor={primaryColor} />
    <div className="space-y-6 relative pl-2">
      {/* Timeline Vertical Line */}
      <div className="absolute left-[13px] top-3 bottom-4 w-0.5 bg-slate-200" />

      {education.map((edu, idx) => (
        <React.Fragment key={idx}>
          <div className={`pl-6 relative ${edu.breakPage ? 'print:break-after-page mb-8' : ''}`}>
            {/* Timeline Dot */}
            <div
              className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-[2px] bg-white shadow-sm z-10 box-border"
              style={{ borderColor: primaryColor }}
            />

            <div className="flex justify-between items-start mb-1">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {edu.degree}
              </h3>
              <span className="text-sm font-bold whitespace-nowrap ml-4" style={{ color: primaryColor }}>
                {edu.year}
              </span>
            </div>

            <div className="text-sm font-medium text-slate-600 mb-1">
              {edu.school}{edu.location ? `, ${edu.location}` : ''}
            </div>

            {edu.description && (
              <div className="text-sm text-slate-500 font-medium mt-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                <span dangerouslySetInnerHTML={{ __html: edu.description }} />
              </div>
            )}
          </div>
          {edu.breakPage && <div className="hidden print:block h-0" />}
        </React.Fragment>
      ))}
    </div>
  </section>
)
