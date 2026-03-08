# arch-mvvm

Use the MVVM pattern for all feature components in `src/features/`. View renders UI; ViewModel owns all logic.

Paths: `arch-folder-structure.md` → `src/features/<feature-name>/`

> Hook lives in `hooks/` subfolder — not at the feature root. See `conflicts.md` §1.

## Layer Responsibilities

| Layer | File | Allowed | Prohibited |
|-------|------|---------|------------|
| View | `FeatureName.tsx` | Render JSX, call ViewModel hook, trigger events | `useState`/`useEffect` for logic, API calls |
| ViewModel | `hooks/useFeatureName.ts` | State, effects, handlers, data transforms | JSX rendering, DOM manipulation |
| Model | `src/services/` | Pure async functions | UI logic, state management |

## Incorrect: logic in View

```tsx
const ContactForm = ({ onSubmit }: Props) => {
  const [name, setName] = useState('')          // ❌ logic in View

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit(name)
    setName('')
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Correct: View delegates to ViewModel

```tsx
// hooks/useContactFormLogic.ts
export const useContactFormLogic = ({ onSubmit }: Props) => {
  const [name, setName] = useState('')
  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit(name)
    setName('')
  }
  return { name, setName, handleSubmit }
}

// ContactForm.tsx — thin View
const ContactForm = ({ onSubmit }: Props) => {
  const { name, setName, handleSubmit } = useContactFormLogic({ onSubmit })
  return (
    <form onSubmit={handleSubmit}>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit">Send</Button>
    </form>
  )
}
```

For full examples: `patterns-mvvm.md`  
For view decomposition (View > ~150 lines): `rules/arch-view-decomposition.md`
