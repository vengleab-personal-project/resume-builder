import Phone from 'lucide-react/dist/esm/icons/phone'
// @ts-ignore
import Mail from 'lucide-react/dist/esm/icons/mail'
// @ts-ignore
import MapPin from 'lucide-react/dist/esm/icons/map-pin'
// @ts-ignore
import Linkedin from 'lucide-react/dist/esm/icons/linkedin'
// @ts-ignore
import Globe from 'lucide-react/dist/esm/icons/globe'
// @ts-ignore

import { ResumeData } from '@/types'

import { SidebarSectionHeading } from './SectionHeading'

type ContactSectionProps = {
  personalInfo: ResumeData['personalInfo']
  primaryColor: string
  title: string
}

export const ContactSection = ({ personalInfo, primaryColor, title }: ContactSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <div className="flex flex-col gap-3 text-xs text-slate-700 font-medium">
      {personalInfo.phone && (
        <div className="flex items-center gap-3">
          <Phone size={14} className="shrink-0 text-slate-600 fill-current" style={{ color: primaryColor }} />
          <span>{personalInfo.phone}</span>
        </div>
      )}
      {personalInfo.email && (
        <div className="flex items-center gap-3">
          <Mail size={14} className="shrink-0" style={{ color: primaryColor }} />
          <span className="break-all">{personalInfo.email}</span>
        </div>
      )}
      {personalInfo.address && (
        <div className="flex items-center gap-3">
          <MapPin size={14} className="shrink-0" style={{ color: primaryColor }} />
          <span>{personalInfo.address}</span>
        </div>
      )}
      {personalInfo.linkedin && (
        <div className="flex items-center gap-3">
          <Linkedin size={14} className="shrink-0" style={{ color: primaryColor }} />
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
          <Globe size={14} className="shrink-0" style={{ color: primaryColor }} />
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
)
