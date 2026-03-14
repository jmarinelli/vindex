# UI Spec: Vehicle Page

*Screen specification for the public vehicle page — vehicle summary and signed event timeline.*
*Derived from: specs/implementation-plan.md (Phase 5A) | specs/ui/design-system.md | specs/entities/vehicle.md | specs/entities/event.md | specs/entities/node.md | specs/entities/inspection-detail.md*

---

## Overview

Single page at `/vehicle/{vin}` using **Shell A** (Public). Displays the vehicle's identity (VIN, make, model, year, trim, plate) and a chronological timeline of all signed inspection events. Each event links to its public report. Correction relationships are visually indicated. Accessible without authentication.

---

## Route & Shell

**Route:** `/vehicle/[vin]`
**Shell:** A (Public)

### Shell A Context

- **Top bar:** Minimal. VinDex logo (left, small, links to `/`). No auth controls.
- **Content area:** max-width `768px`, centered, `white` background on cards, `gray-50` page background.
- **Footer:** Minimal — "Verificado por VinDex" · Privacidad · Términos links.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  VinDex                                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🚗 Nissan Sentra 2019 SR                          │  │
│  │    VIN: 3N1AB7AP5KY250312                          │  │
│  │    Patente: AC123BD                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Historial de inspecciones (3)                     │  │
│  │                                                    │  │
│  │        ●  13/03/2026                               │  │
│  │        │                                           │  │
│  │  ┌─────┴──────────────────────────────────────┐   │  │
│  │  │ Pre-compra                     87.500 km   │   │  │
│  │  │ ✓12 ⚠3 ✕1 · 6 fotos                      │   │  │
│  │  │ AutoCheck Buenos Aires                     │   │  │
│  │  │                        Ver reporte →       │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │        │                                           │  │
│  │        ●  10/03/2026                               │  │
│  │        │                                           │  │
│  │  ┌─────┴──────────────────────────────────────┐   │  │
│  │  │ Pre-compra                     45.200 km   │   │  │
│  │  │ ✓18 ⚠2 ✕0 · 8 fotos                      │   │  │
│  │  │ Taller Martínez                            │   │  │
│  │  │                        Ver reporte →       │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │        │                                           │  │
│  │        ●  01/02/2026                               │  │
│  │        │                                           │  │
│  │  ┌─────┴──────────────────────────────────────┐   │  │
│  │  │ ⚠ Corrige reporte anterior                 │   │  │
│  │  │ Periódica                      32.100 km   │   │  │
│  │  │ ✓20 ⚠1 ✕0 · 4 fotos                      │   │  │
│  │  │ Taller Martínez                            │   │  │
│  │  │                        Ver reporte →       │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│  Verificado por VinDex · Privacidad · Términos           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Vehicle Summary Card

The primary identification section. Shows the vehicle's decoded data and VIN.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Top of content, full-width |
| Vehicle icon | Car emoji or vehicle icon, `text-2xl` | Left of vehicle name |
| Vehicle name | `text-2xl`, `font-bold`, `gray-800` | "{Make} {Model} {Year} {Trim}" — omit nulls. Fallback: "Vehículo" if all null. |
| VIN | `text-sm`, `gray-500`, `font-mono` | "VIN: {vin}" — always shown (VIN is the route param) |
| Plate | `text-sm`, `gray-500` | "Patente: {plate}" — hidden if null |

### Vehicle Name Row

```
🚗  Nissan Sentra 2019 SR
    VIN: 3N1AB7AP5KY250312
    Patente: AC123BD
```

- Vehicle icon and name on the same horizontal row.
- VIN and plate below the name, stacked.
- `space-1` gap between VIN and plate lines.

---

## Event Timeline

Chronological list of all signed events for this vehicle, presented as a vertical timeline. Newest first.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Below vehicle summary card |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Historial de inspecciones ({count})" |
| Timeline line | 2px wide, `gray-200`, vertical, left offset 12px from card edge | Connects all event nodes |

### Timeline Node

Each signed event appears as a node on the timeline: a date marker, a connecting line, and an event card.

```
    ●  13/03/2026
    │
┌───┴──────────────────────────────────────┐
│ Pre-compra                    87.500 km  │
│ ✓12 ⚠3 ✕1 · 6 fotos                    │
│ AutoCheck Buenos Aires                   │
│                        Ver reporte →     │
└──────────────────────────────────────────┘
    │
```

#### Date Marker

| Element | Style | Behavior |
|---------|-------|----------|
| Dot | 10px circle, `brand-primary` bg, `white` 2px border | Sits on the timeline line |
| Date | `text-xs`, `font-medium`, `gray-600` | DD/MM/YYYY, right of dot, `space-2` gap |

#### Event Card

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `gray-50` bg, `radius-sm`, `space-3` padding | Tappable — navigates to `/report/{slug}` |
| Inspection type | `text-sm`, `font-medium`, `gray-800` | Left-aligned. Display labels: "Pre-compra" / "Recepción" / "Periódica" / "Otra" |
| Odometer | `text-sm`, `gray-500` | Right-aligned on same row as type. "{odometer_km} km" with thousand separator |
| Status summary | `text-xs` | "✓{n} ⚠{n} ✕{n} · {photo_count} fotos" with respective status colors inline |
| Inspector name | `text-xs`, `gray-500` | Node display_name. Tappable — navigates to `/inspector/{node_slug}` |
| Report link | `text-xs`, `brand-accent`, right-aligned | "Ver reporte →" — links to `/report/{slug}` |
| Divider | None — timeline line acts as visual separator | Between event cards |

#### Event Card Tap Behavior

Tapping anywhere on the event card navigates to `/report/{slug}`.

### Correction Markers

When an event has a correction relationship, a correction notice appears inside the event card.

#### On Original Event (when a correction exists)

| Element | Style | Behavior |
|---------|-------|----------|
| Notice container | `status-attention-bg` bg, `radius-sm`, `space-2` padding, full-width inside card | Top of event card, above type row |
| Icon | ⚠ icon, `status-attention` color, 14px | Left of text |
| Text | `text-xs`, `status-attention` color | "Se emitió una corrección" |
| Link | `text-xs`, `brand-accent` | "Ver corrección →" — links to `/report/{correction_slug}` |

#### On Correction Event

| Element | Style | Behavior |
|---------|-------|----------|
| Notice container | `info` bg tint, `radius-sm`, `space-2` padding, full-width inside card | Top of event card, above type row |
| Icon | ℹ icon, `info` color, 14px | Left of text |
| Text | `text-xs`, `info` color | "Corrige reporte anterior" |
| Link | `text-xs`, `brand-accent` | "Ver original →" — links to `/report/{original_slug}` |

### Sorting

Events sorted by `signed_at` descending (newest first).

### Pagination / Load More

- First load: show latest 10 events.
- "Ver más" button at bottom if more exist: `text-sm`, `brand-accent`, centered.
- Each tap loads 10 more (append to list).
- When all loaded, button hidden.

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Vehicle summary card:** icon + name stacked. VIN and plate below.
3. **Timeline line:** left offset 16px from card edge.
4. **Event cards:** full-width, text wraps naturally.
5. **Report link ("Ver reporte →"):** below inspector name, right-aligned.

### Mobile Layout

```
┌─────────────────────────────────────────┐
│  VinDex                                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🚗 Nissan Sentra 2019 SR       │    │
│  │    VIN: 3N1AB7AP5KY250312      │    │
│  │    Patente: AC123BD             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Historial de inspecciones (3)  │    │
│  │                                 │    │
│  │   ●  13/03/2026                 │    │
│  │   │                             │    │
│  │   ┌─────────────────────────┐   │    │
│  │   │ Pre-compra   87.500 km  │   │    │
│  │   │ ✓12 ⚠3 ✕1 · 6 fotos   │   │    │
│  │   │ AutoCheck Buenos Aires  │   │    │
│  │   │        Ver reporte →    │   │    │
│  │   └─────────────────────────┘   │    │
│  │   │                             │    │
│  │   ●  10/03/2026                 │    │
│  │   │                             │    │
│  │   ┌─────────────────────────┐   │    │
│  │   │ Pre-compra   45.200 km  │   │    │
│  │   │ ✓18 ⚠2 ✕0 · 8 fotos   │   │    │
│  │   │ Taller Martínez         │   │    │
│  │   │        Ver reporte →    │   │    │
│  │   └─────────────────────────┘   │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Verificado por VinDex · Priv · Térm    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Desktop Layout (> 1024px)

- Content centered, max-width `768px`.
- Vehicle summary card: icon + name side by side, `space-5` padding.
- Timeline line: left offset 20px from card edge.
- Event cards: status summary and "Ver reporte →" on the same row.
- Cards have `space-6` internal padding.

---

## States

### 1. Loading

- Shell A with skeleton placeholders:
  - Vehicle summary card skeleton: text blocks (250px wide, 24px tall) + VIN line.
  - Timeline card skeleton: 3 event card skeletons (each ~100px tall) with pulse animation.

### 2. Vehicle Found — With Events (Default)

- Vehicle summary card with all available data.
- Timeline populated, newest first.
- "Ver más" button if > 10 events.

### 3. Vehicle Found — Zero Signed Events

- Vehicle summary card displayed normally.
- Timeline section shows empty state:

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | Clipboard icon, 40x40, `gray-300` | Visual indicator |
| Text | `text-sm`, `gray-500`, text-center | "Este vehículo aún no tiene inspecciones firmadas." |

### 4. Vehicle Found — Missing Optional Fields

- **No make/model/year/trim:** vehicle name shows "Vehículo" as fallback. VIN is always shown.
- **No plate:** plate row hidden, no gap.

### 5. 404 — VIN Not Found

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Shell A, centered content | Standard error layout |
| Icon | Search/question icon, 48x48, `gray-400` | Visual indicator |
| Title | `text-xl`, `font-bold`, `gray-800` | "Vehículo no encontrado" |
| Message | `text-base`, `gray-500` | "No se encontró un vehículo con el VIN proporcionado." |
| CTA | Ghost button, "Ir al inicio →" | Links to `/` |

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Card | shadcn/ui `Card` | Vehicle summary card, timeline container |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | "Ver más", "Ver reporte →", 404 CTA |
| Badge | shadcn/ui `Badge` | Status indicators in event cards, correction markers |
| Skeleton | shadcn/ui `Skeleton` | Loading state |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-800`, `status-good`, `status-attention`, `status-critical`, `success`, `info`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards)
- **Touch targets:** 48x48px minimum interactive

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| View report | Tap event card or "Ver reporte →" | Navigate to `/report/{slug}` |
| View inspector profile | Tap inspector name | Navigate to `/inspector/{node_slug}` |
| View correction | Tap correction link in notice | Navigate to `/report/{correction_slug}` |
| View original | Tap original link in correction notice | Navigate to `/report/{original_slug}` |
| Load more events | Tap "Ver más" | Append next 10 events to timeline |
| Go to home | Tap VinDex logo | Navigate to `/` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render for vehicle summary card and timeline (3 event cards) |
| **Vehicle summary card** | Renders make/model/year/trim (omits nulls), VIN (always shown), plate (hidden if null). Fallback "Vehículo" when all vehicle data is null. |
| **Timeline section title** | Shows "Historial de inspecciones ({count})" with correct count |
| **Event card** | Renders inspection type with correct Spanish label, odometer with thousand separator, status summary with correct counts and colors, inspector name, "Ver reporte →" link |
| **Event card tap** | Navigates to `/report/{slug}` |
| **Inspector name tap** | Navigates to `/inspector/{node_slug}` (does not navigate to report) |
| **Event order** | Events sorted by `signed_at` descending (newest first) |
| **Correction — original event** | Shows "Se emitió una corrección" notice with link to correction report |
| **Correction — correction event** | Shows "Corrige reporte anterior" notice with link to original report |
| **Load more** | "Ver más" button shown when > 10 events. Tap loads next 10. Hidden when all loaded. |
| **Zero events** | Vehicle summary shown. Timeline shows empty state: "Este vehículo aún no tiene inspecciones firmadas." |
| **Missing optional fields** | Plate hidden when null. Vehicle name fallback when make/model/year are null. |
| **404 page** | Unknown VIN renders 404 with message "Vehículo no encontrado" and CTA |
| **Mobile layout** | Cards full-width, timeline left offset 16px |
| **Desktop layout** | Content max-width 768px centered, timeline left offset 20px |

---

## Accessibility

- All content readable without authentication.
- Vehicle VIN displayed in `font-mono` for readability.
- Status icons in event cards have `aria-label` alternatives (e.g., "12 items bien, 3 atención, 1 crítico").
- Timeline date markers have `aria-label` combining date with event context (e.g., "13/03/2026 — Pre-compra, 87.500 km").
- Event cards have `role="link"` with descriptive `aria-label` (e.g., "Pre-compra — 13/03/2026 — AutoCheck Buenos Aires — Ver reporte").
- Inspector name link has `aria-label`: "Ver perfil de {node_display_name}".
- "Ver más" button has `aria-label`: "Cargar más inspecciones".
- Correction notices have `role="status"` for screen reader announcement.
- Timeline uses semantic HTML (`<ol>` with `<li>` for each event) for screen reader structure.
- Page is fully navigable via keyboard.
- All text meets WCAG AA contrast ratios on white/gray-50 backgrounds.
