import { Language } from '@/types'

import { SidebarSectionHeading } from './SectionHeading'

type LanguagesSectionProps = {
  languages: Language[]
  title: string
}

export const LanguagesSection = ({ languages, title }: LanguagesSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
      {languages.filter(Boolean).map((lang, idx) => (
        <li key={idx} className="pl-1">
          <span className="font-bold">{lang.name}</span>
          {lang.proficiency ? ` (${lang.proficiency})` : ''}
        </li>
      ))}
    </ul>
  </section>
)
