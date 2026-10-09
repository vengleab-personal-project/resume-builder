import { Certification } from '@/shared/types'
import { certificationDetail, ResumeViewLabels } from '@/shared/lib/resume-view'

import { SidebarSectionHeading } from './SectionHeading'

type CertificationsSectionProps = {
  certifications: Certification[]
  primaryColor: string
  title: string
  labels: ResumeViewLabels
}

export const CertificationsSection = ({
  certifications,
  primaryColor,
  title,
  labels,
}: CertificationsSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <div className="text-xs space-y-4 text-slate-700">
      {certifications.map((cert, idx) => (
          <div key={idx}>
            <p className="font-bold text-sm mb-0.5" style={{ color: primaryColor }}>
              {cert.name}
            </p>
            {cert.issuer && (
              <p className="opacity-90 italic mb-0.5">{cert.issuer}</p>
            )}
            <p className="opacity-75 text-[10px]">
              {certificationDetail(cert, labels)}
            </p>
          </div>
      ))}
    </div>
  </section>
)
