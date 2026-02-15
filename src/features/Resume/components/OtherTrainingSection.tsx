import { Training } from '@/types'

import { SidebarSectionHeading } from './SectionHeading'

type OtherTrainingSectionProps = {
  otherTraining: (Training | string)[]
  title: string
}

export const OtherTrainingSection = ({ otherTraining, title }: OtherTrainingSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
      {otherTraining.filter(Boolean).map((train, idx) => (
        <li key={idx} className="pl-1">
          {typeof train === 'string' ? train : train.name}
        </li>
      ))}
    </ul>
  </section>
)
