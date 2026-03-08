import { Reference } from '@/shared/types'

import { SidebarSectionHeading } from './SectionHeading'

type ReferencesSectionProps = {
  references: Reference[]
  title: string
}

export const ReferencesSection = ({ references, title }: ReferencesSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <div className="text-xs space-y-4 text-slate-700">
      {references.filter(Boolean).map((ref, idx) => (
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
)
