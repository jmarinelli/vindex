# Architecture Spec

*Source of truth for stack, structure, and conventions.*
*Derived from: docs/prd.md (Sections 9.1–9.8)*

---

## 1. Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR for OG meta tags, API routes, server actions, PWA-compatible |
| Language | TypeScript (strict mode) | Type safety across full stack |
| Database | PostgreSQL 16 | Relational schema, UUIDs, JSON columns for template snapshots |
| ORM | Drizzle ORM | Type-safe queries, lightweight, explicit SQL, easy migrations |
| Auth | Auth.js (NextAuth v5) | Email + password provider, session management, role-based access |
| UI Components | shadcn/ui + Radix UI | Accessible, composable, customizable components |
| Styling | Tailwind CSS 4 | Utility-first, responsive, consistent with design tokens |
| Local Storage | Dexie.js (IndexedDB wrapper) | Offline-first draft persistence, photo queuing |
| Image Storage | Cloudinary (free tier) | Photo upload, storage, and on-the-fly transformations via URL. No custom resize/compression pipeline needed. |
| Deployment | Vercel | Zero-config Next.js hosting, serverless functions, edge CDN |
| Database Hosting | Neon (via Vercel integration) | Serverless PostgreSQL, optimized latency with Vercel, connection pooling, branching for dev |
| Analytics | PostHog (self-hosted or cloud) | Page views, events, funnels — lightweight, privacy-friendly |

---

## 2. Project Structure

```
vindex/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── docker-compose.yml              # Local PostgreSQL (dev)
├── .env                            # Local environment variables (not committed)
├── .env.example                    # Template for required env vars
│
├── docs/                           # Strategic documentation
│   ├── prd.md
│   ├── one-pager.md
│   ├── 90-day-plan.md
│   └── decisions/
│
├── specs/                          # Executable specs
│   ├── architecture.md             # This file
│   ├── implementation-plan.md
│   ├── entities/
│   ├── flows/
│   └── ui/
│       ├── design-system.md        # Written spec (tokens, patterns, layouts)
│       ├── showcase.html           # HTML visual showcase
│       └── designs/                # Pencil (.pen) visual mockups
│           ├── design-system.pen   # Shared tokens + reusable components
│           └── {phase}.pen         # Per-phase screen mockups (import design-system.pen)
│
├── public/                         # Static assets
│   ├── sw.js                       # Service worker (PWA)
│   └── manifest.json               # Web app manifest (PWA)
│
└── src/
    ├── proxy.ts                    # Route protection (auth redirects, role checks)
    ├── app/                        # Next.js App Router
    │   ├── layout.tsx              # Root layout
    │   ├── page.tsx                # Landing page
    │   ├── (auth)/                 # Auth pages (login, etc.)
    │   │   └── login/
    │   ├── (public)/               # Public pages (no auth)
    │   │   ├── report/[slug]/      # Verified inspection report
    │   │   ├── vehicle/[vin]/      # Vehicle page
    │   │   └── inspector/[slug]/   # Inspector profile
    │   ├── dashboard/              # Authenticated inspector pages
    │   │   ├── page.tsx            # Dashboard home
    │   │   ├── inspect/            # New inspection flow
    │   │   └── template/           # Template editor
    │   ├── admin/                  # Platform admin pages
    │   └── api/                    # API routes (where server actions don't fit)
    │       └── og/                 # Dynamic OG image generation
    │
    ├── components/                 # React components
    │   ├── ui/                     # shadcn/ui base components (managed by CLI)
    │   ├── inspection/             # Inspection-specific components
    │   ├── report/                 # Report display components
    │   ├── template/               # Template editor components
    │   └── layout/                 # Shell layouts (public, dashboard, field)
    │
    ├── lib/                        # Business logic and utilities
    │   ├── services/               # Business logic (framework-agnostic)
    │   │   ├── inspection.ts       # createInspection, signInspection, etc.
    │   │   ├── vehicle.ts          # findOrCreateVehicle, decodeVin, etc.
    │   │   ├── template.ts         # getTemplate, updateTemplate, etc.
    │   │   ├── node.ts             # node management
    │   │   └── review.ts           # review submission and aggregation
    │   ├── actions/                # Next.js server actions (thin wrappers around services)
    │   ├── auth.ts                 # Auth.js configuration
    │   ├── validators.ts           # Zod schemas for input validation
    │   ├── vin.ts                  # VIN validation and decoding
    │   ├── slug.ts                 # Slug generation for public URLs
    │   └── utils.ts                # General utilities
    │
    ├── db/                         # Database layer
    │   ├── schema.ts               # Drizzle schema (all tables)
    │   ├── index.ts                # DB connection and client export
    │   ├── seed.ts                 # Seed script (admin user, test inspector, starter template)
    │   └── migrations/             # Generated by drizzle-kit
    │
    ├── offline/                    # Offline/local-first layer
    │   ├── dexie.ts                # Dexie database definition (IndexedDB schema)
    │   ├── sync.ts                 # Background sync logic (local → server)
    │   ├── photo-queue.ts          # Photo capture, compression, upload queue
    │   └── hooks.ts                # React hooks: useAutoSave, useDraft, useOfflineStatus
    │
    └── types/                      # Shared TypeScript types
        ├── entities.ts             # Types derived from DB schema
        └── inspection.ts           # Inspection-specific types (template, findings, etc.)
```

---

## 3. Conventions

### 3.1 General

- **Server Components by default.** Only add `"use client"` when the component needs browser APIs, event handlers, or React state.
- **Server Actions for mutations.** All data-writing operations (create inspection, sign event, update template) use server actions in `src/lib/actions/`.
- **Services contain business logic.** Server actions are thin wrappers that validate input, call a service function, and return a result. Services are framework-agnostic — they receive typed arguments and return typed results.
- **Zod for all input validation.** Every server action validates input with a Zod schema from `src/lib/validators.ts`. No raw user input reaches a service function.

### 3.2 Database

- **UUIDs as primary keys** for all entities. Generated with `crypto.randomUUID()`.
- **No auto-increment IDs** exposed externally.
- **Timestamps are server-set.** `created_at` and `updated_at` use `defaultNow()` and are never set by client code.
- **Soft deletes only.** No hard deletion of any data. Use a `deleted_at` timestamp where deletion is needed.
- **Immutability enforced at the service layer.** Signed events cannot be updated or deleted via any code path. The service layer rejects mutations on signed events before they reach the database.
- **Drizzle schema is the source of truth.** Types are inferred from the schema using Drizzle's `$inferSelect` and `$inferInsert`.

### 3.3 Naming

- **Files:** kebab-case (`inspection-form.tsx`, `photo-queue.ts`).
- **Components:** PascalCase (`InspectionForm`, `StatusBadge`).
- **Functions and variables:** camelCase (`createInspection`, `signedAt`).
- **Database tables:** snake_case (`inspection_findings`, `event_photos`).
- **Database columns:** snake_case (`signed_by_user_id`, `odometer_km`).
- **Enum values:** snake_case (`pre_purchase`, `not_evaluated`).
- **URL slugs:** generated, URL-safe strings (e.g., `a7x3k9`).

### 3.4 Error Handling

- **Server actions return `{ success, data?, error? }`.** No thrown errors across the server-client boundary.
- **Service functions throw typed errors** for business rule violations (e.g., attempting to edit a signed event). Server actions catch and translate.
- **Client-side errors are handled at the component level.** Toast notifications for transient errors, inline messages for validation errors.

### 3.5 Authentication and Authorization

- **Auth.js with Credentials provider** (email + password). Magic link deferred.
- **Session stored in JWT** (stateless, no session table needed for MVP).
- **Two platform roles:** `user` (inspector) and `platform_admin`.
- **Authorization checks at the server action level.** Every action verifies: (1) user is authenticated, (2) user has the required role, (3) user is a member of the relevant node (for inspector actions).
- **Public pages have no auth checks.** Reports, vehicle pages, and inspector profiles are fully public.

### 3.6 Image Handling

- **Cloudinary for storage and transformations.** Photos are uploaded directly to Cloudinary (unsigned upload preset or signed upload). No presigned URL flow needed — Cloudinary handles upload, storage, CDN, and transformations in one service.
- **On-the-fly responsive variants via URL.** No custom resize pipeline. Serve different sizes by changing URL parameters:
  - Thumbnail: `/w_200,c_fill/photo.jpg`
  - Standard: `/w_800,q_auto/photo.jpg`
  - Full: `/photo.jpg`
- **Client-side compression** before upload. Target: ~500KB–1MB per photo. Use browser canvas API to reduce upload size on mobile.
- **Local-first during inspection.** Photos saved to IndexedDB immediately on capture. Upload to Cloudinary happens in background. The form displays local blobs until remote URLs are available.

---

## 4. PWA Configuration

PWA is a hard requirement (PRD Section 9.1). The inspector must be able to:
- Add the app to their home screen and launch it like a native app.
- Open the app and start an inspection with zero connectivity.
- Never lose data due to browser closure, tab refresh, or device shutdown.

### 4.1 Service Worker

- Caches the application shell (HTML, CSS, JS bundles) for offline access.
- Caches static assets and the inspection form UI.
- Does NOT cache dynamic data (inspection content, photos) — that is handled by IndexedDB via Dexie.
- Strategy: Stale-while-revalidate for app shell, network-first for API calls.

### 4.2 Web App Manifest

- `display: standalone` — no browser chrome.
- App name, icons, theme color aligned with design system.
- `start_url: /dashboard` — launches directly to inspector dashboard.

### 4.3 Offline Data Flow

```
User action (status change, observation text, photo capture)
  → Write to Dexie (IndexedDB) immediately
  → Debounce (500ms for text, immediate for status/photo)
  → Queue sync operation
  → If online: sync to server via server action
  → If offline: queue persists, syncs when connectivity returns
  → Signing requires connectivity (server-authoritative timestamp)
```

---

## 5. Testing

### 5.1 Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration test runner. Fast, native ESM, compatible with Next.js. |
| React Testing Library | Component testing — render, query, interact, assert. |
| MSW (Mock Service Worker) | HTTP-level mocking for API calls and external services (NHTSA, Cloudinary). |
| `@testing-library/user-event` | Realistic user interaction simulation (click, type, drag). |
| `vitest-environment-vprisma` or `pg-mem` | In-memory PostgreSQL for integration tests against Drizzle schema. |

### 5.2 Coverage Target

- **Global minimum: 80% line coverage.** Enforced in CI — builds fail below threshold.
- Coverage is measured per-module. No module may fall below 70%.
- Coverage config lives in `vitest.config.ts` with thresholds set via `coverage.thresholds`.

### 5.3 Test Categories

| Category | Location | What it covers | Speed |
|----------|----------|---------------|-------|
| **Unit** | `__tests__/unit/` or co-located `*.test.ts` | Services, validators, utilities, pure functions | < 1s per file |
| **Integration** | `__tests__/integration/` | Server actions end-to-end (action → service → DB), auth flows, API routes | < 5s per file |
| **Component** | Co-located `*.test.tsx` | React component rendering, interaction, state changes | < 2s per file |

### 5.4 Conventions

- **Co-located component tests.** Component test files live next to the component: `template-editor.tsx` → `template-editor.test.tsx`.
- **Centralized service/action tests.** Under `__tests__/unit/services/` and `__tests__/integration/actions/`.
- **Test file naming:** `{module}.test.ts` or `{module}.test.tsx`.
- **No mocking of internal services in integration tests.** Integration tests exercise the real service → DB path. Only external HTTP calls (NHTSA, Cloudinary) are mocked via MSW.
- **Factory functions for test data.** Shared factories in `__tests__/helpers/factories.ts` — produce valid entities using the same Zod schemas as production code.
- **Each test is independent.** No shared mutable state between tests. Database is reset between integration test suites.
- **Server actions are tested as integration tests.** Call the action function directly, assert on the return value and DB state.
- **Validators are tested as unit tests.** Test valid input, invalid input, and edge cases for every Zod schema.

### 5.5 What to Test per Layer

| Layer | Must test | Not required |
|-------|-----------|-------------|
| **Validators** (`validators.ts`) | Every schema: valid input passes, invalid input fails with correct error | — |
| **Services** (`services/*.ts`) | Business rules, authorization checks, error cases, DB reads/writes | Internal implementation details |
| **Server Actions** (`actions/*.ts`) | Full round-trip: input → validation → service → response shape | — (tested as integration) |
| **Components** | Renders correctly, user interactions trigger expected callbacks/state, error/loading/empty states | Pixel-perfect styling, animation timing |
| **Utilities** (`lib/*.ts`) | All exported functions, edge cases | — |
| **Auth** (`auth.ts`) | Login flow, session creation, role-based access, protected routes redirect | — |
| **DB Schema** | Migrations apply cleanly, seed script runs, constraints enforced | — |

### 5.6 Scripts

```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # Run with coverage report
npm run test:watch        # Watch mode (dev)
```

---

## 6. Environment Variables

```
# Database
DATABASE_URL=postgresql://...      # Neon connection string (auto-set by Vercel integration)

# Auth
AUTH_SECRET=...                    # Auth.js secret
AUTH_URL=http://localhost:3000     # Base URL

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...   # Public: needed client-side for upload widget/URL construction
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=... # Public: unsigned upload preset name
CLOUDINARY_API_KEY=...                   # Server-only: for signed operations
CLOUDINARY_API_SECRET=...                # Server-only: for signed operations

# VIN Decoding
NHTSA_API_URL=https://vpic.nhtsa.dot.gov/api/vehicles

# Analytics (optional in dev)
POSTHOG_KEY=...
POSTHOG_HOST=...
```

---

## 6. Development Setup

```bash
# Clone and install
git clone <repo>
cd vindex
npm install

# Database — local PostgreSQL via Docker
cp .env.example .env          # Default values point to local Docker DB
docker-compose up -d          # Start PostgreSQL 16

# Push schema and seed
npm run db:push               # Create tables
npm run db:seed               # Seed initial data

# Start dev server
npm run dev
```

### Seed Data

The seed script creates:
1. One `platform_admin` user (email: `admin@vindex.app`, password: `admin123`).
2. One inspector node (display name: "Inspector Demo", status: active).
3. One user linked to the inspector node via NodeMember.
4. One starter inspection template with the standard sections (PRD Section 9.9).

---

## 7. Deployment

- **Platform:** Vercel (connected to the GitHub repo).
- **Database:** Neon (via Vercel integration — connection string auto-injected).
- **Image Storage:** Cloudinary (free tier: 25GB storage, 25GB bandwidth/mo).
- **Domain:** TBD. The app must have a clean, short domain for verified report URLs.
- **Environment:** Production env vars set in Vercel dashboard. DATABASE_URL auto-set by Neon integration.

### Deploy pipeline

```
Push to main → Vercel auto-deploys → Preview URL for PRs
```

No CI/CD pipeline beyond Vercel's built-in build step for MVP. Linting and type checking run as part of the build.

---

## 8. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo vs separate API | Monorepo (Next.js fullstack) | Single deploy, single team, no API consumers beyond the web app in Phase 1. Services layer enables extraction later. |
| ORM | Drizzle over Prisma | Lighter, closer to SQL, better TypeScript inference, faster cold starts on serverless. |
| Local-first strategy | Dexie.js (IndexedDB) | Mature, well-documented, handles schema versioning. Required for offline inspection creation. |
| Auth | Auth.js Credentials | Simplest path for email+password. No third-party auth needed in Phase 1. |
| Image storage | Cloudinary over S3/R2 | On-the-fly transformations via URL eliminates custom resize pipeline. Free tier covers MVP volume. Portable if cost becomes an issue later. |
| Database hosting | Neon via Vercel integration | Optimized latency (same network), auto-injected connection string, serverless scaling, free tier covers MVP. |
| OG image generation | Server-rendered at sign time | Satori + @vercel/og or similar. Generated once per report, cached. |
| Analytics | PostHog | Lightweight, open source option available, event tracking + page views in one tool. |
