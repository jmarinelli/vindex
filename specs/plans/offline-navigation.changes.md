# Changes: offline-navigation
GitHub Issue: #18

## SPEC
- Modified `specs/architecture.md` — Updated §4.1 Service Worker: changed navigation strategy from network-only to stale-while-revalidate, listed which pages should be cacheable and why
- Created `specs/flows/offline-navigation.md` — New flow spec defining per-page offline behavior (dashboard read-only mode, Steps 1–2 connectivity messages, Step 3 full offline, sign page read-only from Dexie, generic fallback)
- Modified `specs/ui/dashboard.md` — Added State 5 (Offline): offline banner, Dexie-only draft list, disabled/hidden controls, empty offline state, reconnect behavior. Added offline test cases.
- Modified `specs/ui/inspection-form.md` — Added State 8 (Offline) for Step 1 and State 4 (Offline) for Step 2: connectivity message with "Volver al Dashboard" action. Added offline test cases.
- Modified `specs/ui/review-sign.md` — Replaced State 6 (Offline) with Dexie-based read-only review: vehicle summary, status counts, section groups, and photos all rendered from local data. Sign button disabled with connectivity banner. Added "no local draft" edge case. Added offline test cases.
- Modified `specs/flows/inspection-creation.md` — Updated edge case table: corrected Step 1–2 offline behavior (connectivity message, not queued), added new rows for offline page loads referencing offline-navigation flow spec.

## DESIGN
- Modified `specs/ui/designs/dashboard.pen` — Added "Mobile — Dashboard (Offline)" screen: offline banner (info tint, wifi-off icon), disabled "Nueva Inspección" button (gray), single draft card, no search/filter/quick links
- Modified `specs/ui/designs/field-mode.pen` — Added 3 new screens:
  - "Mobile — Step 1: Offline" — centered connectivity message with wifi-off icon, title, subtitle, "Volver al Dashboard" link
  - "Mobile — Step 2: Offline" — same pattern, shorter subtitle
  - "Mobile — Sign Page: Offline" — read-only review from Dexie: offline banner, vehicle summary card, status counts bar, section header with progress, finding rows with status icons and observations, disabled sign button
