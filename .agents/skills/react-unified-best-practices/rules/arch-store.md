# arch-store

Zustand uses one store file per domain. Each domain file exports a scoped hook. Components never access store internals directly.

Paths: `arch-folder-structure.md` → `src/store/`

## Rules

- One file per domain (`<domain>-store.ts`) — export the hook + types from the same file
- Export a scoped hook: `use<Domain>Store`
- Components use the scoped hook only — **never destructure the entire store in one call for unrelated data**

## Incorrect

```tsx
// ❌ Accessing multiple unrelated domains in one store call
const { resumeData, userProfile } = useAppStore()
```

## Correct

```tsx
// ✅ Scoped to one domain
const { resumeData } = useResumeStore()
```

## Adding a New Domain

1. Create `src/store/<domain>-store.ts`
2. Define state, actions, and types inside the same file
3. Export `use<Domain>Store` as the public hook
