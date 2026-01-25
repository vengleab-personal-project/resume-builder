---
trigger: model_decision
description: When create new file in frontend folder
---

# Frontend File Placement Guide

## Where to Create Files

### Pages → `pages/PageName/`
- **When**: New route/screen
- **Files**: `PageName.tsx`, `usePageNameLogic.ts`, `index.ts`
- **Examples**: ChatPage, SettingsPage

### Features → `features/FeatureName/`
- **When**: Reusable business components
- **Files**: `FeatureName.tsx`, `useFeatureNameLogic.ts`, `index.ts`
- **Examples**: ChatInput, Sidebar, MessageBubble

### UI Components → `components/ui/`
- **When**: Generic UI with zero business logic
- **Files**: Single `.tsx` files
- **Examples**: Button, Modal, Avatar, Badge

### Layouts → `components/layouts/`
- **When**: Compound components for page structure
- **Files**: Single `.tsx` files
- **Examples**: ChatLayout, DashboardLayout

### Services → `services/`
- **When**: API calls & data fetching
- **Files**: `.ts` files with pure async functions
- **Examples**: `api.ts`, `auth.ts`

### Types → `types/`
- **When**: Shared TypeScript types
- **Files**: `index.ts` or domain-specific `.ts`
- **Examples**: Message, User, ConfluencePage

## Quick Decision

- Route? → `pages/`
- Reusable + logic? → `features/`
- Generic UI? → `components/ui/`
- Layout? → `components/layouts/`
- API call? → `services/`
- Type? → `types/`