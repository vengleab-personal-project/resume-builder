---
trigger: model_decision
description: When create new file in frontend folder
---

# Frontend File Placement Guide (Next.js App Router)

## Where to Create Files

### App Routes → `src/app/route-name/`
- **When**: New route/page in your application
- **Files**: `page.tsx` (required), `layout.tsx` (optional), `loading.tsx` (optional), `error.tsx` (optional)
- **Examples**: 
  - `src/app/dashboard/page.tsx` → `/dashboard` route
  - `src/app/profile/[id]/page.tsx` → `/profile/:id` dynamic route
- **Note**: Each route folder can contain:
  - `page.tsx` - The UI for that route
  - `layout.tsx` - Shared layout for that route segment
  - `loading.tsx` - Loading UI
  - `error.tsx` - Error UI
  - `not-found.tsx` - 404 UI

### API Routes → `src/app/api/endpoint-name/`
- **When**: Creating backend API endpoints
- **Files**: `route.ts` (for GET, POST, etc. handlers)
- **Examples**: `src/app/api/parse-resume/route.ts`, `src/app/api/refine-resume/route.ts`

### Features → `src/features/FeatureName/`
- **When**: Reusable business components with logic
- **Files**: `FeatureName.tsx`, `useFeatureNameLogic.ts`, `index.ts`
- **Examples**: ResumeUploader, JobDescriptionInput, ResumePreview
- **Note**: These are Client Components that can be imported into pages

### UI Components → `src/components/ui/`
- **When**: Generic, reusable UI with zero business logic
- **Files**: Single `.tsx` files
- **Examples**: Button, Input, Modal, Card, Badge

### Layouts → `src/components/layouts/`
- **When**: Reusable layout components (not route-specific)
- **Files**: Single `.tsx` files
- **Examples**: MainLayout, DashboardLayout, AuthLayout

### Lib/Utils → `src/lib/`
- **When**: Utility functions, configurations, helpers
- **Files**: `.ts` files with pure functions
- **Examples**: `utils.ts`, `ai-config.ts`, `validators.ts`

### Config → `src/config/`
- **When**: Application configuration and constants
- **Files**: `.ts` files with configuration objects
- **Examples**: `ai-prompts.ts`, `env.ts`, `constants.ts`

### Services → `src/services/`
- **When**: API calls & external service integrations
- **Files**: `.ts` files with pure async functions
- **Examples**: `openai-service.ts`, `google-ai-service.ts`

### Types → `src/types/`
- **When**: Shared TypeScript types and interfaces
- **Files**: `index.ts` or domain-specific `.ts`
- **Examples**: `resume.ts`, `job-description.ts`, `api.ts`

### Styles → `src/styles/`
- **When**: Global styles, CSS modules (legacy - prefer Tailwind)
- **Files**: `.css` files
- **Note**: In App Router, `globals.css` is typically imported in `src/app/layout.tsx`

## Quick Decision Tree

- New route/page? → `src/app/route-name/page.tsx`
- API endpoint? → `src/app/api/endpoint-name/route.ts`
- Reusable component with business logic? → `src/features/`
- Generic UI component? → `src/components/ui/`
- Reusable layout? → `src/components/layouts/`
- Utility/helper function? → `src/lib/`
- Configuration? → `src/config/`
- External API integration? → `src/services/`
- Type definition? → `src/types/`

## Important Next.js App Router Conventions

1. **`src/app/` directory is for routing** - folder structure = URL structure
2. **`page.tsx` makes a route publicly accessible**
3. **Server Components by default** - add `"use client"` for interactivity
4. **Co-location is allowed** - you can put components next to the routes that use them
5. **Private folders** - prefix with `_` to exclude from routing (e.g., `src/app/_components/`)