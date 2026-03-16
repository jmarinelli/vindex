# VinDex — Verifier-First MVP

## Documentation

- Product requirements: docs/prd.md
- One-pager: docs/one-pager.md
- Validation plan: docs/90-day-validation-plan.md
- Architectural decisions: docs/decisions/

## Specs

- Architecture & conventions: specs/architecture.md
- Build plan: specs/implementation-plan.md
- Entity specs: specs/entities/ (10 entities)
- Flow specs: specs/flows/ (written per phase, before implementation)
- UI specs: specs/ui/ (written per phase, before implementation)
- Design system: specs/ui/design-system.md
- Visual showcase: specs/ui/showcase.html
- Design mockups: specs/ui/designs/*.pen (Pencil files, per phase)

## Conventions

From specs/architecture.md — follow these strictly:

### General
- Server Components by default. Only `"use client"` when the component needs browser APIs, event handlers, or React state.
- Server Actions for mutations, in `src/lib/actions/`. Thin wrappers around services.
- Business logic lives in `src/lib/services/` — framework-agnostic, typed args and returns.
- Zod validation on all server action inputs via `src/lib/validators.ts`.

### Database
- UUIDs as primary keys (`crypto.randomUUID()`).
- Timestamps are server-set. Never set `created_at` or `updated_at` from client code.
- Soft deletes only (`deleted_at` timestamp).
- Signed events are immutable — reject mutations at the service layer before they reach the DB.
- Drizzle schema is source of truth. Types inferred via `$inferSelect` / `$inferInsert`.

### Naming
- Files: kebab-case (`inspection-form.tsx`)
- Components: PascalCase (`InspectionForm`)
- Functions/variables: camelCase (`createInspection`)
- DB tables: snake_case (`inspection_findings`)
- DB columns: snake_case (`signed_by_user_id`)
- Enum values: snake_case (`pre_purchase`)

### Error Handling
- Server actions return `{ success, data?, error? }`. No thrown errors across server-client boundary.
- Service functions throw typed errors for business rule violations.
- Client-side: toast for transient errors, inline for validation errors.

### Auth
- Auth.js with Credentials provider (email + password).
- JWT sessions (stateless).
- Two roles: `user` (inspector) and `platform_admin`.
- Authorization checks at server action level: authenticated → has role → is node member.
- Public pages (report, vehicle, inspector profile) have no auth checks.

### Images
- Cloudinary for storage and on-the-fly transformations via URL params.
- Client-side compression before upload (~500KB–1MB target).
- Photos saved to IndexedDB first during inspection, uploaded in background.

### PWA
- Service worker caches app shell (stale-while-revalidate).
- Dexie.js (IndexedDB) for offline draft persistence and photo queuing.
- Signing requires connectivity. Everything else works offline.

### Testing
- Vitest + React Testing Library + MSW. See `specs/architecture.md §5` for full details.
- Coverage target: ≥ 80% line coverage globally, ≥ 70% per module.
- Co-located component tests (`*.test.tsx`), centralized service/action tests under `__tests__/`.
- No mocking internal services in integration tests — only mock external HTTP (MSW).
- Factory functions for test data in `__tests__/helpers/factories.ts`.
- Every phase must meet coverage before completion.

### Design Mockups (.pen files)
- `specs/ui/designs/design-system.pen` is the visual source of truth. It defines design tokens as variables and reusable components (buttons, status buttons, cards, inputs, badges, tabs, etc.).
- Screen mockups (one `.pen` per phase) import `design-system.pen` so all tokens and components propagate automatically.
- Per-phase workflow: write flow spec (.md) → write UI spec (.md) → design in Pencil (.pen) → implement → review against mockup.
- If a design token or component changes, update `design-system.pen` first — changes propagate to all importing files.

## Stack

Next.js 15 (App Router) · TypeScript (strict) · PostgreSQL 16 · Drizzle ORM · Auth.js v5 · shadcn/ui + Radix UI · Tailwind CSS 4 · Dexie.js · Cloudinary · Vercel · Neon · PostHog

## Backlog

GitHub Project: https://github.com/users/jmarinelli/projects/2

All planned work lives as GitHub Issues in this project. Do not maintain a backlog in the codebase.

## Quick Fix

Use `/fix` for small, well-scoped changes that don't require spec updates (bug fixes, copy changes, small UI tweaks). `/fix` reads the issue/description, proposes the change, waits for confirmation, implements, and suggests a commit. No specs, plans, or changes files. If the change turns out to be complex, `/fix` will suggest switching to the full workflow.

## Feature Workflow

When I say "let's work on <feature>", reference a GitHub issue, or ask to start a new feature, follow the phased workflow defined in `.claude/commands/`. **Complete only ONE phase at a time, then STOP and wait for my feedback before proceeding.**

When advancing to the next phase — whether via a slash command or a natural language prompt like "ok", "dale", "next" — always read and follow the corresponding command file in `.claude/commands/` for detailed instructions.

Phases in order:
1. `/understand` — Analyze the feature, summarize, ask questions
2. `/spec` — Write or update specs (flow, UI, entity)
3. `/design` — Create or update visual mockups (skip if no UI)
4. `/plan` — Write implementation plan to `specs/plans/<feature-name>.md`
5. `/implement` — Execute the plan (typically in a new conversation)
6. `/close` — Close GitHub issue (if applicable), delete plan file

### Issue tracking across conversations

If a feature originates from a GitHub issue, the issue number (e.g. `#42`) is tracked in the **changes file** (`specs/plans/<feature-name>.changes.md`) and the **plan file** (`specs/plans/<feature-name>.md`). Do NOT add issue references to spec files — specs are permanent documents that outlive any single issue. `/close` reads the issue number from the plan file and closes it. If there is no GitHub issue (feature was described in conversation), omit the reference — all phases work the same.

### Entering mid-workflow

If I say "implement `specs/plans/<name>.md`" or reference an existing plan file, you are entering at phase 5 (IMPLEMENT). After implementation is approved, proceed to phase 6 (CLOSE) — remind me that closing is the next step.

The existence of a file in `specs/plans/` means that feature is in-progress. Phases 1–4 were completed in a prior conversation.

### Rules
- Never skip a phase or combine phases.
- Never start coding before PLAN is approved.
- If I say "go back to SPEC" or "redo the plan", do it.
- If I say "just do it" or "run it all", you may execute remaining phases without stopping — but ONLY if I explicitly say so.
- Keep phase outputs concise. I'll ask for detail if I need it.
- PLAN is the natural handoff point between conversations. Always save the plan to disk.

## Current Phase

**Phase 5E — PWA Finalization** (not started)

Phases 0–5D are complete. Next: finalize service worker caching, manifest, offline support, and add-to-home-screen prompt.

See specs/implementation-plan.md for the full build order.
