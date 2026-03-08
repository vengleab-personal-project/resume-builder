# patterns-mvvm

Full MVVM implementation examples. Rule overview: `rules/arch-mvvm.md`.

## File Structure

```
src/features/ContactForm/
├── components/
│   ├── ContactForm.tsx             # View — thin, calls ViewModel hook
│   ├── FormHeader.tsx              # Sub-component (extracted when View > ~150 lines)
│   └── index.ts
├── useContactFormLogic.ts          # ViewModel — all state, effects, handlers
└── index.ts                        # Public barrel export
```

## ViewModel

```tsx
// hooks/useContactFormLogic.ts
import { useState } from 'react'

type ContactFormLogicProps = {
  onSubmit: (name: string) => void
}

export const useContactFormLogic = ({ onSubmit }: ContactFormLogicProps) => {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name)
    setName('')
  }

  return { name, setName, handleSubmit }
}
```

## View

```tsx
// components/ContactForm.tsx
import { useContactFormLogic } from '../useContactFormLogic'

export type ContactFormProps = {
  onSubmit: (name: string) => void
}

export const ContactForm = ({ onSubmit }: ContactFormProps) => {
  const { name, setName, handleSubmit } = useContactFormLogic({ onSubmit })

  return (
    <form onSubmit={handleSubmit}>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit">Send</Button>
    </form>
  )
}
```

## View Decomposition Example

When a View grows beyond ~150 lines, extract sections. See `rules/arch-view-decomposition.md` for the rule.

```tsx
// components/ResumePreview.tsx — thin parent
export const ResumePreview = () => {
  const { resumeData, theme } = useResumeStore()
  return (
    <div>
      <ResumeHeader
        name={resumeData.personalInfo.name}
        primaryColor={theme.primaryColor}
      />
      <SkillsSection skills={resumeData.skills} />
      <EducationSection
        education={resumeData.education}
        primaryColor={theme.primaryColor}
      />
    </div>
  )
}

// components/SkillsSection.tsx — props-only sub-component
type SkillsSectionProps = { skills: string[] }

export const SkillsSection = ({ skills }: SkillsSectionProps) => (
  <section>
    <h3>Skills</h3>
    <ul>{skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
  </section>
)
```
