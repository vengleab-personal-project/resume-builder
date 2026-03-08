# arch-mock-data

Mock data must flow through hooks — never imported directly into components.

## Rules

- Co-locate mock data with the feature or service that owns it (e.g. `src/features/<Feature>/`) or define it inline inside a hook
- Consumed by a hook (feature ViewModel or a dedicated `use<Name>Mock.ts`) — never imported directly in a component
- Type the mock data with the same interfaces used in production (`src/types/`)

## Incorrect

```tsx
// ❌ Mock imported directly in component
import { mockResumeData } from '../mockData'

const ResumePreview = () => {
  return <div>{mockResumeData.name}</div>
}
```

## Correct

```tsx
// ✅ Hook owns the mock — component receives data via props or store
// src/features/Resume/useResumePreviewLogic.ts
import { mockResumeData } from '@/services/resumeService'

export const useResumePreviewLogic = () => ({
  resumeData: mockResumeData,
})

// ResumePreview.tsx — receives data from hook, no mock import
const ResumePreview = () => {
  const { resumeData } = useResumePreviewLogic()
  return <div>{resumeData.name}</div>
}
```
