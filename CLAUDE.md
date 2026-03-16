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

## Feature Workflow

When I say "let's work on <feature>", reference a GitHub issue, or ask to start a new feature, follow this phased workflow. **Complete only ONE phase at a time, then STOP and wait for my feedback before proceeding.**

### Phases

**1. UNDERSTAND** — Read the GitHub issue (if referenced). Read all related existing specs (flows, UI, entities). Summarize back to me:
- What the feature is
- What existing specs and code it touches
- Open questions or ambiguities

Ask me to clarify anything. Do NOT write any specs yet.
→ **Stop. Wait for my go-ahead.**

**2. SPEC** — Write or update the relevant specs:
- Flow spec (`specs/flows/`)
- UI spec (`specs/ui/`)
- Entity spec updates (`specs/entities/`) if schema changes are needed
- Cross-reference against ALL existing specs and flag any conflicts or dependencies

Present a summary of what you wrote/changed and what you flagged.
→ **Stop. Wait for my review.** I may ask for changes before approving.

**3. DESIGN** — If the feature has UI, create or update the `.pen` mockup (importing `design-system.pen`). If no UI, tell me and ask if I want to skip to PLAN.
→ **Stop. Wait for my review.**

**4. PLAN** — Write the implementation plan:
- Specific files to create or modify
- Services, components, validators, server actions
- Test plan (what to test, expected coverage)

Save the plan to `specs/plans/<feature-name>.md`. This file is the handoff artifact — it must be self-contained enough that a new conversation can implement it by reading only this file, the specs it references, and CLAUDE.md.

Do NOT start coding.
→ **Stop. Wait for my approval of the plan.**

**5. IMPLEMENT** — Execute the approved plan. Read the plan from `specs/plans/<feature-name>.md` and the specs it references. Write code and tests. Run tests. Report results and coverage.

Note: this phase will typically run in a **new conversation** to maximize available context. When I say "implement the plan for <feature>" or "implement `specs/plans/<feature-name>.md`", read the plan file and execute it.
→ **Stop. Wait for my review.** After reporting, remind me that the next step is `/close`.

**6. CLOSE** — After I approve: close the GitHub issue (if referenced in the plan file) and delete the plan file from `specs/plans/`.

### Issue tracking across conversations

If a feature originates from a GitHub issue, the issue number (e.g. `#42`) must be included at the top of every spec and plan file generated for that feature. This ensures any conversation can trace back to the issue. `/close` reads the issue number from the plan file and closes it. If there is no GitHub issue (feature was described in conversation), omit the reference — all phases work the same.

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
