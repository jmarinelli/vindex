# UI Spec: Inspector Profile

*Screen specification for the public inspector profile page — identity, stats, and signed report history.*
*Derived from: specs/implementation-plan.md (Phase 4B) | specs/ui/design-system.md | specs/entities/node.md | specs/entities/event.md | specs/entities/vehicle.md | specs/entities/review.md*

---

## Overview

Single page at `/inspector/{slug}` using **Shell A** (Public). Displays the inspector's professional profile: identity card with logo and contact info, aggregated stats (inspection count, operating tenure, detail metrics), and a chronological list of signed reports. Accessible without authentication.

---

## Route & Shell

**Route:** `/inspector/[slug]`
**Shell:** A (Public)

### Shell A Context

- **Top bar:** Minimal. VinDex logo (left, small, links to `/`). No auth controls.
- **Content area:** max-width `768px`, centered, `white` background on cards, `gray-50` page background.
- **Footer:** Minimal — "Registrado en VinDex" · Privacidad · Términos links.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  VinDex                                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ┌──────┐                                           │  │
│  │ │ LOGO │  Taller Martínez                          │  │
│  │ └──────┘  Verificador registrado ✓                  │  │
│  │                                                    │  │
│  │  Mecánico especializado en pre-compra con 12       │  │
│  │  años de experiencia. Verificaciones detalladas     │  │
│  │  para vehículos nacionales e importados.           │  │
│  │                                                    │  │
│  │  📧 contacto@tallermartinez.com                    │  │
│  │  📞 +54 11 4555-1234                               │  │
│  │  📍 Av. Corrientes 4500, CABA, Argentina           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Estadísticas                            │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │    24    │  │ Mar 2024 │  │   8.3    │         │  │
│  │  │verifica- │  │verifican- │ │fotos por │         │  │
│  │  │ ciones   │  │do desde  │  │ reporte  │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐                        │  │
│  │  │   5.2    │  │   4.1    │                        │  │
│  │  │obs. por  │  │secciones │                        │  │
│  │  │ reporte  │  │promedio  │                        │  │
│  │  └──────────┘  └──────────┘                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Verificaciones firmadas (24)                       │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Nissan Sentra 2019              13/03/2026   │  │  │
│  │  │ VIN: 3N1AB7AP5KY250312                       │  │  │
│  │  │ 87.500 km · Pre-compra                       │  │  │
│  │  │ ✓12 ⚠3 ✕1 · 6 fotos        Ver reporte →   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Toyota Corolla 2020             10/03/2026   │  │  │
│  │  │ VIN: JTDKN3DU5A0123456                       │  │  │
│  │  │ 45.200 km · Pre-compra                       │  │  │
│  │  │ ✓18 ⚠2 ✕0 · 8 fotos        Ver reporte →   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ...                                               │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│  Registrado en VinDex · Privacidad · Términos             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Identity Card

The primary visual element. Establishes the inspector's professional identity and contact information.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Top of content, full-width |
| Brand color accent | 3px top border on card | Uses node `brand_color` if set, otherwise `brand-primary` |
| Brand accent links | Contact email and phone link color | Uses node `brand_accent` if set, otherwise `brand-accent` |
| Logo | 64x64, `radius-md`, `border-default`, `object-fit: cover` | Node logo image via Cloudinary (w_128). Fallback: first letter of display_name on `brand-primary` bg circle, `white` text, `text-2xl`, `font-bold` |
| Node name | `text-2xl`, `font-bold`, `gray-800` | Right of logo (same row) |
| Verified label | `text-xs`, `success` color, with shield-check icon | Below node name, same row alignment. "Verificador registrado" |
| Bio | `text-sm`, `gray-600`, max 3 lines | Below name/logo row. Full bio text, no truncation. Hidden if null. |
| Contact email | `text-sm`, `gray-600`, with 📧 icon | `mailto:` link. Hidden if null. |
| Contact phone | `text-sm`, `gray-600`, with 📞 icon | `tel:` link. Hidden if null. |
| Address | `text-sm`, `gray-600`, with 📍 icon | Plain text. Hidden if null. |

### Logo + Name Row

```
┌──────┐
│ LOGO │  Taller Martínez
└──────┘  Verificador registrado ✓
```

- Logo and name are on the same horizontal row.
- Logo is left-aligned, name is vertically centered next to it.
- `space-4` gap between logo and text.

---

## Stats Section

Aggregated metrics computed from the inspector's signed events. Provides buyers with an at-a-glance sense of the inspector's experience and thoroughness.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Below identity card |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Estadísticas" |
| Stats grid | 3-column grid (mobile: 2-column), `space-4` gap | Each stat is a compact tile |

### Stat Tiles

Each stat is a compact vertical tile with a prominent number and a descriptive label.

| Element | Style | Behavior |
|---------|-------|----------|
| Tile container | `gray-50` bg, `radius-md`, `space-3` padding, text-center | Fixed within grid |
| Value | `text-2xl`, `font-bold`, `gray-800` | The metric number |
| Label | `text-xs`, `gray-500`, `font-medium` | Description below the number |

### Stat Definitions

| Stat | Value | Label | Computation |
|------|-------|-------|-------------|
| Inspection count | Integer | "verificaciones" | Count of signed events where `node_id = this node` |
| Operating since | Month + Year | "verificando desde" | `signed_at` of the earliest signed event. Format: "Mar 2024". If no inspections: hidden. |
| Avg photos/report | Decimal (1 digit) | "fotos por reporte" | Average count of event photos (all types) across signed events |
| Avg observations/report | Decimal (1 digit) | "obs. por reporte" | Average count of non-empty observations across signed events |
| Avg sections/report | Decimal (1 digit) | "secciones promedio" | Average count of sections with at least one evaluated item across signed events |

### Stats — Zero Inspections

When the inspector has zero signed inspections, the stats section is **hidden entirely**. The identity card alone represents the profile.

---

## Signed Reports List

Chronological list of all signed inspection events, newest first.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Below stats section |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Verificaciones firmadas ({count})" |
| List | Vertical stack, `space-3` gap between items | All signed events for this node |

### Report Item

Each signed inspection appears as a compact row within the list card.

```
┌──────────────────────────────────────────────┐
│ Nissan Sentra 2019                13/03/2026 │
│ VIN: 3N1AB7AP5KY250312                       │
│ 87.500 km · Pre-compra                       │
│ ✓12 ⚠3 ✕1 · 6 fotos          Ver reporte → │
└──────────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Item container | `gray-50` bg, `radius-sm`, `space-3` padding | Tappable row |
| Vehicle name | `text-sm`, `font-medium`, `gray-800` | "{Make} {Model} {Year}" — left. Omit nulls. Fallback: "Vehículo sin datos". |
| Date | `text-xs`, `gray-500` | Signed date as DD/MM/YYYY — right-aligned on same row as vehicle name |
| VIN | `text-xs`, `gray-500`, `font-mono` | "VIN: {vin}" |
| Odometer + Type | `text-xs`, `gray-500` | "{odometer_km} km · {inspection_type}" with thousand separator. Display labels in Spanish. |
| Status summary | `text-xs` | "✓{n} ⚠{n} ✕{n} · {photo_count} fotos" with respective status colors inline |
| Report link | `text-xs`, node `brand_accent` (fallback: `brand-accent`), right-aligned | "Ver reporte →" — links to `/report/{slug}` |
| Divider | 1px `gray-200` border-bottom | Between items (except last) |

### Report Item Tap Behavior

Tapping anywhere on the item navigates to `/report/{slug}`.

### Sorting

Reports sorted by `signed_at` descending (newest first).

### Pagination / Load More

- First load: show latest 10 reports.
- "Ver más" button at bottom if more exist: `text-sm`, `brand-accent`, centered.
- Each tap loads 10 more (append to list).
- When all loaded, button hidden.

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Identity card:** logo (48x48) + name stacked vertically (logo centered above name) OR side by side if space allows.
3. **Stats grid:** 2-column grid. Third stat wraps to second row.
4. **Report items:** full-width, text wraps naturally.
5. **Report link ("Ver reporte →"):** below status summary, right-aligned.

### Mobile Layout

```
┌─────────────────────────────────────────┐
│  VinDex                                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ┌──────┐                        │    │
│  │ │ LOGO │  Taller Martínez       │    │
│  │ └──────┘  Verificador registrado │    │
│  │                                 │    │
│  │  Mecánico especializado en...   │    │
│  │                                 │    │
│  │  📧 contacto@tallermartinez.com │    │
│  │  📞 +54 11 4555-1234           │    │
│  │  📍 Av. Corrientes 4500, CABA  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Estadísticas                   │    │
│  │  ┌──────────┐ ┌──────────┐     │    │
│  │  │    24    │ │ Mar 2024 │     │    │
│  │  │verifica- │ │desde     │     │    │
│  │  │ ciones   │ │          │     │    │
│  │  └──────────┘ └──────────┘     │    │
│  │  ┌──────────┐ ┌──────────┐     │    │
│  │  │   8.3   │ │   5.2    │     │    │
│  │  │fotos/rep│ │obs/rep   │     │    │
│  │  └──────────┘ └──────────┘     │    │
│  │  ┌──────────┐                  │    │
│  │  │   4.1    │                  │    │
│  │  │secc/rep  │                  │    │
│  │  └──────────┘                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Verificaciones firmadas (24)    │    │
│  │                                 │    │
│  │  Nissan Sentra 2019  13/03/2026 │    │
│  │  VIN: 3N1AB7AP5KY250312         │    │
│  │  87.500 km · Pre-compra         │    │
│  │  ✓12 ⚠3 ✕1 · 6 fotos          │    │
│  │                  Ver reporte →  │    │
│  │  ───────────────────────────    │    │
│  │  Toyota Corolla 2020            │    │
│  │  ...                            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Registrado en VinDex · Priv · Térm     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Desktop Layout (> 1024px)

- Content centered, max-width `768px`.
- Identity card: logo (64x64) + name side by side, `space-5` padding.
- Stats grid: 3-column first row, 2-column second row (or 5 tiles in a responsive wrap).
- Report items: status summary and "Ver reporte →" on the same row.
- Cards have `space-6` internal padding.

---

## States

### 1. Loading

- Shell A with skeleton placeholders:
  - Identity card skeleton: circle (64px) + text blocks (200px wide).
  - Stats card skeleton: 3 rectangles (100px wide, 80px tall).
  - 3 report item skeletons with pulse animation.

### 2. Profile Loaded — With Inspections (Default)

- Identity card with all available info.
- Stats section with computed metrics.
- Report list populated, newest first.
- "Ver más" button if > 10 reports.

### 3. Profile Loaded — Zero Inspections

- Identity card displayed normally.
- Stats section **hidden**.
- Report list section shows empty state:

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | Clipboard icon, 40x40, `gray-300` | Visual indicator |
| Text | `text-sm`, `gray-500`, text-center | "Este verificador aún no tiene verificaciones firmadas." |

### 4. Profile Loaded — Missing Optional Fields

- **No logo:** fallback initial letter avatar (first letter of display_name, `brand-primary` bg, `white` text, `radius-full`).
- **No bio:** bio row hidden, no gap.
- **No phone:** phone row hidden.
- **No address:** address row hidden.
- **No brand_color:** top border uses `brand-primary`.

### 5. 404 — Node Not Found

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Shell A, centered content | Standard error layout |
| Icon | Search/question icon, 48x48, `gray-400` | Visual indicator |
| Title | `text-xl`, `font-bold`, `gray-800` | "Verificador no encontrado" |
| Message | `text-base`, `gray-500` | "El perfil que buscás no existe o no está disponible." |
| CTA | Ghost button, "Ir al inicio →" | Links to `/` |

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Card | shadcn/ui `Card` | Identity card, stats card, report list card |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | "Ver más", "Ver reporte →", 404 CTA |
| Badge | shadcn/ui `Badge` | Verified label, status indicators in report items |
| Skeleton | shadcn/ui `Skeleton` | Loading state |
| Avatar | shadcn/ui `Avatar` | Logo with fallback |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-800`, `status-good`, `status-attention`, `status-critical`, `success`
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
| View report | Tap report item or "Ver reporte →" | Navigate to `/report/{slug}` |
| Load more reports | Tap "Ver más" | Append next 10 reports to list |
| Send email | Tap email address | Opens `mailto:` link |
| Call phone | Tap phone number | Opens `tel:` link |
| Go to home | Tap VinDex logo | Navigate to `/` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render for identity card (avatar + text), stats (3 tiles), report items (3 rows) |
| **Identity card** | Renders node name, logo (or fallback initial), verified label, bio (hidden if null), email (hidden if null), phone (hidden if null), address (hidden if null), brand color top border (fallback to brand-primary) |
| **Logo fallback** | When logo_url is null, renders first letter of display_name in colored circle |
| **Stats section** | Renders all 5 stat tiles with correct values. Hidden entirely when zero inspections. |
| **Stats computation** | Inspection count is correct, "verificando desde" shows earliest signed_at month/year, averages computed correctly |
| **Report list** | Renders signed events newest-first. Each item shows vehicle name, VIN, date, odometer, type, status summary, photo count. |
| **Report item tap** | Navigates to `/report/{slug}` |
| **Report item — missing vehicle data** | Shows "Vehículo sin datos" fallback |
| **Load more** | "Ver más" button shown when > 10 reports. Tap loads next 10. Hidden when all loaded. |
| **Zero inspections** | Stats section hidden. Report list shows empty state message: "Este verificador aún no tiene verificaciones firmadas." |
| **Missing optional fields** | Bio, phone, address hidden gracefully when null. No extra gaps. |
| **404 page** | Unknown slug renders 404 with message and CTA |
| **Contact links** | Email opens mailto, phone opens tel |
| **Mobile layout** | Stats grid 2-column, cards full-width, logo 48x48 |
| **Desktop layout** | Content max-width 768px centered, stats grid 3-column, logo 64x64 |

---

## Accessibility

- All content readable without authentication.
- Logo image has `alt` text: "{display_name} logo". Fallback avatar has `aria-label`: "{display_name}".
- Verified label has `aria-label`: "Verificador registrado en VinDex".
- Contact links have descriptive text (email shows full address, phone shows full number).
- Status icons in report items have `aria-label` alternatives (e.g., "12 items bien, 3 atención, 1 crítico").
- "Ver más" button has `aria-label`: "Cargar más verificaciones".
- Report items have `role="link"` with descriptive `aria-label` (e.g., "Nissan Sentra 2019 — 13/03/2026 — Ver reporte").
- Stat tiles have `aria-label` combining value and label (e.g., "24 verificaciones").
- Page is fully navigable via keyboard.
- All text meets WCAG AA contrast ratios on white/gray-50 backgrounds.
