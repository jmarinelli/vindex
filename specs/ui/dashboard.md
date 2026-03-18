# UI Spec: Dashboard

*Screen specification for the inspector's home screen — inspection list with search and filters.*
*Derived from: specs/implementation-plan.md (Phase 4A) | specs/ui/design-system.md | specs/entities/event.md | specs/entities/vehicle.md | specs/entities/inspection-detail.md | specs/entities/inspection-finding.md*

---

## Overview

Single page at `/dashboard` using **Shell B** (Dashboard). The inspector's home screen shows all their inspections (drafts and signed) in a searchable, filterable list. Provides quick access to create a new inspection, edit their template, and view their public profile.

---

## Shell B Context

- **Top bar (64px):** Logo (left) · "Dashboard" (center) · User menu (right).
- **Content area:** max-width `1024px`, centered. Background `gray-50`.
- **No sidebar.** Single-column layout.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  VinDex       Dashboard                    [User ▾]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Bienvenido, Juan                                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           + Nueva Verificación                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────┐ [Todos▾][Draft▾]  │
│  │ 🔍 Buscar por VIN, marca...    │                    │
│  └─────────────────────────────────┘                    │
│                                                         │
│  Mis Verificaciones (5)                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Nissan Sentra 2019                       DRAFT  │    │
│  │ VIN: 3N1AB7AP5KY250312                          │    │
│  │ 12 Mar 2026 · 87.500 km                         │    │
│  │ Pre-compra · Comprador                           │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ 18/23 items · 4 fotos · 12 obs                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Toyota Corolla 2020                     SIGNED  │    │
│  │ VIN: JTDKN3DU5A0123456                          │    │
│  │ 10 Mar 2026 · 45.200 km                         │    │
│  │ Pre-compra · Vendedor                            │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ✓ 18 Bien · ⚠ 3 Att · ✕ 1 Crit · 6 fotos     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── Enlaces rápidos ──────────────────────────────────  │
│  [⚙ Configuración]  [✎ Editor de Template]             │
│  [👤 Mi Perfil Público]                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Welcome Header

| Element | Style | Behavior |
|---------|-------|----------|
| Greeting | `text-2xl`, `font-bold`, `gray-800` | "Bienvenido, {first_name}" |

---

## New Inspection Button

The most prominent call-to-action on the page.

| Element | Style | Behavior |
|---------|-------|----------|
| Button | Full-width primary button, 48px height, `radius-sm`, `brand-primary` bg, `white` text, `font-medium` | Navigates to `/dashboard/inspect` |
| Icon | `+` icon, 20x20, left of text | Visual cue |
| Label | `text-base` | "Nueva Verificación" |

---

## Search & Filter Bar

A combined row with a text search input and status filter toggle.

### Search Input

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `border-default`, `radius-sm`, 40px height, `space-3` padding-left | Left of filter |
| Search icon | 16x16, `gray-400`, left inside input | Static decorative icon |
| Input | `text-sm`, `gray-800`, placeholder `gray-400` | Placeholder: "Buscar por VIN, marca, modelo..." |
| Clear button | 16x16, `gray-400`, right inside input | Shown only when input has text. Tap clears input. |
| Behavior | — | Filters inspection list in real-time (debounced 300ms). Searches against VIN, make, model, plate. Case-insensitive. |

### Status Filter

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Horizontal row, `space-2` gap, right of search | Aligned right |
| Filter pills | `text-xs`, `radius-full`, 32px height, `padding` 0 12px | Three options: "Todos", "Borrador", "Firmados" |
| Active pill | `brand-primary` bg, `white` text, `font-medium` | Currently selected filter |
| Inactive pill | `gray-100` bg, `gray-600` text | Tappable |
| Default | "Todos" selected | Shows all inspections |
| Behavior | — | Filters inspection list by status. "Borrador" = `draft`, "Firmados" = `signed`. |

---

## Inspection List

### Section Header

| Element | Style | Behavior |
|---------|-------|----------|
| Title | `text-base`, `font-medium`, `gray-700` | "Mis Verificaciones ({count})" — count reflects filtered results |

### Inspection Card

Each inspection is a card showing vehicle info, metadata, and progress.

```
┌─────────────────────────────────────────────────┐
│ Nissan Sentra 2019                       DRAFT  │
│ VIN: 3N1AB7AP5KY250312                          │
│ 12 Mar 2026 · 87.500 km                         │
│ Pre-compra · Comprador                           │
├─────────────────────────────────────────────────┤
│ 18/23 items · 4 fotos · 12 obs                  │
└─────────────────────────────────────────────────┘
```

#### Card Header (Top Section)

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm` | Full-width, tappable |
| Vehicle name | `text-base`, `font-medium`, `gray-800` | "{Make} {Model} {Year}" — left-aligned. Omit nulls. If no decode data: "Vehículo sin datos". |
| Status badge | `text-xs`, `font-medium`, `radius-full`, `padding` 2px 10px | Right of vehicle name, vertically centered |
| Draft badge | `status-attention` text, `status-attention-bg` bg | "BORRADOR" |
| Signed badge | `status-good` text, `status-good-bg` bg | "FIRMADO" |
| VIN | `text-xs`, `gray-500`, `font-mono` | "VIN: {vin}" — full 17-char VIN |
| Date + Odometer | `text-xs`, `gray-500` | "{event_date} · {odometer_km} km" — date as "DD MMM YYYY", odometer with thousand separator |
| Type + Requested by | `text-xs`, `gray-500` | "{inspection_type} · {requested_by}" — display labels in Spanish |

#### Card Footer (Progress Section)

Separated from the header by a 1px `gray-100` divider.

**For draft inspections:**

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `gray-50` bg, `space-3` padding, border-top 1px `gray-100` | Bottom of card |
| Progress text | `text-xs`, `gray-500` | "{evaluated}/{total} items · {photo_count} fotos · {observation_count} obs" |

**For signed inspections:**

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `gray-50` bg, `space-3` padding, border-top 1px `gray-100` | Bottom of card |
| Status summary | `text-xs` | "✓ {n} Bien · ⚠ {n} Att · ✕ {n} Crit" with respective status colors inline. Photo count appended: "· {n} fotos" |

#### Card Tap Behavior

| Inspection Status | Tap Action |
|-------------------|------------|
| `draft` | Navigate to `/dashboard/inspect/{id}` — resumes editing in Field Mode |
| `signed` | Navigate to `/report/{slug}` — opens public report |

#### Card Spacing

- `space-3` gap between cards.
- Cards are vertically stacked, single column.

---

## Quick Links

Secondary navigation to other dashboard features.

| Element | Style | Behavior |
|---------|-------|----------|
| Section separator | `text-xs`, `gray-400`, uppercase, `font-medium` | "Enlaces rápidos" with horizontal lines |
| Link row | Horizontal, `space-4` gap | Side by side on desktop, stacked on mobile |
| Settings link | Ghost button, `brand-primary` text, ⚙ icon | "Configuración" → `/dashboard/settings` |
| Template link | Ghost button, `brand-primary` text, ✎ icon | "Editor de Template" → `/dashboard/template` |
| Profile link | Ghost button, `brand-primary` text, 👤 icon | "Mi Perfil Público" → `/inspector/{slug}` |

---

## Sorting

Inspections are sorted by most recent activity:

1. **Drafts first** — ordered by `updated_at` descending (most recently edited draft at top).
2. **Signed after** — ordered by `signed_at` descending (most recently signed at top).

When a status filter is active, only items matching that status are shown, maintaining the same ordering within the filtered set.

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Welcome header:** `text-xl` instead of `text-2xl`.
3. **New Inspection button:** full-width, `space-4` horizontal margin.
4. **Search + filter row:** stacked vertically. Search input full-width, filter pills below as a horizontal row.
5. **Inspection cards:** full-width.
6. **Quick links:** stacked vertically, full-width ghost buttons.
7. **Card footer:** same layout, text wraps naturally.

### Mobile Layout

```
┌─────────────────────────────────────────┐
│  VinDex       Dashboard       [User ▾]  │
├─────────────────────────────────────────┤
│                                         │
│  Bienvenido, Juan                       │
│                                         │
│  [      + Nueva Verificación      ]       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Buscar por VIN, marca...    │    │
│  └─────────────────────────────────┘    │
│  [Todos] [Borrador] [Firmados]          │
│                                         │
│  Mis Verificaciones (5)                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Nissan Sentra 2019       DRAFT  │    │
│  │ VIN: 3N1AB7AP5KY250312          │    │
│  │ 12 Mar 2026 · 87.500 km         │    │
│  │ Pre-compra · Comprador           │    │
│  ├─────────────────────────────────┤    │
│  │ 18/23 items · 4 fotos · 12 obs  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Toyota Corolla 2020     SIGNED  │    │
│  │ ...                              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [⚙ Configuración             ]         │
│  [✎ Editor de Template        ]         │
│  [👤 Mi Perfil Público        ]         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Desktop Layout (> 1024px)

- Content centered, max-width `1024px`.
- Cards have `space-5` internal padding.
- Search input and filter pills are on the same horizontal row.
- Quick links displayed inline, horizontal.
- Inspection cards could potentially show a 2-column grid for wide screens, but kept as single column for Phase 4A simplicity.

---

## States

### 1. Loading

- Shell B with skeleton placeholders:
  - One rectangle for greeting text (200px wide, 32px tall).
  - One full-width rectangle for New Inspection button (48px tall).
  - One full-width rectangle for search bar (40px tall).
  - 3 skeleton cards with pulse animation (each ~140px tall).

### 2. With Inspections (Default)

- Greeting displayed.
- Inspection list populated, sorted by recency.
- Search input empty, "Todos" filter active.
- Quick links visible below the list.

### 3. Empty State (No Inspections)

- Greeting displayed.
- New Inspection button prominent.
- No search/filter bar (hidden when 0 total inspections).
- Center-aligned empty state message below the button:

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | Clipboard or search icon, 48x48, `gray-300` | Visual indicator |
| Title | `text-lg`, `font-medium`, `gray-700` | "No tenés verificaciones" |
| Subtitle | `text-sm`, `gray-500` | "Creá tu primera verificación para empezar." |

- Quick links visible below the empty state.

### 4. Filtered — No Results

- Search/filter bar visible with active filters.
- Center-aligned no-results message:

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | Search icon, 40x40, `gray-300` | Visual indicator |
| Text | `text-sm`, `gray-500` | "No se encontraron verificaciones con estos filtros." |
| Clear action | `text-sm`, `brand-accent` | "Limpiar filtros" — resets search and filter to defaults |

### 5. Offline

The dashboard enters read-only offline mode when the device has no connectivity. Data comes from Dexie instead of the server.

- **Offline banner** at the top of the content area (below greeting):

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `status-attention-bg` bg, `radius-sm`, `space-3` padding, full-width | Visible only when offline |
| Icon | Cloud-off icon, 16x16, `warning` color | Left of text |
| Text | `text-sm`, `font-medium`, `warning` color | "Sin conexión — solo se muestran borradores locales" |

- **Inspection list:** populated from Dexie `drafts` table only. Each draft card renders with the same layout as the online version (vehicle name, VIN, date, odometer, type, requested by, progress footer). Draft cards are tappable — navigate to field mode.
- **Signed inspections:** not shown (data is server-only).
- **Disabled/hidden elements:**
  - "Nueva Verificación" button — disabled (`gray-100` bg, `gray-400` text). Label: "Nueva Verificación". No tooltip needed — the banner explains the situation.
  - Search input — hidden.
  - Status filter pills — hidden.
  - Quick links — hidden.
- **Greeting:** still shown ("Bienvenido, {name}" — name from the JWT session, which is available locally).
- **Empty offline state** (no Dexie drafts):

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | Cloud-off icon, 48x48, `gray-300` | Visual indicator |
| Title | `text-lg`, `font-medium`, `gray-700` | "No hay borradores locales" |
| Subtitle | `text-sm`, `gray-500` | "Conectate a internet para ver tus verificaciones." |

- **Reconnect behavior:** when connectivity is restored, the offline banner disappears, the full server data loads, and all controls are re-enabled.

### 6. Error State

- Full-page error within Shell B.
- Icon: warning triangle, 48x48, `error` color.
- Message: `text-base`, `gray-700` — "Error al cargar tus verificaciones."
- Retry button: Secondary button — "Reintentar".

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | New Inspection |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Quick links |
| Card | shadcn/ui `Card` | Inspection cards |
| Input | shadcn/ui `Input` | Search input |
| Badge | shadcn/ui `Badge` | Status badges (Draft/Signed), filter pills |
| Skeleton | shadcn/ui `Skeleton` | Loading state |
| Toast | shadcn/ui `Sonner` / toast | Error feedback |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-800`, `status-good`, `status-good-bg`, `status-attention`, `status-attention-bg`, `status-critical`, `status-critical-bg`, `error`, `success`
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
| Create new inspection | Tap "+ Nueva Verificación" | Navigate to `/dashboard/inspect` (Step 1) |
| Search inspections | Type in search input | List filters in real-time (debounced 300ms) |
| Clear search | Tap ✕ in search input | Resets search, shows full list |
| Filter by status | Tap filter pill | List filters by draft/signed/all |
| Open draft inspection | Tap draft card | Navigate to `/dashboard/inspect/{id}` (Field Mode) |
| Open signed inspection | Tap signed card | Navigate to `/report/{slug}` (Public Report) |
| Open settings | Tap "Configuración" | Navigate to `/dashboard/settings` |
| Open template editor | Tap "Editor de Template" | Navigate to `/dashboard/template` |
| View public profile | Tap "Mi Perfil Público" | Navigate to `/inspector/{slug}` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render (greeting, button, search bar, 3 cards) |
| **With inspections** | Inspection cards render in correct order (drafts first by updated_at, then signed by signed_at) · Vehicle name, VIN, date, odometer, type, requested_by displayed · Status badge correct (BORRADOR amber, FIRMADO green) |
| **Draft card footer** | Shows progress: "{n}/{total} items · {n} fotos · {n} obs" |
| **Signed card footer** | Shows status summary with correct counts and colors |
| **Card tap (draft)** | Navigates to `/dashboard/inspect/{id}` |
| **Card tap (signed)** | Navigates to `/report/{slug}` |
| **New Inspection button** | Renders prominently · Navigates to `/dashboard/inspect` on tap |
| **Search input** | Typing filters results by VIN/make/model/plate · Debounced 300ms · Clear button resets · Empty search shows all |
| **Status filter** | "Todos" shows all · "Borrador" shows only drafts · "Firmados" shows only signed · Active pill highlighted |
| **Empty state** | Shown when inspector has zero inspections · "No tenés verificaciones" message · New Inspection button still visible · Search/filter bar hidden |
| **Filtered no results** | Shown when search/filter matches nothing · "No se encontraron verificaciones" message · "Limpiar filtros" link resets |
| **Quick links** | Settings link navigates to `/dashboard/settings` · Template editor link navigates to `/dashboard/template` · Profile link navigates to `/inspector/{slug}` |
| **Mobile layout** | Search and filters stacked vertically · Cards full-width · Quick links stacked |
| **Offline state** | Offline banner shown · Only Dexie drafts displayed · Draft cards tappable · "Nueva Verificación" disabled · Search/filter hidden · Quick links hidden · Signed inspections not shown |
| **Offline — no drafts** | Empty offline state message shown: "No hay borradores locales" |
| **Offline → online** | Banner disappears · Server data loads · All controls re-enabled |
| **Error state** | Error message shown · Retry button triggers reload |

---

## Accessibility

- All interactive elements meet 48x48px touch targets on mobile.
- Search input has associated label (visually hidden): "Buscar verificaciones".
- Filter pills use `role="radiogroup"` with individual `role="radio"` and `aria-checked`.
- Inspection cards have `role="link"` with descriptive `aria-label` (e.g., "Nissan Sentra 2019 — Borrador, 12 Mar 2026").
- Status badges have `aria-label` (e.g., "Estado: Borrador").
- Empty state message is within a `role="status"` region.
- Keyboard navigation: Tab through cards, Enter to open. Tab to search/filter controls.
- Search clear button has `aria-label`: "Limpiar búsqueda".
- Status colors are not the only indicator: badges include text labels alongside color.
