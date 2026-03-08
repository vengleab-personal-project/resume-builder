# arch-view-decomposition

When a feature View exceeds ~150 lines, extract logical sections into domain sub-components. Sub-components are props-only — they never read from the store.

## Rules

- Threshold: View file > ~150 lines → extract sections into `components/` within the feature
- Sub-components live in `<feature>/components/SectionA.tsx`
- Sub-components receive all data via **props only** — no store or context access
- The parent View becomes a thin composition layer that reads from the hook and passes data down

## Incorrect: sub-component reads from store

```tsx
// ❌ Sub-component reaches into global state
const SkillsSection = () => {
  const { resumeData } = useResumeStore()
  return <ul>{resumeData.skills.map(...)}</ul>
}
```

## Correct: parent reads, children receive props

```tsx
// ✅ Parent View — reads store, passes data down
const ResumePreview = () => {
  const { resumeData, theme } = useResumeStore()
  return (
    <div>
      <ResumeHeader name={resumeData.personalInfo.name} color={theme.primaryColor} />
      <SkillsSection skills={resumeData.skills} />
      <EducationSection education={resumeData.education} />
    </div>
  )
}

// ✅ Sub-component — props only, no store dependency
const SkillsSection = ({ skills }: { skills: string[] }) => (
  <ul>{skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
)
```

Depends on: `arch-mvvm` (View is defined there)
