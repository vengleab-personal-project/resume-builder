import { Certification } from '@/shared/types'

import { SidebarSectionHeading } from './SectionHeading'

type CertificationsSectionProps = {
  certifications: (string | Certification)[]
  primaryColor: string
  title: string
}

const normalizeCertification = (cert: string | Certification): Certification => {
  if (typeof cert === 'string') {
    return { name: cert }
  }
  return cert
}

export const CertificationsSection = ({
  certifications,
  primaryColor,
  title,
}: CertificationsSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <div className="text-xs space-y-4 text-slate-700">
      {certifications.filter(Boolean).map((cert, idx) => {
        const normalized = normalizeCertification(cert)
        return (
          <div key={idx}>
            <p className="font-bold text-sm mb-0.5" style={{ color: primaryColor }}>
              {normalized.name}
            </p>
            {normalized.issuer && (
              <p className="opacity-90 italic mb-0.5">{normalized.issuer}</p>
            )}
            <p className="opacity-75 text-[10px]">
              {normalized.expireDate
                ? `Expire: ${normalized.expireDate}`
                : normalized.year
                  ? `Year: ${normalized.year}`
                  : ''}
            </p>
          </div>
        )
      })}
    </div>
  </section>
)
