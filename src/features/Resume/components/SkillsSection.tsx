import { SidebarSectionHeading } from './SectionHeading'

type SkillsSectionProps = {
  skills: string[]
  title: string
}

export const SkillsSection = ({ skills, title }: SkillsSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
      {skills.filter(Boolean).map((skill, idx) => (
        <li key={idx} className="pl-1 leading-snug">
          {skill}
        </li>
      ))}
    </ul>
  </section>
)
