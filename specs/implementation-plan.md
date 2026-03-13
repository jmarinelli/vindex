# Implementation Plan

*Build order for the Verifier-First MVP.*
*Derived from: specs/architecture.md | docs/prd.md | specs/ui/design-system.md*

---

## Overview

The MVP is built in 6 phases (0–5). Each phase follows the Spec-Driven Development cycle: write the phase's flow + UI specs → design mockups in Pencil → implement → review against mockups → iterate → commit.

Entity specs (`specs/entities/`) and the design system (`specs/ui/design-system.md`) are already written. Flow specs, UI specs, and `.pen` mockups are written just before the phase that needs them.

### Design Workflow

Each phase that includes UI work follows this sequence:

1. **Write flow spec** (`.md` in `specs/flows/`) — describes the user flow
2. **Write UI spec** (`.md` in `specs/ui/`) — describes screens, states, and behavior
3. **Design in Pencil** (`.pen` in `specs/ui/designs/`) — visual mockup importing `design-system.pen` for shared tokens and reusable components
4. **Implement** — using the `.pen` as visual reference and the `.md` as functional spec
5. **Test** — write unit, integration, and component tests per `specs/architecture.md §5`. Phase is not complete until coverage ≥ 80%.
6. **Review** — compare the running app against the `.pen` mockup for fidelity

`specs/ui/designs/design-system.pen` is the shared component library. It defines all design tokens as variables and reusable components (buttons, status buttons, form inputs, cards, badges, tabs, sync indicator). Screen `.pen` files import it so that token or component changes propagate automatically.

### Testing Requirements

Every phase must include tests that achieve **≥ 80% line coverage** on all code introduced in that phase. Tests follow the conventions in `specs/architecture.md §5`:

- **Validators:** Unit tests for every Zod schema (valid, invalid, edge cases).
- **Services:** Unit/integration tests for business rules, authorization, error cases, DB operations.
- **Server Actions:** Integration tests — call the action, assert return shape and DB state.
- **Components:** Component tests for rendering, interactions, and all states (loading, error, empty, success).
- **Utilities:** Unit tests for all exported functions.

Each phase's spec sections include a **Test Plan** listing what must be tested. The phase is not complete until tests pass and coverage meets the threshold.

---

## Phase 0 — Scaffold

**Goal:** The app runs locally. Auth works. Database has the full schema. Seed data exists.

### Specs Required Before Implementation

None — this phase uses existing Foundation specs:
- `specs/architecture.md` — stack, project structure, conventions, env vars, dev setup
- `specs/entities/*.md` — all 10 entity specs define the DB schema

### What Gets Built

- Initialize Next.js 15 project with App Router, TypeScript strict mode
- Install and configure: Tailwind CSS 4, shadcn/ui, Drizzle ORM, Auth.js v5, Dexie.js
- Configure `drizzle.config.ts`, `tailwind.config.ts`, `next.config.ts`
- Create `.env.example` with all required env vars (per architecture.md §5)
- Create `public/manifest.json` and placeholder `public/sw.js` (PWA shell)
- Implement Drizzle schema (`src/db/schema.ts`) for all 10 entities
- Run `drizzle-kit push` to create the database
- Implement seed script (`src/db/seed.ts`): admin user, demo inspector node + user + node member, starter inspection template (per PRD §9.9)
- Implement Auth.js with Credentials provider (`src/lib/auth.ts`)
- Create root layout with design system tokens in Tailwind config (colors, spacing, typography, shadows, radii from `specs/ui/design-system.md`)
- Create the 3 layout shells as components: Public (Shell A), Dashboard (Shell B), Field Mode (Shell C)
- Create login page (`src/app/(auth)/login/`)
- Create placeholder dashboard page (`src/app/dashboard/page.tsx`) — shows "Welcome, {name}" after login
- Set up route protection proxy (redirect unauthenticated users to login)

### Test Plan

- **Validators:** Unit tests for all Zod schemas in `validators.ts` (login input, template structure, etc.).
- **Auth service:** Integration tests — login with valid credentials succeeds, invalid credentials fail, session contains correct role.
- **DB schema:** Integration test — seed script runs cleanly, all tables exist, constraints enforced (unique email, non-null fields).
- **Route protection (proxy):** Integration tests — unauthenticated requests redirect to `/login`, authenticated requests pass through, role-based access works.
- **Layout shells:** Component tests — Shell A, Shell B, Shell C render correctly, Shell B shows user info from session.
- **Login page:** Component test — form renders, validation errors shown for empty fields, successful login redirects to dashboard.

### Deliverable

```
npm run dev → app starts
Login with admin@vindex.app / admin123 → dashboard loads
Database has all tables with correct schema
Layout shells render correctly on mobile and desktop
npm run test:coverage → ≥ 80% line coverage on Phase 0 code
```

---

## Phase 1 — Template Management

**Goal:** The inspector can view and customize their inspection template.

### Specs to Write Before Implementation

- `specs/flows/template-management.md` — full flow: view template, add/remove/reorder sections, add/remove/reorder items, change item types, save
- `specs/ui/template-editor.md` — screen layout, drag-and-drop patterns, mobile behavior, states (empty, editing, saving)
- `specs/ui/designs/template-editor.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Template service (`src/lib/services/template.ts`): getTemplate, updateTemplate
- Server actions for template CRUD (`src/lib/actions/template.ts`)
- Zod validators for template mutations
- Template editor page (`src/app/dashboard/template/`)
- Template editor components (`src/components/template/`): section list, item list, add/remove/reorder controls, item type selector
- Mobile-friendly drag-and-drop or move-up/move-down for reordering

### Test Plan

- **Validators:** Unit tests for template mutation Zod schemas — valid template structure, missing fields, empty names, invalid item types, malformed UUIDs.
- **Template service:** Integration tests — `getTemplate` returns correct data for node, `updateTemplate` persists changes, authorization (non-member cannot update), rejects invalid structures.
- **Server actions:** Integration tests — `updateTemplate` action validates input, calls service, returns `{ success, data?, error? }` shape.
- **Template editor page:** Component tests — renders loading skeleton, renders sections/items from data, inline editing works (click → input → blur), add/delete section, add/delete item, reorder triggers correct state changes, save button states (enabled/disabled/saving), validation errors shown.
- **Inline edit component:** Component test — click activates edit mode, Enter confirms, Escape cancels, empty revert + toast.
- **Section/Item reorder:** Component test — move up/down buttons work, boundary disable logic.

### Deliverable

```
Inspector logs in → navigates to Template Editor
Views starter template with all sections and items
Adds a new section, reorders items, changes an item type
Saves → reloads → changes persist
npm run test:coverage → ≥ 80% line coverage on Phase 1 code
```

---

## Phase 2 — Inspection Creation

**Goal:** The inspector can create an inspection on mobile, fill findings in the field, with offline support and auto-save.

### Specs to Write Before Implementation

- `specs/flows/inspection-creation.md` — full flow: vehicle identification (VIN entry, decode, manual fallback), metadata (type, requested_by, odometer, date), structured form (by template), photo capture, general photos, draft persistence
- `specs/ui/inspection-form.md` — field mode layout (Shell C), section tabs, item cards (checklist + free text), status buttons, photo thumbnails, bottom bar, sync indicator, all states
- `specs/ui/designs/field-mode.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Vehicle service (`src/lib/services/vehicle.ts`): findOrCreateVehicle, decodeVin (NHTSA API)
- Inspection service (`src/lib/services/inspection.ts`): createInspection, updateDraft, getDraft
- VIN validation and decoding utility (`src/lib/vin.ts`)
- Server actions for inspection creation and draft sync
- Zod validators for vehicle entry, inspection metadata, findings
- Dexie database definition (`src/offline/dexie.ts`): draft inspections, findings, photo queue
- Auto-save hooks (`src/offline/hooks.ts`): useAutoSave, useDraft, useOfflineStatus
- Photo capture and local queuing (`src/offline/photo-queue.ts`)
- Background sync logic (`src/offline/sync.ts`)
- New inspection flow pages (`src/app/dashboard/inspect/`)
  - Step 1: Vehicle Identification
  - Step 2: Inspection Metadata
  - Step 3: Findings Form (field mode — Shell C)
- Inspection components (`src/components/inspection/`): status buttons, item cards (checklist + free text), section tabs, photo capture, sync indicator
- Cloudinary upload integration (client-side compression + upload)

### Test Plan

- **Validators:** Unit tests for vehicle entry, inspection metadata, findings Zod schemas.
- **VIN utility:** Unit tests — valid VINs pass, invalid VINs fail, check digit validation, NHTSA decode response parsing.
- **Vehicle service:** Integration tests — `findOrCreateVehicle` creates new or returns existing, `decodeVin` handles API success/failure (MSW mocked).
- **Inspection service:** Integration tests — `createInspection` with valid data, draft CRUD, authorization checks.
- **Server actions:** Integration tests for inspection creation and draft sync actions.
- **Dexie/offline layer:** Unit tests — draft persistence, photo queue operations, sync queue logic.
- **Auto-save hooks:** Component tests — `useAutoSave` debounces correctly, `useDraft` loads/saves, `useOfflineStatus` reflects connectivity.
- **Inspection form components:** Component tests — status buttons toggle, item cards render by type, section tabs navigate, photo capture triggers queue, sync indicator states.
- **New inspection flow:** Component tests — Step 1 (VIN entry + decode), Step 2 (metadata form), Step 3 (findings form renders from template).

### Deliverable

```
Inspector taps "New Inspection" → enters VIN → VIN decodes
Selects metadata → form renders from template
Fills items: tap status, write observation, take photo
Closes browser mid-inspection → reopens → draft intact
Works offline (airplane mode) → syncs when back online
Photos appear immediately (local blob), upload in background
npm run test:coverage → ≥ 80% line coverage on Phase 2 code
```

---

## Phase 3 — Signing + Report

**Goal:** The inspector signs an inspection and gets a shareable verified report link. The report renders publicly with OG preview.

### Specs to Write Before Implementation

- `specs/flows/inspection-signing.md` — review summary, sign action, immutability enforcement, slug generation, confirmation + share screen
- `specs/ui/report-public.md` — public report layout (Shell A), vehicle summary, inspector identity, findings by section, photos, verification badge, OG meta tags, white-label presentation
- `specs/ui/designs/public-report.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Signing logic in inspection service: signInspection (validates completeness, sets signed_at, generates slug, enforces immutability)
- Slug generation utility (`src/lib/slug.ts`)
- Server action for signing
- Review & Sign step in inspection flow (Step 4): summary view of all findings, sign button, confirmation screen with shareable link
- Public report page (`src/app/(public)/report/[slug]/`)
- Report display components (`src/components/report/`): findings list, status indicators, photo gallery, verification badge, inspector card
- OG image generation (`src/app/api/og/`): dynamic image per report using Satori / @vercel/og
- OpenGraph meta tags on report page
- Share actions: copy link, native share API (mobile)

### Test Plan

- **Signing service:** Integration tests — `signInspection` validates completeness, sets `signed_at`, generates slug, enforces immutability (reject update on signed event), incomplete inspection cannot be signed.
- **Slug utility:** Unit tests — generates URL-safe strings, uniqueness, correct length.
- **Server action for signing:** Integration test — full round-trip, return shape, DB state after sign.
- **Review & Sign step:** Component tests — summary renders all findings, sign button triggers action, confirmation screen shows link, share actions work.
- **Public report page:** Component tests — renders vehicle summary, inspector identity, findings by section, photos, verification badge. Handles missing data gracefully.
- **OG image route:** Integration test — returns valid image response with correct content-type and dimensions.
- **Immutability enforcement:** Integration test — attempt to update a signed event via service and action, verify rejection.

### Deliverable

```
Inspector completes inspection → reviews summary → taps "Sign"
Gets confirmation with shareable link
Link opens publicly: full report with findings, photos, inspector identity
"Signed on [date] by [name]. Cannot be modified."
Paste link in WhatsApp → professional OG preview renders
Paste in MercadoLibre → preview card with vehicle photo and summary
npm run test:coverage → ≥ 80% line coverage on Phase 3 code
```

---

## Phase 4 — Dashboard + Profile

**Goal:** The inspector has a functional home screen and a public professional profile.

### Specs to Write Before Implementation

- `specs/ui/dashboard.md` — dashboard layout (Shell B), inspection list (drafts + signed), filters, quick actions, empty state
- `specs/ui/inspector-profile.md` — public profile layout (Shell A), inspector identity, stats (inspection count, detail level, operating since), review aggregation, report list
- `specs/ui/designs/dashboard.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Dashboard page (`src/app/dashboard/page.tsx`): replace placeholder with full dashboard
- Inspection list component: card per inspection (draft/signed badge, vehicle info, date, progress)
- Search/filter: by VIN, date, status (draft/signed)
- Quick action: "New Inspection" prominent button
- Links to: template editor, public profile
- Inspector profile page (`src/app/(public)/inspector/[slug]/`)
- Profile components: identity card (name, logo, contact, bio), stats (inspection count, average detail level, inspecting since), review summary (aggregated match ratings), list of signed reports
- Node service (`src/lib/services/node.ts`): getNodeProfile, getNodeStats

### Test Plan

- **Node service:** Integration tests — `getNodeProfile` returns correct data, `getNodeStats` calculates counts/averages correctly, handles node with zero inspections.
- **Dashboard page:** Component tests — renders inspection list, filters work (VIN, date, status), empty state shown when no inspections, "New Inspection" button navigates correctly.
- **Inspection list component:** Component tests — card renders draft vs signed correctly, badge styling, vehicle info display.
- **Inspector profile page:** Component tests — renders identity card, stats, review summary, report list. Handles missing/empty data.
- **Search/filter:** Component tests — input triggers filter, results update, clear filter resets list.

### Deliverable

```
Inspector logs in → sees dashboard with all inspections
Filters by VIN or status → results update
Taps inspection → opens draft (edit) or signed (report)
Visits their public profile → sees stats and report list
Public profile accessible without auth at /inspector/{slug}
npm run test:coverage → ≥ 80% line coverage on Phase 4 code
```

---

## Phase 5 — Vehicle Page + Reviews + Landing

**Goal:** Complete MVP. Vehicle page aggregates events. Buyers can leave reviews. Landing page captures inspector leads.

### Specs to Write Before Implementation

- `specs/flows/post-purchase-review.md` — review submission flow: access mechanism, ternary question, comment, spam prevention, display on report and profile
- `specs/ui/vehicle-page.md` — vehicle page layout (Shell A), vehicle summary, event timeline, links to individual reports
- `specs/ui/landing.md` — landing page layout, value proposition, inspector CTA (contact form/email link)
- `specs/ui/designs/public-pages.pen` — visual mockup for vehicle page + landing (imports `design-system.pen`)

### What Gets Built

- Vehicle page (`src/app/(public)/vehicle/[vin]/`)
- Vehicle timeline component: chronological list of signed events, each with type label, date, odometer, inspector name, link to report
- Vehicle service extensions: getVehiclePage, getVehicleEvents
- Review submission form on report page (no auth required)
- Review service (`src/lib/services/review.ts`): submitReview, getReviewsForEvent, getReviewsForNode
- Lightweight spam prevention (rate limiting + review token)
- Review display on report page and inspector profile
- Landing page (`src/app/page.tsx`): value proposition, "Are you an inspector?" CTA with contact form or email link
- Correction flow: "Create Correction" from dashboard on signed events, links original and correction
- Admin pages (`src/app/admin/`): node list + create, user list + create, basic metrics view
- Service worker finalization (`public/sw.js`): app shell caching, stale-while-revalidate strategy

### Test Plan

- **Vehicle service extensions:** Integration tests — `getVehiclePage` returns vehicle + events, `getVehicleEvents` returns chronological list, handles VIN with no events.
- **Review service:** Integration tests — `submitReview` creates review, rate limiting enforced, `getReviewsForEvent` and `getReviewsForNode` aggregate correctly.
- **Vehicle page:** Component tests — renders vehicle summary, event timeline, links to reports, empty state.
- **Review form:** Component tests — renders on report page, validation (required fields), submission, success/error states.
- **Landing page:** Component tests — renders value proposition, CTA form works, form submission.
- **Correction flow:** Integration tests — create correction links original event, correction appears in timeline.
- **Admin pages:** Component tests — node list renders, create node form works, user list renders, create user form works.
- **Service worker:** Manual or E2E — app shell cached, offline access works (deferred to post-MVP if E2E infra not ready).

### Deliverable

```
Visit /vehicle/{vin} → see all signed events for that VIN as timeline
On report page → "Leave a review" → submit match rating + comment
Review appears on report and on inspector profile
Landing page explains value prop, inspector CTA works
Admin can create nodes and users
PWA installable: add to home screen, launches standalone
Full MVP complete — ready for beta inspector onboarding
npm run test:coverage → ≥ 80% line coverage on all code
```

---

## Phase Summary

| Phase | Feature | Specs to Write | .pen Mockup | Key Deliverable |
|-------|---------|---------------|-------------|-----------------|
| 0 | Scaffold | (none) | `design-system.pen` (done) | App runs, auth works, DB has schema |
| 1 | Template Management | flow + UI (2 specs) | `template-editor.pen` | Inspector edits their template |
| 2 | Inspection Creation | flow + UI (2 specs) | `field-mode.pen` | Inspector fills inspection on mobile, offline |
| 3 | Signing + Report | flow + UI (2 specs) | `public-report.pen` | Inspector signs, gets shareable verified link |
| 4 | Dashboard + Profile | UI × 2 (2 specs) | `dashboard.pen` | Inspector has home screen + public identity |
| 5 | Vehicle Page + Reviews + Landing | flow + UI × 3 (4 specs) | `public-pages.pen` | Complete MVP |

---

## Notes

- **Specs are living documents.** If implementation reveals that a flow or schema needs to change, update the relevant spec to reflect reality.
- **Cosmetic/UX tweaks don't need spec updates.** Adjust directly during the REVIEW + ITERATE steps of each phase.
- **Phase boundaries are soft.** If Phase 2 reveals that a template schema change is needed, update the entity spec and the template editor — don't wait for a future phase.
- **Each phase ends with a commit** of working, tested code.
- **Design token changes go to `design-system.pen` first.** If a color, radius, or component changes during implementation, update the `.pen` source of truth. All importing screen mockups inherit the change automatically.
- **`.pen` mockups are reference, not pixel-perfect contracts.** The running app is the final authority. Mockups exist to align on layout, hierarchy, and component usage before coding.
