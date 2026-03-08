# arch-store

Zustand uses a sliced pattern. Each domain gets its own slice and a scoped selector. Components never access the full store directly.

Paths: `arch-folder-structure.md` → `src/store/`

## Rules

- One slice per domain (`slices/<domain>Slice.ts`) — export a `StateCreator`
- Export a scoped selector from `store/index.ts`: `use<Domain>Store`
- Components use the scoped selector only — **never `useAppStore` directly**

## Incorrect

```tsx
// ❌ Full store in component
const { deliveries, user } = useAppStore()
```

## Correct

```tsx
// ✅ Scoped selector
const { deliveries } = useDeliveryStore()
```

## Adding a New Domain

1. Create `slices/<domain>Slice.ts` — export a `StateCreator`
2. Spread it into the store in `store/index.ts`
3. Export `use<Domain>Store` scoped selector from `store/index.ts`
