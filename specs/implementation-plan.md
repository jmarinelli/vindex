# Implementation Plan

*Build order for the Verifier-First MVP.*
*Derived from: specs/architecture.md | docs/prd.md | specs/ui/design-system.md*

---

## Overview

The MVP is built in 14 sub-phases (0, 1, 2, 3A–3D, 4A–4B, 5A–5E). Each sub-phase follows the Spec-Driven Development cycle: write the sub-phase's flow + UI specs → design mockups in Pencil (when applicable) → implement → review against mockups → iterate → commit.

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

- `specs/flows/inspection-creation.md` — full flow: vehicle identification (VIN entry, decode, manual fallback), metadata (type, requested_by, odometer, date), structured form (by template), photo capture, vehicle photos, draft persistence
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

## Phase 3A — Signing Logic

**Goal:** The service layer supports signing inspections: completeness validation, immutability enforcement, and the server action. No UI yet.

### Specs to Write Before Implementation

- `specs/flows/inspection-signing.md` — sign action preconditions, completeness rules, immutability enforcement, slug behavior (already generated at creation), status transition

### What Gets Built

- Signing logic in inspection service: `signInspection` (validates completeness, sets `signed_at` + `signed_by_user_id` + `status = 'signed'`)
- Immutability guard in inspection service: reject any mutation (update/delete) on events where `status = 'signed'`
- Zod validators for sign action input
- Server action for signing (`src/lib/actions/inspection.ts`: `signInspectionAction`)

### Test Plan

- **Signing service:** Integration tests — `signInspection` validates completeness (rejects incomplete), sets `signed_at` to server timestamp, sets `signed_by_user_id`, transitions status to `signed`.
- **Immutability enforcement:** Integration tests — attempt to update a signed event via service → throws error. Attempt to delete → throws error. Attempt to update findings on signed event → throws error.
- **Completeness validation:** Unit tests — event with zero findings fails, event with all items evaluated passes, edge cases (some sections empty).
- **Server action:** Integration test — full round-trip: call action with valid event → returns `{ success: true, data }` with correct DB state. Call with invalid event → returns `{ success: false, error }`.
- **Validators:** Unit tests for sign action input schema.

### Deliverable

```
signInspection(eventId, userId) → transitions draft to signed
Signed event rejects all mutations at service layer
Server action validates input and returns correct shape
npm run test:coverage → ≥ 80% line coverage on Phase 3A code
```

---

## Phase 3B — Review & Sign UI

**Goal:** The inspector can review a summary of their inspection and sign it. After signing, they see a confirmation screen with a shareable link.

### Specs to Write Before Implementation

- `specs/ui/review-sign.md` — Step 4 of inspection flow: summary layout, findings overview by section, status counts, sign button states, confirmation screen, share actions

### What Gets Built

- Review & Sign step in inspection flow (Step 4 at `src/app/dashboard/inspect/[id]/sign/`):
  - Summary view: all findings grouped by section (status icon + observation preview)
  - Status counts bar (good / attention / critical / not evaluated)
  - Photo count summary
  - "Sign Inspection" button (disabled if incomplete, loading state while signing)
- Confirmation screen (post-sign):
  - Success message with verification badge
  - Shareable report URL displayed prominently
  - Copy-to-clipboard button
  - Native share API button (mobile)
- Navigation: from findings form (Step 3) → review (Step 4) → confirmation

### Test Plan

- **Review summary:** Component tests — renders all sections with findings, status counts are correct, incomplete inspection shows warning, sign button disabled when incomplete.
- **Sign interaction:** Component test — sign button calls action, shows loading state, transitions to confirmation on success, shows error toast on failure.
- **Confirmation screen:** Component tests — displays report URL, copy button copies to clipboard, share button triggers native share API (or fallback).
- **Navigation:** Component test — back from review returns to findings, sign success navigates to confirmation.

### Deliverable

```
Inspector completes inspection → taps "Review & Sign"
Sees summary of all findings with status counts
Taps "Sign" → loading → confirmation screen
Confirmation shows shareable link with copy + share buttons
npm run test:coverage → ≥ 80% line coverage on Phase 3B code
```

---

## Phase 3C — Public Report Page

**Goal:** Signed inspections are viewable as a public report page with OG preview for social sharing.

### Specs to Write Before Implementation

- `specs/ui/report-public.md` — public report layout (Shell A), vehicle summary, inspector identity, findings by section, photos, verification badge, OG meta tags, white-label presentation
- `specs/ui/designs/public-report.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Public report page (`src/app/(public)/report/[slug]/`)
  - Vehicle summary card (make, model, year, VIN, plate, odometer)
  - Inspector identity card (name, logo, contact info from Node)
  - Verification badge ("Signed on [date] by [name]. Cannot be modified.")
  - Findings organized by section: items with status icon, observation text, photos
  - General event photos section
  - Links to inspector profile (`/inspector/{slug}`) and vehicle page (`/vehicle/{vin}`)
- Report display components (`src/components/report/`): findings list, status indicators, photo gallery, verification badge, inspector card
- OG image generation (`src/app/api/og/`): dynamic image per report using @vercel/og (vehicle info + inspector name + "Verified Inspection")
- OpenGraph meta tags on report page (`og:title`, `og:description`, `og:image`, `twitter:card`)
- Draft slugs return 404 on the public route

### Test Plan

- **Public report page:** Component tests — renders vehicle summary, inspector identity, verification badge, findings by section, photos. Handles missing optional data gracefully. Draft slug returns 404.
- **Report components:** Component tests — findings list renders all types, status indicators use correct colors, photo gallery displays thumbnails with lightbox, inspector card shows node info.
- **OG image route:** Integration test — returns valid image response with correct content-type (image/png) and dimensions (~1200×630).
- **Meta tags:** Test — report page includes correct `og:title`, `og:description`, `og:image` tags.

### Deliverable

```
Visit /report/{slug} → full public report with findings, photos, inspector identity
"Signed on [date] by [name]. Cannot be modified."
Draft slug → 404
Paste link in WhatsApp/MercadoLibre → professional OG preview renders
npm run test:coverage → ≥ 80% line coverage on Phase 3C code
```

---

## Phase 3D — Vehicle Photos

**Goal:** Promote "general photos" to a first-class "Vehicle Photos" feature with an explicit `photo_type` column, a dedicated section in field mode, a thumbnail preview in review & sign, and a prominent gallery in the public report.

### Specs to Update Before Implementation

- `specs/entities/event-photo.md` — add `photo_type` enum column (done)
- `specs/ui/inspection-form.md` — add dedicated "Fotos del vehículo" collapsible section at the top of field mode (done)
- `specs/ui/review-sign.md` — replace text count with mini thumbnail grid (done)
- `specs/ui/report-public.md` — move vehicle photos gallery to just below Vehicle Summary Card (done)
- `specs/flows/inspection-creation.md` — update references from "general photos" to "vehicle photos" with `photo_type` (done)
- `specs/ui/designs/field-mode.pen` — add vehicle photos section to field mode mockup (done)
- `specs/ui/designs/public-report.pen` — move gallery from bottom to below vehicle summary (done)

### What Gets Built

**Schema change:**

- Add `photo_type` enum (`'finding' | 'vehicle'`) column to `event_photos` table (NOT NULL, no default).
- Migration: backfill existing photos — `finding_id IS NULL → 'vehicle'`, else `'finding'`.
- Update Drizzle schema in `src/db/schema.ts`.

**Service layer:**

- Update all photo queries to filter by `photo_type` instead of `finding_id IS NULL`.
- Update `getPublicReport` to separate photos by `photo_type`.
- Update photo creation in `src/offline/photo-queue.ts` and `src/lib/actions/inspection.ts` to include `photo_type`.

**Field mode (Step 3) — dedicated vehicle photos section:**

- Add a collapsible "Fotos del vehículo" section at the top of the item area, above the first section's items.
- Contains a photo grid (2-column) showing captured vehicle photos with add/remove capability.
- Collapsed by default if no photos; auto-expands when first vehicle photo is captured.
- The bottom bar camera button continues to work as a shortcut — adds a photo and auto-expands the section.
- Remove the old floating "Fotos generales" block that appeared at the bottom of the scrollable area.

**Review & Sign (Step 4A) — thumbnail preview:**

- Replace the "Fotos generales: X fotos" text line with a mini thumbnail grid of vehicle photos.
- Position above the findings sections (after status counts bar).
- Thumbnails are 64x64, 2-column grid, max 6 visible with "+N más" overflow indicator.
- Section hidden if no vehicle photos.

**Public report — vehicle gallery:**

- Move the vehicle photos gallery from the bottom of the page (after findings) to just below the Vehicle Summary Card.
- Rename from "Fotos generales" to "Fotos del vehículo".
- Same grid layout (2-col mobile, 3-col desktop), same lightbox behavior.
- If no vehicle photos, section not rendered (no gap).

**Component updates:**

- Update `src/components/report/general-photos.tsx` → rename to `vehicle-photos.tsx`, update props and semantics.
- Update all `photos.filter(p => !p.findingId)` to `photos.filter(p => p.photoType === 'vehicle')`.
- Update Dexie `DraftPhoto` type in `src/types/inspection.ts` to include `photoType`.

### Test Plan

- **Schema migration:** Integration test — migration adds `photo_type` column, backfill correctly classifies existing photos, NOT NULL constraint enforced after backfill.
- **Validators:** Unit tests — photo creation requires `photo_type`, rejects invalid values, accepts `'finding'` and `'vehicle'`.
- **Service layer:** Integration tests — `getPublicReport` returns photos separated by `photo_type`. Photo creation with explicit `photo_type` persists correctly.
- **Field mode vehicle photos section:** Component tests — section renders collapsed when empty, expands when photos exist, add photo via section button works, add photo via bottom bar camera expands section, remove photo works (draft only), photo grid displays correct thumbnails.
- **Review & Sign thumbnails:** Component tests — thumbnail grid renders vehicle photos, max 6 with overflow count, hidden when 0 photos.
- **Public report gallery:** Component tests — gallery renders below vehicle summary (not at bottom), correct grid columns per viewport, lightbox opens on tap, hidden when 0 photos.
- **Offline:** Unit tests — `DraftPhoto` includes `photoType`, Dexie persistence with `photoType` field, sync sends `photoType` to server.

### Deliverable

```
Schema: photo_type column exists on event_photos, backfilled correctly
Field mode: "Fotos del vehículo" collapsible section at top of item area
Review & Sign: thumbnail grid of vehicle photos above findings
Public report: vehicle gallery below vehicle summary card
All photo queries use photo_type instead of findingId IS NULL
npm run test:coverage → ≥ 80% line coverage on Phase 3D code
```

---

## Phase 4A — Dashboard

**Goal:** The inspector has a functional home screen listing all their inspections with search and filters.

### Specs to Write Before Implementation

- `specs/ui/dashboard.md` — dashboard layout (Shell B), inspection list (drafts + signed), filters, quick actions, empty state
- `specs/ui/designs/dashboard.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Dashboard page (`src/app/dashboard/page.tsx`): replace placeholder with full dashboard
- Inspection list component (`src/components/inspection/inspection-list.tsx`): card per inspection showing vehicle info, date, status badge (draft/signed), odometer, progress indicator
- Search/filter: text input (searches VIN, make, model), status filter (draft/signed/all)
- Quick action: prominent "New Inspection" button
- Secondary links: template editor, public profile
- Empty state: "No inspections yet" with CTA to create first inspection
- Inspection service extension: `getInspectionsForNode` with filter/search params

### Test Plan

- **Inspection service:** Integration tests — `getInspectionsForNode` returns correct list, filters by status, searches by VIN/make/model, handles empty results.
- **Dashboard page:** Component tests — renders inspection list, empty state when no inspections, "New Inspection" button navigates to `/dashboard/inspect`.
- **Inspection list component:** Component tests — card renders draft vs signed correctly (different badges), vehicle info displays, tap navigates to draft edit or signed report.
- **Search/filter:** Component tests — text input filters results, status toggle works, clear filter restores full list.

### Deliverable

```
Inspector logs in → sees dashboard with all inspections
Filters by VIN or status → results update
Taps inspection → opens draft (edit) or signed (report)
Empty state shown when no inspections
npm run test:coverage → ≥ 80% line coverage on Phase 4A code
```

---

## Phase 4B — Inspector Profile

**Goal:** Inspectors have a public professional profile showing their identity, stats, and signed report history.

### Specs to Write Before Implementation

- `specs/ui/inspector-profile.md` — public profile layout (Shell A), inspector identity, stats (inspection count, detail level, operating since), report list, empty states

### What Gets Built

- Inspector profile page (`src/app/(public)/inspector/[slug]/`)
- Profile components:
  - Identity card: name, logo, contact email/phone, bio, brand color accent
  - Stats section: total signed inspections, "inspecting since" date, average detail level (avg photos, avg observations per report)
  - Signed reports list: chronological, each with vehicle summary + date + link to report
- Node service (`src/lib/services/node.ts`): `getNodeProfile(slug)`, `getNodeStats(nodeId)`
- Handles edge cases: zero inspections, missing logo/bio, node not found (404)

### Test Plan

- **Node service:** Integration tests — `getNodeProfile` returns correct node data by slug, returns null for unknown slug. `getNodeStats` calculates inspection count, earliest signed_at, averages correctly. Handles node with zero inspections.
- **Profile page:** Component tests — renders identity card, stats, report list. Missing logo/bio renders gracefully. Unknown slug shows 404.
- **Report list:** Component test — renders signed events newest-first, each links to public report.

### Deliverable

```
Visit /inspector/{slug} → public profile with identity, stats, report list
Profile accessible without auth
Node with zero inspections shows appropriate empty state
npm run test:coverage → ≥ 80% line coverage on Phase 4B code
```

---

## Phase 5A — Vehicle Page

**Goal:** A public page per vehicle showing all signed inspection events as a timeline.

### Specs to Write Before Implementation

- `specs/ui/vehicle-page.md` — vehicle page layout (Shell A), vehicle summary, event timeline, links to individual reports, correction markers
- `specs/ui/designs/vehicle-page.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Vehicle page (`src/app/(public)/vehicle/[vin]/`)
  - Vehicle summary card (VIN, plate, make, model, year, trim)
  - Event timeline: chronological list of signed events (newest first), each showing event type, date, odometer, inspector name (links to profile), link to report
  - Correction markers: original shows "A correction has been issued", correction shows "This corrects [original]"
  - Empty state: VIN found but no signed events
  - 404: VIN not found
- Vehicle timeline component (`src/components/vehicle/vehicle-timeline.tsx`)
- Vehicle service extensions (`src/lib/services/vehicle.ts`): `getVehiclePage(vin)`, `getVehicleEvents(vin)`

### Test Plan

- **Vehicle service:** Integration tests — `getVehiclePage` returns vehicle + signed events with node info. `getVehicleEvents` returns chronological list, filters out drafts. Handles VIN with no events, unknown VIN.
- **Vehicle page:** Component tests — renders vehicle summary, event timeline, links to reports. Empty state when no signed events. 404 for unknown VIN.
- **Timeline component:** Component tests — events in correct order, correction relationships displayed, inspector name links to profile, report link works.

### Deliverable

```
Visit /vehicle/{vin} → vehicle summary + timeline of all signed events
Each event links to its public report
Corrections show relationship to original
npm run test:coverage → ≥ 80% line coverage on Phase 5A code
```

---

## Phase 5B — Reviews

**Goal:** Buyers can leave reviews on inspection reports. Reviews display on the report page and the inspector's profile.

### Specs to Write Before Implementation

- `specs/flows/post-purchase-review.md` — review submission flow: access mechanism, ternary question, comment, spam prevention, display on report and profile
- `specs/ui/designs/reviews.pen` — visual mockup for review form and display (imports `design-system.pen`)

### What Gets Built

- Review service (`src/lib/services/review.ts`): `submitReview`, `getReviewsForEvent`, `getReviewsForNode`
- Zod validators for review submission (match_rating required, comment optional max 500 chars)
- Server action for review submission
- Rate limiting: 1 review per event per IP per 24h
- Review submission form on public report page (below findings, no auth required):
  - Ternary match rating radio group ("Sí" / "Parcialmente" / "No")
  - Optional comment textarea
  - Submit button with loading/success/error states
- Review display on report page: rating distribution bar, recent reviews list
- Review aggregation on inspector profile (extends Phase 4B): total count, match rate, breakdown

### Test Plan

- **Review service:** Integration tests — `submitReview` creates review, rejects duplicate (rate limit), `getReviewsForEvent` returns correct list, `getReviewsForNode` aggregates correctly (count, match rate, breakdown).
- **Validators:** Unit tests — match_rating required, comment max length, edge cases.
- **Server action:** Integration test — valid submission succeeds, rate-limited submission fails, return shape.
- **Review form:** Component tests — renders on report page, validation errors for missing rating, submission flow (loading → success), rate limit error display.
- **Review display:** Component tests — rating distribution bar renders correctly, review list shows newest first, handles zero reviews.
- **Profile aggregation:** Component test — match rate and breakdown display correctly on inspector profile.

### Deliverable

```
On report page → "Dejar una reseña" → submit match rating + comment
Review appears on report page with rating distribution
Review aggregation appears on inspector profile
Rate limiting prevents spam
npm run test:coverage → ≥ 80% line coverage on Phase 5B code
```

---

## Phase 5C — Landing Page

**Goal:** A public landing page that explains the value proposition and captures inspector leads.

### Specs to Write Before Implementation

- `specs/ui/landing.md` — landing page layout, hero, value proposition sections, inspector CTA (contact form or email link), footer
- `specs/ui/designs/landing.pen` — visual mockup (imports `design-system.pen`)

### What Gets Built

- Landing page (`src/app/page.tsx`): replaces placeholder
  - Hero section: tagline, subheading, background image/illustration
  - Value proposition sections: for buyers (transparency), for inspectors (easy tools, professional reports, reputation), how it works (1-2-3 flow)
  - Inspector CTA: "¿Sos inspector? Contactanos" with contact form (name, email, phone, message) or `mailto:` link
  - Footer: privacy, terms, contact links
- Form validation (email required, message required) and submission handling

### Test Plan

- **Landing page:** Component tests — renders hero, value prop sections, CTA section, footer.
- **Contact form:** Component tests — validation (required fields), submission success/error states, form reset after success.

### Deliverable

```
Visit / → landing page with value prop and inspector CTA
Contact form validates and submits
Responsive on mobile and desktop
npm run test:coverage → ≥ 80% line coverage on Phase 5C code
```

---

## Phase 5D — Corrections + Admin

**Goal:** Inspectors can issue corrections to signed reports. Platform admins can manage nodes and users.

### Specs to Write Before Implementation

- `specs/flows/correction-flow.md` — create correction from signed event, relationship display, timeline behavior
- `specs/ui/admin.md` — admin layout (Shell B), node CRUD, user CRUD, basic metrics

### What Gets Built

- Correction flow:
  - "Create Correction" button on signed report (visible to inspector if node member)
  - Creates new draft Event with `correction_of_id = original_event_id`
  - Original report shows "A correction has been issued" notice (extends Phase 3C)
  - Correction report shows "This corrects [original]" notice
  - Server action: `createCorrectionAction`
- Admin pages (`src/app/admin/`):
  - Route protection: `platform_admin` role only
  - Node list + create form (display name, type, contact, logo upload, generates slug)
  - User list + create form (email, name, password, role, link to node)
  - Basic metrics view: total inspections, nodes, users, reviews
- Admin service functions in node and user services

### Test Plan

- **Correction flow:** Integration tests — create correction links original event, correction appears as draft, original shows correction notice, both appear on vehicle timeline after signing.
- **Admin authorization:** Integration tests — non-admin cannot access admin routes/actions, admin can.
- **Node CRUD:** Integration tests — create node generates slug, list returns all nodes, update works.
- **User CRUD:** Integration tests — create user hashes password, creates NodeMember if linked, list returns all users.
- **Admin pages:** Component tests — node list renders, create form validates and submits, user list renders, create form works.
- **Metrics:** Component test — displays correct counts.

### Deliverable

```
Inspector views signed report → "Create Correction" → new draft linked to original
Admin logs in → manages nodes and users
Admin sees basic metrics
npm run test:coverage → ≥ 80% line coverage on Phase 5D code
```

---

## Phase 5E — PWA Finalization

**Goal:** The app is installable as a PWA with proper caching and offline support.

### What Gets Built

- Service worker finalization (`public/sw.js`):
  - App shell caching on install (HTML, CSS, JS bundles, static assets)
  - Stale-while-revalidate strategy for app shell
  - Network-first for API calls with offline queue fallback
- `public/manifest.json` finalization (icons, theme color, display: standalone)
- Offline verification: drafts accessible, signing blocked with clear message
- Add-to-home-screen prompt handling

### Test Plan

- **Manual/E2E testing:** App installs from browser, launches standalone, app shell loads from cache offline, drafts accessible offline, signing shows connectivity required message.
- **Service worker:** If E2E infra ready — automated tests for cache strategies. Otherwise deferred to post-MVP with manual QA checklist.

### Deliverable

```
PWA installable: add to home screen → launches standalone
App shell loads from cache when offline
Drafts accessible offline, signing requires connectivity
npm run test:coverage → ≥ 80% line coverage on Phase 5E code (if applicable)
```

---

## Phase Summary

| Phase | Feature | Specs to Write | Key Deliverable |
|-------|---------|---------------|-----------------|
| 0 | Scaffold | (none) | App runs, auth works, DB has schema |
| 1 | Template Management | flow + UI + `.pen` (3) | Inspector edits their template |
| 2 | Inspection Creation | flow + UI + `.pen` (3) | Inspector fills inspection on mobile, offline |
| 3A | Signing Logic | flow (1) | Service signs inspections, enforces immutability |
| 3B | Review & Sign UI | UI (1) | Inspector reviews summary and signs |
| 3C | Public Report | UI + `.pen` (2) | Shareable verified report with OG preview |
| 3D | Vehicle Photos | (spec updates) | photo_type column, vehicle gallery, dedicated field mode section |
| 4A | Dashboard | UI + `.pen` (2) | Inspector home screen with filters |
| 4B | Inspector Profile | UI (1) | Public professional profile with stats |
| 5A | Vehicle Page | UI + `.pen` (2) | Public vehicle timeline |
| 5B | Reviews | flow + `.pen` (2) | Buyers leave reviews on reports |
| 5C | Landing Page | UI + `.pen` (2) | Value prop + inspector CTA |
| 5D | Corrections + Admin | flow + UI (2) | Correction flow + admin CRUD |
| 5E | PWA Finalization | (none) | Installable PWA with offline support |

---

## Notes

- **Specs are living documents.** If implementation reveals that a flow or schema needs to change, update the relevant spec to reflect reality.
- **Cosmetic/UX tweaks don't need spec updates.** Adjust directly during the REVIEW + ITERATE steps of each phase.
- **Phase boundaries are soft.** If Phase 2 reveals that a template schema change is needed, update the entity spec and the template editor — don't wait for a future phase.
- **Each sub-phase ends with a commit** of working, tested code.
- **Design token changes go to `design-system.pen` first.** If a color, radius, or component changes during implementation, update the `.pen` source of truth. All importing screen mockups inherit the change automatically.
- **`.pen` mockups are reference, not pixel-perfect contracts.** The running app is the final authority. Mockups exist to align on layout, hierarchy, and component usage before coding.
