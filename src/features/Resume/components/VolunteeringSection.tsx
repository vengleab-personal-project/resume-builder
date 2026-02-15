import { Volunteering } from '@/types'

import { SidebarSectionHeading } from './SectionHeading'

type VolunteeringSectionProps = {
  volunteering: Volunteering[]
  title: string
}

export const VolunteeringSection = ({ volunteering, title }: VolunteeringSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <div className="text-xs space-y-4 text-slate-700">
      {volunteering.filter(Boolean).map((vol, idx) => (
        <div key={idx}>
          <p className="font-bold text-sm mb-0.5">{vol.role}</p>
          {vol.organization && (
            <p className="font-semibold opacity-90 mb-0.5">{vol.organization}</p>
          )}
          {vol.topic && <p className="italic opacity-80">Topic: {vol.topic}</p>}
        </div>
      ))}
    </div>
  </section>
)
