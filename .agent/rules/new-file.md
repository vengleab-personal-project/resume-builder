---
trigger: model_decision
description: Project folder structure
---

# Next.js App Router - File Placement Guide

## Directory Structure

### 🎯 Frontend
| Folder | Purpose | Examples |
|--------|---------|----------|
| `src/app/[route]/` | **Pages & routes** - `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` | `src/app/dashboard/page.tsx` → `/dashboard` |
| `src/features/` | **Feature modules** - Components with business logic | `Upload/`, `Editor/`, `Resume/` |
| `src/components/ui/` | **Reusable UI** - Generic components, no business logic | `Button.tsx`, `Input.tsx`, `Modal.tsx` |
| `src/components/layouts/` | **Layout components** - Reusable layouts (not route-specific) | `MainLayout.tsx`, `DashboardLayout.tsx` |
| `src/hooks/` | **Custom hooks** - Reusable React hooks | `useDebounce.ts`, `useMediaQuery.ts` |
| `src/store/` | **State management** - Global state (Zustand, Redux, etc.) | `resume-store.ts`, `auth-store.ts` |

### ⚙️ Backend
| Folder | Purpose | Examples |
|--------|---------|----------|
| `src/app/api/` | **API routes** - Thin handlers (`route.ts` only) | `api/parse-resume/route.ts` |
| `src/services/` | **Business logic** - Core logic & orchestration | `resumeService.ts`, `aiService.ts` |
| `src/integrations/` | **External APIs** - Third-party API clients | `openai.ts`, `gemini.ts` |

### 🔧 Shared
| Folder | Purpose | Examples |
|--------|---------|----------|
| `src/types/` | **TypeScript types** - Shared interfaces | `resume.ts`, `api.ts` |
| `src/lib/` | **Utilities** - Pure helper functions | `utils.ts`, `validators.ts` |
| `src/config/` | **Configuration** - Constants & env vars | `constants.ts`, `prompts.ts` |

## Quick Decision Tree
- **Page/route?** → `src/app/[route]/page.tsx`
- **API endpoint?** → `src/app/api/[name]/route.ts`
- **Feature with logic/hooks?** → `src/features/`
- **Generic UI?** → `src/components/ui/`
- **Custom common hook?** → `src/hooks/`
- **Business logic?** → `src/services/`
- **External API?** → `src/integrations/`
- **Type/interface?** → `src/types/`
- **Utility function?** → `src/lib/`
- **Configuration?** → `src/config/`

## Next.js App Router Conventions
- `src/app/` folder structure = URL structure
- `page.tsx` makes a route publicly accessible
- Server Components by default (add `"use client"` for interactivity)
- Private folders: prefix with `_` to exclude from routing (`_components/`)

---

## Layered Architecture Pattern

### Layer Responsibilities
```
src/app/api/route.ts       → Request/response handling only
        ↓
src/services/              → Business logic & orchestration
        ↓
src/integrations/          → External API clients
```

| Layer | Responsibilities | Prohibited |
|-------|-----------------|------------|
| **Routes** (`route.ts`) | Parse requests, format responses, handle errors | Business logic, complex transformations |
| **Services** | Business logic, orchestration, data transformation | Direct `NextRequest`/`NextResponse` objects |
| **Integrations** | External API clients (OpenAI, Gemini, etc.) | Business logic |
| **Types** | TypeScript interfaces & validation | Business logic |

## Best Practices

**DO** ✅
- Use path aliases: `import { service } from '@/services/service'`
- Keep `route.ts` thin
- Strong typing everywhere
- `async/await` for all I/O

**DON'T** ❌
- Business logic in `route.ts`
- Relative imports: `'../../../services'`
- Missing type definitions
