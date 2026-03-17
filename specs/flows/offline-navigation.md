# Flow: Offline Navigation

*Describes how the app handles page loads and navigation when the device has no network connectivity.*
*Derived from: specs/architecture.md §4 | specs/flows/inspection-creation.md | specs/ui/dashboard.md | specs/ui/inspection-form.md | specs/ui/review-sign.md*

---

## Overview

When an inspector loses connectivity and refreshes the browser or navigates to a URL directly, the service worker serves cached HTML so the React app can mount. Each page then determines what to show based on the data available in Dexie (IndexedDB). This flow defines the per-page offline behavior.

---

## Prerequisites

- The service worker is installed and active.
- The page has been visited at least once while online (HTML cached by SW via stale-while-revalidate).
- If the page has never been visited, the SW falls back to `/offline.html` (generic offline page with retry button).

---

## Actors

- **Inspector** — the authenticated user attempting to use the app offline.
- **Service Worker** — serves cached HTML for navigation requests.
- **Dexie (IndexedDB)** — provides local data for draft inspections.

---

## Per-Page Behavior

### `/dashboard` — Read-Only Offline Mode

**Precondition:** Page HTML cached by SW.

**Steps:**

1. SW serves cached HTML. React mounts.
2. The app detects offline status via `useOfflineStatus()`.
3. An offline banner is displayed at the top of the page: "Sin conexión — solo se muestran borradores locales."
4. The inspection list is populated from Dexie drafts only (no server fetch).
   - Draft cards with local data are tappable (navigate to field mode).
   - Signed inspection cards are NOT shown (data is server-only).
5. The following elements are disabled:
   - "Nueva Inspección" button — disabled with tooltip/label: "Requiere conexión".
   - Search input — hidden (local data set is small).
   - Status filter pills — hidden.
   - Quick links (template editor, public profile) — hidden.
6. When connectivity is restored, the page transitions back to normal mode:
   - Offline banner disappears.
   - Full server data loads.
   - All controls re-enabled.

**Business Rules:**
- Only drafts present in Dexie are shown. If Dexie has no drafts, the empty state reads: "No hay borradores locales. Conectate a internet para ver tus inspecciones."
- The dashboard never attempts a server fetch while offline — it reads Dexie immediately.

---

### `/dashboard/inspect` (Step 1 — VIN Entry) — Connectivity Required

**Precondition:** Page HTML cached by SW.

**Steps:**

1. SW serves cached HTML. React mounts.
2. The app detects offline status.
3. Instead of the VIN entry form, a connectivity message is displayed:
   - Icon: cloud-off, `gray-400`.
   - Title: "Se requiere conexión".
   - Subtitle: "La creación de inspecciones necesita conexión a internet para buscar vehículos."
   - Action: "Volver al Dashboard" ghost button → navigates to `/dashboard`.
4. When connectivity is restored, the form renders normally.

**Business Rules:**
- VIN lookup and vehicle creation require server connectivity. No offline fallback for this page.

---

### `/dashboard/inspect/metadata` (Step 2 — Metadata) — Connectivity Required

**Precondition:** Page HTML cached by SW.

**Steps:**

1. Same as Step 1: show connectivity message.
   - Subtitle: "La creación de inspecciones necesita conexión a internet."
   - Action: "Volver al Dashboard" ghost button → navigates to `/dashboard`.

**Business Rules:**
- Inspection creation (event + findings seeding) requires server connectivity.

---

### `/dashboard/inspect/[id]` (Step 3 — Field Mode) — Full Offline Mode

**Precondition:** Page HTML cached by SW. Draft exists in Dexie for this event ID.

**Steps:**

1. SW serves cached HTML. React mounts.
2. `useDraft(eventId)` loads draft metadata from Dexie.
3. `getFindingsByEvent(eventId)` loads findings from Dexie.
4. Field mode renders normally. All interactions work (status changes, observations, photos).
5. Sync indicator shows "Sin conexión". Changes saved locally.
6. When connectivity is restored, sync resumes automatically.

**Edge case — No local draft:**
- If `useDraft` returns null (draft not in Dexie, e.g., deep link to an inspection that was never opened locally), show an error state:
  - Title: "Inspección no disponible offline".
  - Subtitle: "Esta inspección no está guardada en este dispositivo."
  - Action: "Volver al Dashboard" ghost button.

**Business Rules:**
- This page is already fully local-first. The only change is that the SW now caches the HTML so the page can load offline.

---

### `/dashboard/inspect/[id]/sign` (Review & Sign) — Read-Only Offline Mode

**Precondition:** Page HTML cached by SW. Draft exists in Dexie for this event ID.

**Steps:**

1. SW serves cached HTML. React mounts.
2. The app detects offline status via `useOfflineStatus()`.
3. The review summary renders using data from Dexie:
   - Vehicle summary card — from `drafts` table (vehicleName, inspectionType, requestedBy, odometerKm, eventDate).
   - Status counts bar — computed from `findings` table.
   - Section groups with finding rows — from `findings` table, grouped by sectionId using the template snapshot from the draft.
   - Vehicle photos preview — from `photos` table (thumbnails from local blobs).
4. A connectivity banner is shown: "Sin conexión — se requiere conexión para firmar."
5. The sign button is disabled.
6. Finding row taps still work — navigate back to field mode for editing.
7. When connectivity is restored:
   - Banner disappears.
   - Sign button re-enables (if all preconditions met).
   - Data can optionally refresh from the server to pick up any server-side changes.

**Edge case — No local draft:**
- Same as field mode: show "Inspección no disponible offline" error state with "Volver al Dashboard" action.

**Business Rules:**
- The review page reuses the same Dexie data-loading pattern as the dashboard (offline fallback from server to Dexie).
- The review content is read-only — the inspector can review their work but cannot sign until connectivity is restored.
- Signing requires connectivity because `signed_at` must be server-authoritative.

---

### `/offline.html` — Generic Fallback

**Precondition:** Page has never been visited (no cached HTML).

**Steps:**

1. SW cannot find a cached response for the navigation request.
2. SW serves the precached `/offline.html`.
3. Page shows: "Sin conexión" title, message, and retry button.
4. Retry button calls `location.reload()`.

---

## Postconditions

- No data is lost. All local changes persist in Dexie regardless of connectivity.
- The inspector can always continue editing an in-progress inspection offline (as long as the field mode page was visited at least once).
- The inspector can review their findings on the sign page offline (read-only, signing disabled).
- Pages that require connectivity show clear, in-app messages instead of the raw offline fallback.

---

## Test Plan

| Scenario | Cases |
|----------|-------|
| **SW caching** | Navigation responses are cached after first visit · Cached HTML served when offline · Uncached pages fall back to `/offline.html` |
| **Dashboard offline** | Offline banner shown · Only Dexie drafts displayed · "Nueva Inspección" disabled · Search/filter hidden · Quick links hidden · Reconnect restores full UI |
| **Dashboard offline — no drafts** | Empty state message: "No hay borradores locales..." |
| **VIN entry offline** | Connectivity message shown · "Volver al Dashboard" navigates correctly · Reconnect renders form |
| **Metadata offline** | Connectivity message shown · "Volver al Dashboard" navigates correctly · Reconnect renders form |
| **Field mode offline** | Full functionality · Sync indicator shows offline · Draft loads from Dexie · Findings load from Dexie |
| **Field mode offline — no local draft** | Error state shown · "Volver al Dashboard" navigates correctly |
| **Sign page offline** | Review summary renders from Dexie · Vehicle summary, status counts, section groups, photos all visible · Connectivity banner shown · Sign button disabled · Finding row taps navigate to field mode · Reconnect enables signing |
| **Sign page offline — no local draft** | Error state shown · "Volver al Dashboard" navigates correctly |
| **Generic fallback** | `/offline.html` rendered for uncached pages · Retry button reloads |
