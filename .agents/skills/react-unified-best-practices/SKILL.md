---
name: react-unified-best-practices
description: Unified React best practices for this project. Merges project architecture conventions (CLAUDE.md + code-review-agent), MVVM and Compound Component design patterns, TypeScript and styling standards, and Vercel performance guidelines. Use for all React component writing, code review, refactoring, and code generation in this codebase.
---

# React Unified Best Practices

Unified guide combining project architecture conventions, component design patterns, and code standards.

## When to Apply

- Writing new React components or features
- Choosing between component patterns (MVVM vs Compound vs plain)
- Reviewing code against project conventions
- Refactoring state, imports, or data flows

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture | CRITICAL | `arch-` |
| 2 | Code Standards | HIGH | `standards-` |
| 3 | Performance | see `vercel-react-best-practices` skill | — |

## Quick Reference

### 1. Architecture (CRITICAL)

- `arch-folder-structure` — Single source of truth for all directory paths
- `arch-page-feature-separation` — Pages compose only; features own their logic
- `arch-mvvm` — MVVM pattern for all feature components in `src/features/`
- `arch-view-decomposition` — Split Views > ~150 lines into props-only sub-components
- `arch-compound` — Compound components for reusable UI with sub-parts
- `arch-store` — Zustand slices + scoped selectors, never `useAppStore` directly
- `arch-mock-data` — Mock data via page-level hooks only, never imported in components

### 2. Code Standards (HIGH)

- `standards-typescript` — No `any`, no `React.FC`, exported named types
- `standards-imports` — `@/` alias, import order, direct imports for external libs
- `standards-naming` — Naming conventions for files, components, hooks, services
- `standards-styling` — Tailwind only, `cn()`, semantic tokens

### 3. Performance

Reference `vercel-react-best-practices` skill for all 57 performance rules.

## File Registry

Read individual rule files for explanations and code examples.

### Rules (`rules/`)

| File | Scope | Depends On |
|------|-------|-----------|
| `arch-folder-structure` | Single source of truth for all directory paths in the project | — |
| `arch-page-feature-separation` | Pages compose only; features own logic and are route-agnostic | `arch-folder-structure` |
| `arch-mvvm` | MVVM layers: View (thin JSX) + ViewModel (hook) + Model (services) | `arch-folder-structure`, `patterns-mvvm` |
| `arch-view-decomposition` | When/how to split a large View into props-only sub-components | `arch-mvvm` |
| `arch-compound` | Compound pattern: when to use, composition API | `arch-folder-structure`, `patterns-compound` |
| `arch-store` | Zustand slices and scoped selectors — never `useAppStore` directly | `arch-folder-structure` |
| `arch-mock-data` | Mock data flow — only through page-level hooks | `arch-folder-structure`, `arch-store` |
| `standards-typescript` | No `any`, no `React.FC`, exported named prop types | — |
| `standards-imports` | `@/` alias, import ordering, direct imports for external libs | `conflicts` §3 |
| `standards-naming` | Naming conventions: files, components, hooks, services, mock vars | — |
| `standards-styling` | Tailwind only, `cn()`, semantic tokens, component file structure | — |

### Supporting Files

| File | Scope |
|------|-------|
| `patterns-mvvm` | Full MVVM code: ViewModel hook, thin View, view decomposition example |
| `patterns-compound` | Full Compound code: context, root, sub-components, barrel, usage |
| `conflicts` | Source conflict resolutions (CLAUDE.md vs personal files) |
| `agent-extensions` | Rules not yet in `code-review-agent` that should be added |
