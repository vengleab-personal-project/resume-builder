import { Training } from '@/shared/types'
import { RichText } from './RichText'

import { SidebarSectionHeading } from './SectionHeading'

type OtherTrainingSectionProps = {
  otherTraining: Training[]
  title: string
}

export const OtherTrainingSection = ({ otherTraining, title }: OtherTrainingSectionProps) => (
  <section>
    <SidebarSectionHeading title={title} />
    <ul className="list-disc list-outside ml-4 text-xs space-y-2 text-slate-700 font-medium">
      {otherTraining.map((train, idx) => (
        <li key={idx} className="pl-1">
          <RichText inline html={train.name} />
        </li>
      ))}
    </ul>
  </section>
)
