# UI Spec: Review & Sign

*Screen specification for the inspection review summary and signing flow (Step 4).*
*Derived from: specs/flows/inspection-signing.md | specs/ui/design-system.md | specs/entities/event.md | specs/entities/inspection-finding.md | specs/entities/event-photo.md | specs/entities/inspection-detail.md*

---

## Overview

Step 4 of the inspection flow. After the inspector finishes filling findings in Field Mode (Step 3), they review a summary of all findings grouped by section, see status counts, and sign the inspection. After signing, a confirmation screen shows the shareable report link. Uses **Shell B** (Dashboard) for the review layout — the inspector is no longer in field mode.

---

## Step 4A: Review Summary

**Route:** `/dashboard/inspect/[id]/sign`
**Shell:** B (Dashboard)

### Shell B Context

- **Top bar (64px):** Logo (left) · "Revisar Inspección" (center) · User menu (right).
- **Content area:** max-width `768px`, centered. Background `gray-50`.

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Volver a inspección]    Revisar Inspección           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🚗 Nissan Sentra 2019 — AC123BD                │    │
│  │    VIN: 3N1AB7AP5KY250312                       │    │
│  │    Tipo: Pre-compra · Solicitada por: Comprador │    │
│  │    Kilometraje: 87.500 km · Fecha: 13/03/2026   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Status Counts Bar                              │    │
│  │  [■■■■■■ 12 Bien] [■■ 3 Att] [■ 1 Crit] [■ 2 N/E] │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ⚠ 2 items sin evaluar                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📷 Fotos del vehículo (4)                     │    │
│  │  [thumb] [thumb] [thumb] [thumb]               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── Exterior ──────────────────────────── 4/4 ✓ ──     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✓ Carrocería y pintura                          │    │
│  │   "Rayón en puerta trasera derecha" · 2 fotos   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ✓ Vidrios y espejos                             │    │
│  │   Sin observación · 0 fotos                     │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ⚠ Luces y ópticas                              │    │
│  │   "Óptica delantera derecha empañada" · 1 foto  │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ✓ Neumáticos y llantas                          │    │
│  │   Sin observación · 0 fotos                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── Motor ─────────────────────────────── 3/3 ✓ ──     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ...                                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [           Firmar Inspección           ]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Vehicle Summary Card (Top)

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Static, read-only |
| Vehicle icon | Car emoji or icon, `text-2xl` | Left of vehicle name |
| Vehicle name | `text-lg`, `font-medium`, `gray-800` | "{Make} {Model} {Year} — {Plate}" |
| VIN | `text-sm`, `gray-500`, monospace | Full VIN |
| Metadata row 1 | `text-sm`, `gray-600` | "Tipo: {inspection_type} · Solicitada por: {requested_by}" |
| Metadata row 2 | `text-sm`, `gray-600` | "Kilometraje: {odometer} km · Fecha: {event_date}" |

### Status Counts Bar

A horizontal bar showing the distribution of finding statuses across the entire inspection.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `border-default`, `radius-md`, `space-4` padding | Full-width card |
| Segmented bar | 8px height, `radius-full`, composed of colored segments | Proportional width per status. Colors: `status-good`, `status-attention`, `status-critical`, `status-not-evaluated` |
| Count labels | `text-sm`, below bar, spaced evenly | Each shows icon + count + label. E.g., "✓ 12 Bien", "⚠ 3 Atención", "✕ 1 Crítico", "— 2 N/E" |

### Incomplete Warning

Shown only when there are `not_evaluated` checklist items remaining.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `warning` bg tint, `radius-sm`, `space-3` padding, full-width | Visible only when incomplete |
| Icon | ⚠ warning icon, `warning` color | Left of text |
| Text | `text-sm`, `font-medium`, `warning` color | "{n} items sin evaluar" |

### Section Groups

Findings grouped by template section, in template order.

#### Section Header

| Element | Style | Behavior |
|---------|-------|----------|
| Section name | `text-base`, `font-medium`, `gray-800` | Left-aligned |
| Progress indicator | `text-sm`, `gray-500` | "{evaluated}/{total}" — right-aligned |
| Completion checkmark | `success` color, `text-sm`, "✓" | Shown only when all checklist items in section are evaluated |
| Separator | 1px `gray-200` line, full-width | Above section header |

#### Finding Row

Each finding is a compact row within the section card.

| Element | Style | Behavior |
|---------|-------|----------|
| Row container | `white` bg, `space-3` padding, `border-default` bottom (except last) | Full-width, within section card |
| Status icon | 16x16, status color | ✓ (good), ⚠ (attention), ✕ (critical), — (not evaluated). For free text: ✎ icon, `gray-500` |
| Item name | `text-sm`, `font-medium`, `gray-800` | Truncated with ellipsis if long |
| Observation preview | `text-xs`, `gray-500`, single line, truncated | Shows first ~60 chars of observation. "Sin observación" if empty. |
| Photo count | `text-xs`, `gray-400` | "· {n} fotos" (omitted if 0) |
| Tap target | Entire row | Tapping navigates back to Field Mode at this specific item's section (allows quick edit) |

### Vehicle Photos Preview

A mini thumbnail grid showing the vehicle photos that will appear in the public report. Positioned **above the findings sections** (after status counts bar) to mirror the report layout. Photos are filtered by `photo_type = 'vehicle'`.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Above section groups, below status counts bar |
| Header row | `text-sm`, `font-medium`, `gray-700`, with 📷 camera icon | "Fotos del vehículo ({n})" |
| Thumbnail grid | Horizontal wrap, `space-2` gap, max 6 visible | 64x64 thumbnails, `radius-sm`, `border-default`, `object-fit: cover` |
| Overflow indicator | `text-xs`, `gray-500`, after last visible thumbnail | "+{n} más" when > 6 photos |
| Empty state | Hidden entirely | If no vehicle photos, section not rendered |

### Sign Button

| Element | Style | Behavior |
|---------|-------|----------|
| Button | Full-width primary button, 48px height, `radius-sm` | Fixed at bottom on mobile |
| Label (ready) | "Firmar Inspección" | Enabled when all checklist items evaluated |
| Label (incomplete) | "Firmar Inspección" | Disabled: `gray-100` bg, `gray-400` text |
| Label (signing) | Spinner + "Firmando..." | During server action call |
| Error state | Button re-enabled | Toast: "Error al firmar. Intentá de nuevo." |

### Connectivity Requirement

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `info` bg tint, `radius-sm`, `space-3` padding | Shown when offline |
| Icon | Cloud-off icon, `info` color | Left of text |
| Text | `text-sm`, `info` color | "Se requiere conexión para firmar" |
| Sign button | Disabled | Cannot sign while offline |

### Pending Photo Uploads

Shown when there are photos in Dexie with `uploaded = false`. Pending uploads **block signing** because signed events are immutable and cannot accept new photo records after the fact.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `warning` bg tint, `radius-sm`, `space-3` padding | Shown when pendingCount > 0 |
| Icon (uploading) | Upload-cloud icon + spinner, `warning` color | When uploads are in progress |
| Icon (failed) | Alert-triangle icon, `error` color | When uploads have failed |
| Text (uploading) | `text-sm`, `warning` color | "Subiendo {n} foto(s)... Esperá a que termine la subida para firmar." |
| Text (failed) | `text-sm`, `error` color | "Hay {n} foto(s) que no se pudieron subir. Reintentá la subida o eliminá las fotos para continuar." |
| Text (offline + pending) | `text-sm`, `info` color | "Se requiere conexión para subir fotos y firmar." |
| Retry button | `text-sm`, underlined, `brand-accent` | "Reintentar subida" — shown only when failedCount > 0. Triggers `retryFailed()`. |
| Sign button | Disabled | Cannot sign while uploads are pending or failed |

---

## Step 4B: Confirmation Screen

**Route:** `/dashboard/inspect/[id]/signed` (redirected after successful signing)
**Shell:** B (Dashboard)

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Inspección Firmada                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                       ✓                                 │
│              Inspección firmada                         │
│                                                         │
│  Firmada el 13/03/2026 a las 14:32                     │
│  por Juan Pérez                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔗 Enlace al reporte                           │    │
│  │                                                 │    │
│  │ https://vindex.app/report/a8k3m9x2             │    │
│  │                                                 │    │
│  │ [📋 Copiar enlace]  [📤 Compartir]             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🚗 Nissan Sentra 2019                          │    │
│  │    VIN: 3N1AB7AP5KY250312                       │    │
│  │    ✓ 12 Bien · ⚠ 3 Atención · ✕ 1 Crítico    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [        Ver Reporte Público        ]                  │
│  [        Volver al Dashboard        ]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Success Badge

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Centered, `space-6` vertical padding | Top of content area |
| Checkmark circle | 64x64, `success` bg, white ✓ icon, `radius-full` | Prominent visual confirmation |
| Title | `text-2xl`, `font-bold`, `gray-800` | "Inspección firmada" |
| Timestamp | `text-sm`, `gray-500` | "Firmada el {date} a las {time}" |
| Signed by | `text-sm`, `gray-500` | "por {user_name}" |

### Report Link Card

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Prominent display |
| Label | `text-sm`, `font-medium`, `gray-700`, with link icon | "Enlace al reporte" |
| URL text | `text-base`, `font-mono`, `brand-accent`, selectable | Full report URL, text-wrap |
| Copy button | Secondary button, 40px height, icon + "Copiar enlace" | Copies URL to clipboard. Label changes to "Copiado ✓" for 2s. |
| Share button | Secondary button, 40px height, icon + "Compartir" | Triggers `navigator.share()` on mobile. Hidden on desktop if Web Share API not available. |
| Button row | Horizontal, `space-3` gap, centered | Both buttons side by side |

### Vehicle Summary (Compact)

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `gray-50` bg, `border-default`, `radius-md`, `space-3` padding | Compact summary |
| Vehicle name | `text-base`, `font-medium`, `gray-800` | "{Make} {Model} {Year}" |
| VIN | `text-xs`, `gray-500`, monospace | Full VIN |
| Status summary | `text-sm`, `gray-600` | Inline: "✓ {n} Bien · ⚠ {n} Atención · ✕ {n} Crítico" with status colors |

### Navigation Buttons

| Element | Style | Behavior |
|---------|-------|----------|
| "Ver Reporte Público" | Full-width primary button, 48px height | Opens `/report/{slug}` in new tab |
| "Volver al Dashboard" | Full-width ghost button, 48px height, `gray-600` | Navigates to `/dashboard` |
| Gap | `space-3` between buttons | Vertical stack |

---

## Mobile Layout (< 640px)

### Step 4A (Review)

1. **Back link:** left-aligned in top bar, "← Volver".
2. **Sign button:** fixed full-width at bottom (56px, `shadow-top`, `white` bg, `space-4` padding). Removed from inline flow.
3. **Content area:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
4. **Finding rows:** observation preview truncated to ~40 chars on narrow screens.
5. **Status counts bar:** labels wrap to 2x2 grid below the bar if width < 360px.

### Step 4B (Confirmation)

1. **Success badge:** checkmark circle scales to 56x56.
2. **Share button:** prominent (full-width) since mobile is the primary share use case.
3. **Copy button:** full-width below share button.
4. **Button stack:** all buttons full-width, vertical stack.

---

## Desktop Layout (> 1024px)

### Step 4A (Review)

- Content centered, max-width `768px`.
- Cards have `space-6` internal padding.
- Sign button inline (not fixed at bottom).
- Finding rows show longer observation previews (~100 chars).
- Status counts bar labels displayed in a single row.

### Step 4B (Confirmation)

- Content centered, max-width `600px`.
- Copy and Share buttons side by side, not full-width.
- "Ver Reporte Público" and "Volver al Dashboard" side by side.

---

## States

### Step 4A States

#### 1. Loading

- Shell B with skeleton placeholders:
  - Vehicle summary card skeleton (200px wide name, 2 lines of metadata).
  - Status counts bar skeleton (segmented bar placeholder).
  - 3 skeleton section groups with 3 rows each.

#### 2. Complete (Ready to Sign)

- All checklist items have status ≠ `not_evaluated`.
- No incomplete warning shown.
- All section headers show completion checkmark.
- Sign button enabled with primary style.

#### 3. Incomplete (Not Ready to Sign)

- Some checklist items still `not_evaluated`.
- Incomplete warning banner visible: "⚠ {n} items sin evaluar".
- Affected section headers show progress without checkmark.
- Sign button disabled with gray style.
- Tapping a finding row with `not_evaluated` status navigates back to Field Mode at that section for quick editing.

#### 4. Signing (In Progress)

- Sign button shows spinner + "Firmando...".
- All interactions disabled (no navigation away).
- Dismissing or navigating back is blocked during signing.

#### 5. Sign Error

- Toast: "Error al firmar. Intentá de nuevo." with `error` color, manual dismiss.
- Sign button re-enabled.
- Inspector can retry or navigate back to edit.

#### 6. Offline

When offline, the review page renders using data from Dexie instead of the server.

- **Data source:** Vehicle summary from `drafts` table. Findings from `findings` table, grouped by sectionId using the template snapshot. Photos from `photos` table (local blob thumbnails).
- **Status counts bar:** computed from local findings data.
- **Section groups and finding rows:** rendered identically to the online version.
- **Vehicle photos preview:** rendered from local photo blobs.
- **Connectivity banner:**

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `status-attention-bg` bg, `radius-sm`, `space-3` padding, full-width | Shown when offline, above vehicle summary card |
| Icon | Cloud-off icon, `warning` color | Left of text |
| Text | `text-sm`, `font-medium`, `warning` color | "Sin conexión — se requiere conexión para firmar" |

- **Sign button:** disabled.
- **Finding row taps:** still work — navigate back to Field Mode at that section for editing.
- **Online detection:** banner disappears, sign button re-enables (if all preconditions met), data can refresh from server.

**Edge case — No local draft:**
- If Dexie has no draft for this event ID (deep link to an inspection never opened locally):

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Centered, `space-6` vertical padding | Replaces review content |
| Icon | Cloud-off, 48x48, `gray-400` | Visual indicator |
| Title | `text-lg`, `font-medium`, `gray-700` | "Inspección no disponible offline" |
| Subtitle | `text-sm`, `gray-500` | "Esta inspección no está guardada en este dispositivo." |
| Action | Ghost button, `brand-primary` text | "Volver al Dashboard" → navigates to `/dashboard` |

#### 7. Pending Photo Uploads

- Upload progress banner visible (warning style).
- Sign button disabled.
- Message: "Subiendo {n} foto(s)... Esperá a que termine la subida para firmar."
- When all uploads complete: banner disappears, sign button enabled (if also online and complete).

#### 8. Failed Photo Uploads

- Error banner visible with retry action.
- Sign button disabled.
- Message: "Hay {n} foto(s) que no se pudieron subir. Reintentá la subida o eliminá las fotos para continuar."
- "Reintentar subida" link triggers retry of all failed photos.
- Inspector can also go back to Field Mode and delete the failed photos.

### Step 4B States

#### 1. Success (Default)

- Full confirmation screen visible.
- Report link displayed and actionable.

#### 2. Copy Success

- Copy button label changes to "Copiado ✓" for 2s, then reverts.
- No toast needed (inline feedback sufficient).

#### 3. Share Triggered

- Native share sheet opens (mobile).
- On desktop without Web Share API: share button hidden, only copy available.

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | Sign button, View Report button |
| Button (Secondary) | shadcn/ui `Button variant="secondary"` | Copy, Share buttons |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Back link, Dashboard button |
| Card | shadcn/ui `Card` | Vehicle summary, report link, status counts, section containers |
| Badge | shadcn/ui `Badge` | Status count labels |
| Toast | shadcn/ui `Sonner` / toast | Sign error |
| Skeleton | shadcn/ui `Skeleton` | Loading state |
| Alert | Custom banner | Incomplete warning, offline warning |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-900`, `status-good`, `status-good-bg`, `status-attention`, `status-attention-bg`, `status-critical`, `status-critical-bg`, `status-not-evaluated`, `status-not-evaluated-bg`, `success`, `warning`, `error`, `info`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200), `border-focus` (2px solid brand-accent)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards), `shadow-top` (mobile fixed bar)
- **Touch targets:** 48x48px minimum interactive

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Navigate back | Tap "← Volver a inspección" | Returns to Field Mode (Step 3) at last active section |
| Tap finding row | Tap any finding row | Navigates to Field Mode at that finding's section for quick editing |
| Sign inspection | Tap "Firmar Inspección" | Validates completeness → calls `signInspectionAction` → on success redirects to confirmation |
| Copy report link | Tap "Copiar enlace" | Copies URL to clipboard, button shows "Copiado ✓" for 2s |
| Share report link | Tap "Compartir" | Triggers `navigator.share({ url, title })` on mobile |
| View public report | Tap "Ver Reporte Público" | Opens `/report/{slug}` in new tab |
| Return to dashboard | Tap "Volver al Dashboard" | Navigates to `/dashboard` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render for vehicle card, status bar, section groups |
| **Vehicle summary** | Renders make/model/year/plate, VIN, inspection type, requested by, odometer, date |
| **Status counts bar** | Correct counts per status · Segmented bar proportional widths · Labels show correct numbers |
| **Incomplete warning** | Shown when not_evaluated items exist · Hidden when all evaluated · Shows correct count |
| **Section headers** | Render in template order · Show progress "{n}/{total}" · Show ✓ when complete |
| **Finding rows** | Status icon correct per status · Item name displayed · Observation preview truncated · Photo count shown · Free text items show ✎ icon |
| **Finding row tap** | Navigates to Field Mode at correct section |
| **Vehicle photos preview** | Thumbnail grid renders vehicle photos · Max 6 thumbnails with "+N más" overflow · Hidden when 0 photos · Positioned above findings sections |
| **Sign button (ready)** | Enabled when all checklist items evaluated · Calls signInspectionAction on tap |
| **Sign button (incomplete)** | Disabled when not_evaluated items remain · Gray styling |
| **Sign button (signing)** | Shows spinner + "Firmando..." · Disabled during signing |
| **Sign error** | Toast shown · Button re-enabled |
| **Offline state** | Connectivity banner shown · Review content rendered from Dexie (vehicle summary, status counts, section groups, photos) · Sign button disabled · Finding row taps navigate to field mode |
| **Offline — no local draft** | Error state shown: "Inspección no disponible offline" · "Volver al Dashboard" navigates correctly |
| **Offline → online** | Banner disappears · Sign button re-enables · Data refreshes from server |
| **Confirmation screen** | Checkmark badge · Signed timestamp · Signed by name |
| **Report link** | URL displayed · Selectable text |
| **Copy button** | Copies to clipboard · Label changes to "Copiado ✓" · Reverts after 2s |
| **Share button** | Calls navigator.share on mobile · Hidden on desktop without Web Share API |
| **View Report button** | Opens report URL in new tab |
| **Dashboard button** | Navigates to /dashboard |
| **Mobile layout** | Sign button fixed at bottom · Content full-width |

---

## Accessibility

- All interactive elements meet 48x48px touch targets on mobile.
- Finding rows have `role="link"` with descriptive `aria-label` ("Carrocería y pintura: Bien, con observación").
- Status icons have `aria-label` alternatives (not just color/emoji).
- Sign button has `aria-disabled="true"` when incomplete (not just visual disable).
- Status counts bar segments have `aria-label` per segment.
- Copy button announces "Enlace copiado" via `aria-live="polite"` region.
- Report URL is selectable via keyboard.
- Offline warning has `role="alert"`.
- Focus management: auto-focus on sign button when all items complete. After signing, focus moves to confirmation content.
- Keyboard navigation: Tab through finding rows, Enter to navigate, Tab to sign button.
- Color is not the only indicator: status icons include text labels and distinct shapes alongside color.
