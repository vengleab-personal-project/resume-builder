# arch-folder-structure

Single source of truth for all directory paths. When a path changes, update here only.

```
src/
├── app/                      # Next.js App Router pages & API routes
│   ├── (routes)/             # Route groups for frontend pages
│   │   └── page.tsx          # Route entry — composition only
│   └── api/                  # Next.js API Routes
│       └── <name>/
│           └── route.ts      # Thin handler — no business logic
│
├── client/                   # FRONTEND ONLY (React components, browser APIs)
│   ├── views/                # Page assemblies (e.g., Home, Landing)
│   ├── features/             # Feature modules with business logic
│   ├── components/           # Generic reusable UI, layouts
│   ├── hooks/                # Common reusable React hooks
│   ├── store/                # Global state (Zustand)
│   └── styles/               # Global styles
│
├── server/                   # BACKEND ONLY (Never shipped to browser)
│   ├── services/             # Core backend logic & business orchestration
│   └── integrations/         # External API clients (OpenAI, Gemini, etc.)
│
└── shared/                   # SHARED (Safe for both Client & Server)
    ├── types/                # Shared TypeScript interfaces
    ├── lib/                  # Pure utility functions
    ├── messages/             # i18n messages
    └── config/               # Constants & environment config
```
