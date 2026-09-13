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
│   ├── db/                   # Prisma client singleton + generated client (gitignored)
│   ├── config/               # Server-only env vars (import "server-only")
│   ├── errors/                # Cross-cutting HttpError / errorResponse / withErrorHandling.
│   │                           # Used by every module below — nothing domain-specific here.
│   └── modules/               # Domain-driven slices, imported directly file-to-file
│       │                       # (no barrel index.ts requirement — import the specific
│       │                       # file, e.g. "@/server/modules/auth/guards")
│       ├── auth/                # session, guards, password, telegram(Account), cookies, rateLimit
│       ├── ai/
│       │   ├── clients/         # Raw external SDK clients (gemini.ts, openai.ts)
│       │   ├── registry/        # Chat-model + coin-cost registry (admin-configurable)
│       │   └── workflows/       # Multi-step orchestration (parsing, refinement)
│       ├── resumes/             # Resume & evaluation persistence services
│       └── billing/             # coinService, paymentService, http.ts, plus:
│           └── payments/         # the provider abstraction — types/currency/registry
│               └── providers/     # + providers/{bakong,mock}
│
└── shared/                   # SHARED (Safe for both Client & Server)
    ├── types/                # Shared TypeScript interfaces
    ├── lib/                  # Pure utility functions
    ├── messages/             # i18n messages
    └── config/               # Constants & environment config
```
