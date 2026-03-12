# VinDex — Verifier-First MVP

## Documentation

- Product requirements: docs/prd.md
- One-pager: docs/one-pager.md
- Validation plan: docs/90-day-plan.md
- Architectural decisions: docs/decisions/

## Specs

- Architecture & conventions: specs/architecture.md
- Build plan: specs/implementation-plan.md
- Entity specs: specs/entities/ (10 entities)
- Flow specs: specs/flows/ (written per phase, before implementation)
- UI specs: specs/ui/ (written per phase, before implementation)
- Design system: specs/ui/design-system.md
- Visual showcase: specs/ui/showcase.html

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

## Stack

Next.js 15 (App Router) · TypeScript (strict) · PostgreSQL 16 · Drizzle ORM · Auth.js v5 · shadcn/ui + Radix UI · Tailwind CSS 4 · Dexie.js · Cloudinary · Vercel · Neon · PostHog

## Current Phase

**Phase 0 — Scaffold** (not started)

Next: Initialize project, install dependencies, create DB schema, seed data, implement auth, create layout shells.

See specs/implementation-plan.md for the full build order.
