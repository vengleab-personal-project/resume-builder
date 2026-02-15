import { ExternalLink } from 'lucide-react'

import { Publication } from '@/types'

import { SidebarSectionHeading } from './SectionHeading'

type PublicationsSectionProps = {
  publications: Publication[]
  title: string
  viewLabel: string
}

export const PublicationsSection = ({ publications, title, viewLabel }: PublicationsSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <ul className="text-xs space-y-2 text-slate-700">
      {publications.map((pub, idx) => (
        <li key={idx} className="flex flex-col">
          <span className="font-semibold">{pub.title}</span>
          {pub.date && <span className="text-[10px] opacity-75">{pub.date}</span>}
          {pub.link && (
            <a
              href={pub.link}
              target="_blank"
              className="text-[10px] underline opacity-80 flex items-center gap-1 mt-0.5 hover:text-blue-600"
              rel="noreferrer"
            >
              {viewLabel} <ExternalLink size={10} />
            </a>
          )}
        </li>
      ))}
    </ul>
  </section>
)
