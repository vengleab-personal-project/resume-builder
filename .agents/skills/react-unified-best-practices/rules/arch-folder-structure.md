# arch-folder-structure

Single source of truth for all directory paths. When a path changes, update here only.

```
src/
├── app/                              # Next.js App Router pages
│   └── <page-name>/
│       ├── page.tsx                  # Route entry — composition only
│       └── hooks/
│           └── use<PageName>.ts      # Route-specific data wiring
│
├── features/                         # Reusable feature modules
│   └── <feature-name>/
│       ├── components/
│       │   └── FeatureName.tsx       # View — thin, calls ViewModel hook
│       ├── hooks/
│       │   └── useFeatureName.ts     # ViewModel — all state, effects, handlers
│       └── index.ts                  # Public barrel export
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (never hand-edit)
│   └── compositions/                 # Compound components
│       └── <name>/
│           ├── ComponentName.tsx     # Root + static sub-component assignments
│           ├── ComponentName.context.ts
│           ├── ComponentName.types.ts
│           └── index.ts
│
├── store/
│   ├── index.ts                      # Combines slices, exports scoped selectors
│   └── slices/
│       └── <domain>Slice.ts
│
├── mock/
│   └── <page-name>/
│       └── index.ts                  # TypeScript types + mock arrays
│
├── services/                         # Model layer — pure async functions
└── lib/
    └── utils.ts                      # cn() and shared utilities
```
