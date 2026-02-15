import React from 'react'
import { Briefcase } from 'lucide-react'

import { Experience } from '@/types'

import { MainSectionHeading } from './SectionHeading'

type ExperienceSectionProps = {
  experience: Experience[]
  primaryColor: string
  title: string
}

const hasData = (arr: unknown[] | undefined) => arr && arr.filter(Boolean).length > 0

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

            {hasData(exp.bullets) && (
              <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm text-slate-600 leading-relaxed">
                {exp.bullets.map((bullet, bIdx) => (
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
)
