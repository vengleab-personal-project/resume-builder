# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js 16 (App Router) resume builder: users author a CV in a live two-column
editor, can ingest an existing PDF/DOCX resume via AI parsing (OpenAI/Gemini),
refine sections with AI, evaluate a resume against a job description, export to
PDF (print) or DOCX, and manage multiple saved CVs backed by Postgres. It also
has its own auth (username/password + Telegram login) and a coin-based billing
system (Bakong KHQR payments) that gates AI actions.

A second product line sits alongside it: **Basic Resume**, the Cambodian short-form
CV (ប្រវត្តិរូបសង្ខេប), at `/basic-resume`. It is aimed at job seekers with no resume to
upload, for whom an 11-section English editor is the wrong document entirely. It is built
by answering ~15 spoken questions — or typing the same answers — in English or Khmer. It
is a separate document with its own shape, template and editor — see "Two resume kinds"
below. It does not replace or change the two-column builder.

## Commands

```bash
npm install                 # postinstall runs `prisma generate`
npm run dev                 # next dev on port 3001 (not 3000)
npm run build                # prisma generate && prisma migrate deploy && next build
npm run lint                 # eslint
npx tsc --noEmit              # typecheck (no dedicated package.json script)

npm run db:migrate            # prisma migrate dev — creates a new migration
npm run db:deploy             # prisma migrate deploy — applies pending migrations
npm run db:studio             # prisma studio
npm run db:seed               # prisma db seed -> tsx prisma/seed.ts (idempotent, seeds admin user + fallback AI config)
```

There is no test suite/framework configured in this repo. `scripts/verify-coin-concurrency.ts`
is a standalone, manually-run script (not wired to `npm test`) that stress-tests
coin-deduction and payment-settlement concurrency against a throwaway Postgres
instance — see the header comment in that file for the exact run steps
(it needs `--conditions=react-server` because it imports `server-only` modules).

Requires a Postgres database: copy `.env.example` to `.env` and set `DATABASE_URL`
(pooled) and `DIRECT_URL` (direct, used by `prisma migrate`/`prisma studio`).
Every env var is documented inline in `.env.example`; missing AI/payment keys
degrade gracefully (mock data / disabled providers) rather than crashing.

## Architecture

### Directory layout (source of truth — don't restructure without updating this)

```
src/
├── app/                # Next.js App Router: routes + API. Route files are thin —
│   ├── (app)/           # composition/wiring only, no business logic inline.
│   └── api/<name>/route.ts
├── client/              # Frontend only (browser APIs allowed)
│   ├── views/            # Page-level assemblies, one per route (e.g. CvBuilder, ResumeList)
│   ├── features/         # Reusable feature modules with their own logic
│   ├── components/       # Generic reusable UI + layouts (GlobalSidebar, AppSessionProvider)
│   ├── hooks/             # Common cross-cutting hooks (useTranslations, useChatModels)
│   └── store/             # Zustand, one file per domain
├── server/               # Backend only — never shipped to the browser
│   ├── db/                 # Prisma client singleton; db/generated/prisma is gitignored
│   ├── config/env.server.ts # server-only env vars (imports `server-only`)
│   ├── errors/              # HttpError / errorResponse / withErrorHandling — used by every route
│   └── modules/             # Domain slices, imported file-to-file (no barrel requirement)
│       ├── auth/             # session (jose/JWT), guards, password (argon2), telegram, rateLimit
│       ├── ai/
│       │   ├── clients/       # raw SDK wrappers (gemini.ts, openai.ts)
│       │   ├── registry/      # ChatModel + ActionCost DB-backed registry
│       │   └── workflows/     # multi-step orchestration (parse, refine)
│       ├── resumes/          # resume & evaluation persistence services
│       └── billing/          # coinService, paymentService, payments/providers/{bakong,mock}
└── shared/               # Safe for both client and server
    ├── types/              # cross-cutting TS types (incl. shared/types/persistence.ts DTOs)
    ├── lib/                # pure utilities + zod validation schemas
    ├── messages/           # i18n dictionaries (en.ts, km.ts) — identical key shapes, enforced
    └── config/             # constants, auth config, public env (shared/config/env.ts)
```

### MVVM pattern (View / ViewModel / Model) — the convention this codebase follows

Every screen is split three ways:
- **View** (`views/<Name>/<Name>.tsx` or `features/<Name>/<Name>.tsx`) — thin JSX only. No
  `useState`/`useEffect` for business logic, no direct `fetch` calls.
- **ViewModel** (`use<Name>Logic.ts` next to the View) — owns all state, effects, handlers,
  and data-fetching for that screen; the View just calls the hook and renders what it returns.
- **Model** — the server modules under `src/server/modules/` (called via API routes) or a
  Zustand store slice.

When a View file grows past ~150 lines, split rendering into `components/SectionX.tsx`
sub-components that receive everything via **props only** — they must not reach into a
Zustand store or context themselves (see e.g. `client/features/Resume/components/*`, which
are all driven by props passed down from `ResumePreview.tsx`).

Route files under `src/app/**/page.tsx` are composition-only — they typically just
re-export a view: `export { default } from '@/client/views/X/X';`.

### Zustand store conventions

One file per domain in `src/client/store/` (`<domain>-store.ts`), exporting a single scoped
hook (`useResumeStore`, `useCoinStore`, `useLocaleStore`). Components should destructure only
the fields they need from one domain's store — never reach across domains in one call.
`useResumeStore` additionally persists to `localStorage` (`zustand/persist`) and carries a
schema `version` + `migrate()` — bump both together whenever the persisted shape changes.

### Resume persistence & sync (`client/features/Resume/useResumeSync.ts`)

- `useResumeStore` holds one "active" resume (`resumeData`, `sectionOrder`, `theme`, `title`)
  plus sync metadata (`remoteResumeId`, `remoteVersion`, `syncStatus`).
- `useResumeSync` (mounted once, globally, in `AppSessionProvider`) hydrates from the server on
  login (default resume, or the first one), autosaves on change with a 1.5s debounce, and does
  a best-effort `sendBeacon` flush on tab close/hide.
- Optimistic concurrency: every `PATCH /api/resumes/:id` must include the `version` it read;
  the server does a compare-and-swap (`updateResumeWithVersionCheck`) and returns 409 with the
  winning row if it lost the race, which the client adopts rather than overwriting.
- `views/ResumeList` is the multi-CV management screen (list/create/rename/duplicate/delete/set
  default), talking to the same `/api/resumes` CRUD API; opening a resume there calls
  `applyServerSnapshot` to swap the active document in the store before navigating to `/builder`.
- Resumes are soft-deleted (`deletedAt`), never hard-deleted, because `EvaluationResult` rows
  reference them and a resume being scored later must not silently disappear.

### Two resume kinds — `Resume.kind` (in progress: the Basic Resume product line)

There are two resume products sharing one `Resume` table, distinguished by `kind`:

- **`FULL`** — the professional two-column resume. `data` holds `ResumeData`. This is the
  original product and everything above describes it.
- **`BASIC`** — the Cambodian short-form CV (ប្រវត្តិរូបសង្ខេប), built by talking to the app.
  `data` holds `BasicResumeData` (`shared/types/basic-resume.ts`) — a different document, not
  a subset: it carries date of birth, nationality, gender, marital status, health and place of
  birth, and omits summary, skills, certifications, publications, volunteering and references.

**Because `data` is an opaque JSON column, `kind` is the only thing that says which shape is
in it — so no resume query may go unqualified.** `findOwnedResume` takes the kind as a
required argument for exactly this reason: a `BASIC` row fed to `useResumeStore` does not fail
at the boundary, it throws deep inside `ResumePreview`. Writes take `kind` as a WHERE-clause
guard, so a PATCH aimed at the wrong product line reads as "no such resume" rather than
landing. `GET /api/resumes?kind=full|basic` defaults to `full`.

Each kind has its own default resume (the partial unique index is scoped by
`(userId, kind)`), its own template, and its own editor. Never route one kind into the other's
editor, and never convert between them.

The basic CV lives at **`/basic-resume`** (`views/BasicResume`, MVVM), with a live preview
and PDF/DOCX export. Two ways in, both writing the same fields:

- **Voice interview** — `POST /api/basic-resume/session` then
  `POST /api/basic-resume/session/[id]/turn`. Gemini STT → extraction → TTS.
- **Typing** — `/api/basic-resume/[id]`, autosaved against the same version check the full
  builder uses.

Typing is never a stopgap the voice flow replaces. It is the accessibility path for deaf and
hard-of-hearing users, the recovery path when a microphone is unavailable, and the correction
path when speech recognition mishears a name — so every question accepts a typed answer,
through the same route.

**The voice pipeline's non-obvious parts, all of which will bite if changed casually:**

- `ai/clients/gemini-voice.ts` uses `@google/genai`, a *second* Gemini SDK, because the legacy
  one cannot request an AUDIO response modality at all. It must NOT route through
  `getGeminiModel` — that gates on the `ChatModel` table and the two voice models are
  deliberately constants (`VOICE_MODEL_IDS`), so it would reject every voice call.
- Gemini TTS returns **headerless PCM**. Unwrapped, browsers play silence with no error.
  `pcmToWav` is the fix and is byte-exact.
- **A model outage must never cost a user their answer.** `extractAnswer` reports
  "unreachable" distinctly from "no answer"; unreachable falls back to recording what was
  actually said, parsed deterministically. Never invent CV content — a fabricated detail on a
  real job application is a serious harm.
- **Never charge for a pipeline that isn't working.** Speaking the first question is the
  liveness check that decides whether to debit. A key being merely *present* is not enough.
- **No audio or transcripts are ever stored or logged**, anywhere. Recordings are biometric
  data with no consent flow, retention policy or deletion path here.
- The caps in `VOICE_INTERVIEW_LIMITS` are the cost control for a single per-session debit, so
  they are enforced server-side before any model call. Raising them changes what one charge
  buys.

Two more conventions worth keeping:
- The interview script's `targetPath` and `promptKey` are **checked types**, not strings — a
  typo'd path or a missing translation is a compile error. This repo has no test framework, so
  that type-level proof is deliberately doing the job a unit test would.
- An empty section is omitted entirely, never rendered as a bare heading. Both the preview and
  the DOCX gate on the single `basicSectionHasContent`, so they cannot disagree.

### Auth

- Custom JWT session (`jose`, HS256) in an httpOnly cookie (`rb_session`), plus optional
  Telegram login. Passwords hashed with `@node-rs/argon2`.
- `src/middleware.ts` runs on the **Edge runtime** — it and everything it imports must avoid
  Prisma or any `server-only` module. It only does a fast-path redirect for protected routes
  (`PROTECTED_PATH_PREFIXES` in `shared/config/auth.ts`) and a UX-only admin-path check from the
  JWT's stale `rol` claim.
- The real authorization gate is always `requireUser()` / `requireAdmin()`
  (`server/modules/auth/guards.ts`), which re-reads the role from Postgres on every call — a
  demoted admin loses access immediately, without waiting for their cookie to expire.
- State-changing routes call `assertSameOrigin(req)` for CSRF protection (checks `Origin`
  against the request's own `Host`/`NEXT_PUBLIC_APP_URL`).

### AI registry (`server/modules/ai/registry`)

`resolveAiRequest()` is the single seam every AI-backed route goes through: it resolves which
`ChatModel` (admin-configurable, DB-backed, with static fallbacks in
`shared/config/constants.ts` for a cold/empty DB) will actually run, and its coin cost via
`ActionCost`, together — so the coin system can never charge for a different model than the
one invoked. Actual provider calls go through `ai/clients/{gemini,openai}.ts`; multi-step flows
(resume parsing, refinement) are orchestrated in `ai/workflows/`.

`AiAction.VOICE_INTERVIEW` (5 coins) is charged **once per interview session**, not per turn,
and is bounded by server-enforced turn/duration/size caps instead. Per-turn billing would make
the price of a CV unpredictable to a user who can re-answer a question.

### Billing / coins

`billing/coinService.ts` does atomic coin debits (`withCoinDeduction`, race-safe — see
`scripts/verify-coin-concurrency.ts`). `billing/paymentService.ts` drives top-up orders through
a provider abstraction (`billing/payments/registry.ts`): Bakong KHQR is the real provider,
`providers/mock` is dev-only (dynamically imported so it never reaches a production bundle; it
throws at load if `NODE_ENV === 'production'`). A Vercel Cron (`vercel.json`,
`/api/cron/payments-reconcile`, guarded by `CRON_SECRET`) reconciles orders that missed a
webhook/status callback.

### i18n

Two dictionaries, `shared/messages/en.ts` (canonical) and `km.ts`, consumed via
`useTranslations(namespace)`. `km.ts` is typed as `const km: typeof en`, so **both files must
always have identical key shapes** — adding a key to one without the other is a compile error.

### Database

Prisma schema is split across multiple files under `prisma/schema/*.prisma` (auth, config,
coin, payments, resume) with `prisma/schema/migrations/`. The generated client lands in
`src/server/db/generated/prisma` (gitignored, regenerated by `postinstall`/`prisma generate`).
Money is stored as integer minor units (see `billing/payments/currency.ts`); resume `data`,
`sectionOrder`, and `theme` are stored as opaque JSON columns (deliberately not normalized —
a resume is only ever read/written whole).

## Conventions

- Import cross-folder via the `@/` alias, never relative `../../`.
- No `any`; no `React.FC`; export named `type`/`interface` for all component props.
- Tailwind utility classes only — no inline `style={}` except for genuinely dynamic values
  (e.g. a user-chosen theme color) that can't be expressed as a class.
- File/folder names: kebab-case. Components/types: PascalCase. Hooks: `useCamelCase`.
