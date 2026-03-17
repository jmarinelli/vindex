# Plan: offline-navigation

GitHub Issue: #18

## Overview

Implements offline navigation support so the app renders in-app screens (instead of the raw offline fallback) when the user refreshes or navigates directly to a URL without connectivity. Based on `specs/flows/offline-navigation.md`, plus offline states defined in `specs/ui/dashboard.md`, `specs/ui/inspection-form.md`, and `specs/ui/review-sign.md`.

The core infrastructure (Dexie, sync worker, `useOfflineStatus` hook, photo upload) is already complete. The remaining work is:
1. Update the service worker to use **stale-while-revalidate** for navigation requests (so cached HTML is served offline).
2. Add offline awareness to **Dashboard**, **Step 1 (VIN entry)**, and **Step 2 (Metadata)** pages.
3. Add the **"no local draft" offline error state** to the **Sign page**.

## References

- Flow spec: `specs/flows/offline-navigation.md`
- UI spec (dashboard): `specs/ui/dashboard.md` — State 5 (Offline)
- UI spec (inspection form): `specs/ui/inspection-form.md` — Step 1 State 8, Step 2 State 4
- UI spec (review & sign): `specs/ui/review-sign.md` — State 6 (Offline, no local draft edge case)
- Architecture: `specs/architecture.md` — §4.1 Service Worker, §4.3 Offline Data Flow
- Design mockup: `specs/ui/designs/dashboard.pen`, `specs/ui/designs/field-mode.pen`

## Changes

### Service Worker

**File:** `public/sw.js`

- Change navigation request strategy from **network-only with offline fallback** to **stale-while-revalidate with offline fallback**.
- On first visit: cache the HTML response after serving it.
- On subsequent visits: serve cached version immediately, fetch fresh copy in background and update cache.
- When offline: serve cached version. If no cached version, serve `/offline.html`.
- Bump `CACHE_NAME` to `vindex-v6`.

### Components / UI

#### 1. Shared Offline Connectivity Message Component

**File:** `src/components/offline/connectivity-message.tsx` (new)

A reusable component for pages that require connectivity. Used by Step 1 and Step 2 offline states.

- Props: `title: string`, `subtitle: string`, `backHref?: string` (defaults to `/dashboard`), `backLabel?: string` (defaults to "Volver al Dashboard")
- Renders: centered layout with CloudOff icon (48x48, gray-400), title, subtitle, ghost button link.

#### 2. Dashboard — Offline Mode

**File:** `src/app/dashboard/page.tsx`

- Import `useOfflineStatus` from `@/offline/hooks`.
- Import Dexie `getAllDrafts` helper (needs to be created).
- When offline:
  - Skip server fetch. Load drafts from Dexie instead.
  - Show offline banner: amber bg, cloud-off icon, "Sin conexión — solo se muestran borradores locales".
  - Render draft cards from Dexie data (map `DraftInspection` → `InspectionListItem`-compatible shape).
  - Disable "Nueva Inspección" button (gray bg, gray text, no link behavior).
  - Hide search input, status filter pills, quick links section.
  - If no Dexie drafts: show empty offline state (cloud-off icon, "No hay borradores locales", "Conectate a internet para ver tus inspecciones.").
- When connectivity restores: re-fetch from server, remove banner, re-enable all controls.

#### 3. Dexie Helper — Get All Drafts

**File:** `src/offline/dexie.ts` (modify)

- Add `getAllDrafts()` function: returns all drafts from Dexie `drafts` table, ordered by `updatedAt` descending.
- Add `getDraftFindings(eventId: string)` if not already exported — needed for dashboard draft card progress counts.

#### 4. Step 1 (VIN Entry) — Offline State

**File:** `src/app/dashboard/inspect/page.tsx`

- Import `useOfflineStatus` and `ConnectivityMessage` component.
- When offline: replace the entire form with `<ConnectivityMessage>`:
  - Title: "Se requiere conexión"
  - Subtitle: "La creación de inspecciones necesita conexión a internet para buscar vehículos."
- When connectivity restores: render the form normally.

#### 5. Step 2 (Metadata) — Offline State

**File:** `src/app/dashboard/inspect/metadata/page.tsx`

- Import `useOfflineStatus` and `ConnectivityMessage` component.
- When offline: replace the entire form with `<ConnectivityMessage>`:
  - Title: "Se requiere conexión"
  - Subtitle: "La creación de inspecciones necesita conexión a internet."
- When connectivity restores: render the form normally.

#### 6. Sign Page — Offline No-Draft State

**File:** `src/app/dashboard/inspect/[id]/sign/page.tsx`

- Current behavior: when the server fetch fails (offline), it shows a toast and redirects to dashboard. This is incorrect.
- New behavior:
  - If offline AND `draft` is null (no local data): show "Inspección no disponible offline" error state with "Volver al Dashboard" action. Use `ConnectivityMessage` component.
  - If offline AND `draft` exists: render review from Dexie data (vehicle summary from draft, findings from Dexie `findings` table, photos from Dexie). The current page already partially supports this via the `useDraft` hook, but the data loading path needs to handle the offline+draft case without depending on the server fetch succeeding.
  - Refactor the `useEffect` load function: attempt server fetch; if it fails AND we're offline AND have a draft, populate state from Dexie data instead of redirecting.

#### 7. Sign Page — Offline Review from Dexie

**File:** `src/app/dashboard/inspect/[id]/sign/page.tsx` (same file)

- When offline with a local draft:
  - Vehicle summary: from `draft.vehicleName` (already parsed), construct a mock vehicle/event/detail object or render directly from draft fields.
  - Findings: load from `getFindingsByEvent(eventId)` in Dexie.
  - Template snapshot: from `draft.templateSnapshot`.
  - Show the offline connectivity banner (already exists).
  - Sign button disabled (already exists).
- This is the most complex part of the plan. The existing page expects server types (`Vehicle`, `Event`, `InspectionDetail`). Two approaches:
  - **Option A (recommended):** Create a unified data shape (`ReviewData`) that can be populated from either server or Dexie, and refactor the page to use that. -> User: Go with Option A
  - **Option B:** Construct fake server-typed objects from Dexie data. Simpler but brittle.

### Other Changes

#### `public/offline.html` — No Changes

Already exists as generic fallback. No modifications needed.

## Test Plan

### Service Worker
- Navigation responses are cached after first visit.
- Cached HTML served when offline.
- Stale-while-revalidate: serves cached, updates in background.
- Uncached pages fall back to `/offline.html`.

### Dashboard Offline
- Offline banner shown when `navigator.onLine === false`.
- Only Dexie drafts displayed (no server fetch).
- Draft cards tappable (navigate to field mode).
- "Nueva Inspección" button disabled (gray, not a link).
- Search/filter hidden.
- Quick links hidden.
- Signed inspections not shown.
- Empty offline state: "No hay borradores locales" when Dexie empty.
- Reconnect: banner disappears, server data loads, all controls re-enabled.

### VIN Entry Offline
- Connectivity message shown with correct title/subtitle.
- "Volver al Dashboard" ghost button navigates correctly.
- Reconnect renders the VIN entry form.

### Metadata Offline
- Connectivity message shown with correct title/subtitle.
- "Volver al Dashboard" ghost button navigates correctly.
- Reconnect renders the metadata form.

### Sign Page Offline
- With local draft: review renders from Dexie (vehicle summary, status counts, section groups, photos).
- Connectivity banner shown.
- Sign button disabled.
- Finding row taps navigate to field mode.
- Without local draft: "Inspección no disponible offline" error state shown.
- "Volver al Dashboard" navigates correctly.
- Reconnect: banner disappears, sign button re-enables, data refreshes.

### Components
- `ConnectivityMessage` renders icon, title, subtitle, back button.
- Back button navigates to the correct href.

Coverage target: ≥ 80% line coverage for new/modified files.

## Execution Order

1. **Service Worker update** — Change `public/sw.js` navigation strategy to stale-while-revalidate. Bump cache version.
2. **ConnectivityMessage component** — Create reusable offline message component.
3. **Dexie helper** — Add `getAllDrafts()` to `src/offline/dexie.ts`.
4. **Step 1 offline** — Add offline check to VIN entry page.
5. **Step 2 offline** — Add offline check to metadata page.
6. **Dashboard offline** — Add offline mode to dashboard (Dexie fallback, banner, disabled controls, empty state).
7. **Sign page offline** — Refactor data loading to support Dexie fallback; add no-draft error state.
8. **Tests** — Component tests for `ConnectivityMessage`, dashboard offline states, Step 1/2 offline, sign page offline states.
