# arch-folder-structure

Single source of truth for all directory paths. When a path changes, update here only.

```
src/
├── app/                                    # Next.js App Router pages & API routes
│   ├── <route>/
│   │   └── page.tsx                        # Route entry — composition only
│   └── api/
│       └── <name>/
│           └── route.ts                    # Thin handler — no business logic
│
├── features/                               # Feature modules with business logic
│   └── <FeatureName>/
│       ├── components/
│       │   └── FeatureName.tsx             # View — thin JSX, calls ViewModel hook
│       ├── use<FeatureName>Logic.ts        # ViewModel — all state, effects, handlers
│       └── index.ts                        # Public barrel export
│
├── components/
│   ├── ui/                                 # Generic reusable UI, no business logic
│   └── layouts/                            # Reusable layout components
│
├── hooks/                                  # Common reusable React hooks
│   └── use<HookName>.ts
│
├── store/                                  # Global state (Zustand)
│   └── <domain>-store.ts
│
├── services/                               # Business logic & orchestration
│   └── <name>Service.ts
│
├── integrations/                           # External API clients
│   └── <provider>.ts
│
├── types/                                  # Shared TypeScript interfaces
│   └── <domain>.ts
│
├── lib/                                    # Pure utility functions
│   └── utils.ts
│
├── config/                                 # Constants & environment config
│   └── constants.ts
│
└── styles/                                 # Global styles
```
