# UI Spec: Public Report Page

*Screen specification for the public inspection report viewable by anyone with the link.*
*Derived from: specs/flows/inspection-signing.md | specs/ui/design-system.md | specs/entities/event.md | specs/entities/vehicle.md | specs/entities/node.md | specs/entities/inspection-detail.md | specs/entities/inspection-finding.md | specs/entities/event-photo.md*

---

## Overview

The public report page displays a signed inspection at `/report/{slug}`. Accessible without authentication. Shows vehicle information with a prominent photo gallery, inspector identity, verification badge, and all findings organized by section with photos. Includes OpenGraph meta tags for rich social sharing previews. Uses **Shell A** (Public) — minimal chrome, white-label presentation.

---

## Route & Shell

**Route:** `/report/[slug]`
**Shell:** A (Public)

### Shell A Context

- **Top bar:** Minimal. VinDex logo (left, small, links to `/`). No auth controls.
- **Content area:** max-width `768px`, centered, `white` background.
- **Footer:** Minimal — "Verificado por VinDex" · Privacy · Terms links.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  VinDex                                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ✓ Verificación                                     │  │
│  │ Firmada el 13/03/2026 a las 14:32                  │  │
│  │ por Juan Pérez · AutoCheck Buenos Aires            │  │
│  │ Este reporte no puede ser modificado.              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🚗 Nissan Sentra 2019 SR                          │  │
│  │    VIN: 3N1AB7AP5KY250312                          │  │
│  │    Patente: AC123BD                                │  │
│  │    Kilometraje: 87.500 km                          │  │
│  │    Tipo: Pre-compra · Solicitada por: Comprador    │  │
│  │    Fecha: 13/03/2026                               │  │
│  │    [Ver historial del vehículo →]                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Fotos del vehículo                                │  │
│  │  ┌──────────┬──────────┐                           │  │
│  │  │  foto 1  │  foto 2  │                           │  │
│  │  ├──────────┼──────────┤                           │  │
│  │  │  foto 3  │  foto 4  │                           │  │
│  │  └──────────┴──────────┘                           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🏢 AutoCheck Buenos Aires                        │  │
│  │     Inspector verificado                           │  │
│  │     📧 contacto@autocheck.com                     │  │
│  │     📞 +54 11 4567-8901                           │  │
│  │     [Ver perfil del inspector →]                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Resumen                                           │  │
│  │  [■■■■■■ 12 Bien] [■■ 3 Att] [■ 1 Crit]          │  │
│  │  18 items evaluados · 4 fotos                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Exterior                   ✓3 ⚠1          ▾     │  │
│  │                             4 items · 3 fotos     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ✓ Carrocería y pintura                             │  │
│  │   Rayón en puerta trasera derecha, 15cm aprox.     │  │
│  │   [photo1] [photo2]                                │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ✓ Vidrios y espejos                                │  │
│  │   Sin observaciones                                │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ⚠ Luces y ópticas                                 │  │
│  │   Óptica delantera derecha empañada                │  │
│  │   [photo1]                                         │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ✓ Neumáticos y llantas                             │  │
│  │   Sin observaciones                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Motor                      ✓1 ✕1          ▸     │  │
│  │                             2 items · 0 fotos     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│  Verificado por VinDex · Privacidad · Términos           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Verification Badge

The most prominent element on the page. Establishes trust immediately.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `success` bg tint (#f0fdf4), `border-default` with `success` left border (3px), `radius-md`, `space-4` padding | Top of content, full-width |
| Checkmark icon | 24x24, `success` color, shield-check or check-circle icon | Left of content |
| Title | `text-base`, `font-bold`, `success` color | "Verificación" |
| Signed timestamp | `text-sm`, `gray-700` | "Firmada el {date} a las {time}" |
| Signed by | `text-sm`, `gray-700` | "por {user_name} · {node_display_name}" |
| Immutability notice | `text-xs`, `gray-500` | "Este reporte no puede ser modificado." |

---

## Vehicle Summary Card

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Below verification badge |
| Vehicle icon | Car emoji or vehicle icon, `text-2xl` | Left of vehicle name |
| Vehicle name | `text-xl`, `font-bold`, `gray-800` | "{Make} {Model} {Year} {Trim}" — omit nulls |
| VIN | `text-sm`, `gray-500`, monospace | "VIN: {vin}" |
| Plate | `text-sm`, `gray-500` | "Patente: {plate}" — hidden if null |
| Odometer | `text-sm`, `gray-600` | "Kilometraje: {odometer_km} km" with thousand separator |
| Inspection type | `text-sm`, `gray-600` | "Tipo: {inspection_type}" — display labels: Pre-compra / Recepción / Periódica / Otra |
| Requested by | `text-sm`, `gray-600` | "Solicitada por: {requested_by}" — display labels: Comprador / Vendedor / Agencia / Otro |
| Event date | `text-sm`, `gray-600` | "Fecha: {event_date}" formatted as DD/MM/YYYY |
| Vehicle history link | `text-sm`, `brand-accent`, "Ver historial del vehículo →" | Links to `/vehicle/{vin}` |

---

## Inspector Identity Card

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Below vehicle summary |
| Logo | 48x48, `radius-md`, `border-default` | Node logo image. Fallback: first letter of display_name in `brand-primary` bg circle |
| Node name | `text-lg`, `font-medium`, `gray-800` | Node display_name |
| Verified label | `text-xs`, `success` color, with shield icon | "Inspector verificado" |
| Contact email | `text-sm`, `gray-600`, with 📧 icon | mailto link. Hidden if null. |
| Contact phone | `text-sm`, `gray-600`, with 📞 icon | tel link. Hidden if null. |
| Profile link | `text-sm`, `brand-accent`, "Ver perfil del inspector →" | Links to `/inspector/{node_slug}` |
| Brand color accent | 3px top border on card | Uses node `brand_color` if set, otherwise `brand-primary` |

---

## Summary Card

Aggregate view of all findings.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `gray-50` bg, `border-default`, `radius-md`, `space-4` padding | Below inspector card |
| Title | `text-base`, `font-medium`, `gray-800` | "Resumen" |
| Segmented bar | 8px height, `radius-full` | Same as review screen — proportional colored segments |
| Count labels | `text-sm`, status colors | "✓ {n} Bien · ⚠ {n} Atención · ✕ {n} Crítico" — no N/E on public report (all should be evaluated) |
| Totals | `text-xs`, `gray-500` | "{total} items evaluados · {photo_count} fotos" |

---

## Findings by Section

Findings displayed in template section order. Each section is a **collapsible card** — collapsed by default on mobile (expanded on desktop) — showing an inline status summary when closed. This keeps scroll manageable on exhaustive inspections (9+ sections × many items).

### Section Card (Collapsible)

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm` | Contains header + collapsible body |
| Spacing | `space-4` gap between section cards | Between sections |

### Section Header (Always Visible)

The header row acts as the collapse toggle. It shows the section name and an inline status summary so the reader can scan all sections without expanding.

```
┌────────────────────────────────────────────────────┐
│  Exterior                    ✓3 ⚠1      ▾         │
│                              4 items · 3 fotos     │
├────────────────────────────────────────────────────┤
│  (expanded finding rows when open)                 │
└────────────────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `space-4` padding, full-width, cursor pointer | Tappable — toggles expanded/collapsed |
| Section name | `text-base`, `font-semibold`, `gray-800` | Left-aligned |
| Status pills (inline) | Horizontal row, `space-2` gap, right-aligned | Compact status counts for this section only |
| Good pill | `text-xs`, `status-good` text, `status-good-bg` bg, `radius-full`, `padding` 2px 8px | "✓{n}" — hidden if count = 0 |
| Attention pill | `text-xs`, `status-attention` text, `status-attention-bg` bg, `radius-full`, `padding` 2px 8px | "⚠{n}" — hidden if count = 0 |
| Critical pill | `text-xs`, `status-critical` text, `status-critical-bg` bg, `radius-full`, `padding` 2px 8px | "✕{n}" — hidden if count = 0 |
| Section meta | `text-xs`, `gray-400`, below name or right-aligned on desktop | "{n} items · {m} fotos" (photos count for this section, including finding + general) |
| Chevron icon | 20x20, `gray-400` | ▾ when expanded, ▸ when collapsed. Rotates with 150ms transition. |
| Touch target | Full header row, 48px minimum height | Entire row is the toggle target |

### Section Body (Collapsible)

The body contains all finding rows. It collapses with a smooth height animation (200ms ease-out).

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `border-default` top (1px `gray-200`), `overflow: hidden` | Animated height: 0 when collapsed, auto when expanded |
| Animation | `max-height` transition, 200ms ease-out | Smooth open/close |

### Collapse Behavior

| Scenario | Default State | Rationale |
|----------|--------------|-----------|
| Mobile (< 640px) | All sections **collapsed** | Reduces scroll on long reports. Status pills give a quick overview. |
| Desktop (> 1024px) | All sections **expanded** | Screen space allows full view. Collapsing still available via click. |
| Section with critical items | **Expanded** on mobile | Critical findings deserve immediate visibility regardless of viewport. |
| User interaction | Toggle persists during session | Tapping a section header toggles it. State not persisted across page loads. |

### Finding Row

| Element | Style | Behavior |
|---------|-------|----------|
| Row | `space-3` padding, `border-default` bottom (except last) | Individual finding within expanded section body |
| Left border | 3px, status color | Visual status indicator. None for free text items. |
| Status icon | 20x20 | ✓ `status-good`, ⚠ `status-attention`, ✕ `status-critical`. Free text: ✎ `gray-500` |
| Item name | `text-sm`, `font-medium`, `gray-800` | Full item name (no truncation on public report) |
| Observation text | `text-sm`, `gray-600`, below item name | Full observation text. "Sin observaciones" in `gray-400` italic if empty (for checklist items). Omit line entirely for free text with no content. |
| Finding photos | Horizontal row, `space-2` gap | Below observation. See §Photo Display. |

### Photo Display (within findings)

| Element | Style | Behavior |
|---------|-------|----------|
| Thumbnail | 80x80px (mobile), 100x100px (desktop), `radius-sm`, `border-default`, `object-fit: cover` | Cloudinary thumbnail variant (w_200,c_fill) |
| Tap/click | Opens lightbox | Full-resolution photo viewer with prev/next navigation |
| Overflow | Horizontal scroll if > 4 photos | Scrollable row, no wrapping |

---

## Vehicle Photos Gallery

Vehicle overview shots (exterior, VIN plate, odometer, interior). Positioned **immediately below the Vehicle Summary Card** to give the reader visual context before diving into findings — similar to how car listing sites present vehicles.

Photos are filtered by `photo_type = 'vehicle'` (not by `finding_id IS NULL`).

| Element | Style | Behavior |
|---------|-------|----------|
| Section header | "Fotos del vehículo", `text-base`, `font-semibold`, `gray-800` | Positioned below vehicle summary, above inspector card |
| Photo grid | 2-column grid (mobile), 3-column grid (desktop), `space-2` gap | Responsive grid |
| Photo | Aspect ratio preserved, `radius-sm`, `border-default`, `object-fit: cover` | Cloudinary standard variant (w_800) |
| Overflow (6+ photos) | Grid shows first 6 photos, last cell shows "+N" overlay | Tap "+N" opens lightbox at 7th photo |
| Tap/click | Opens lightbox | Same lightbox as finding photos |
| Empty state | Hidden entirely | If no vehicle photos, section not rendered (no gap) |

---

## Photo Lightbox

Full-screen overlay for viewing photos at full resolution.

| Element | Style | Behavior |
|---------|-------|----------|
| Overlay | `rgba(0,0,0,0.9)` bg, fixed, full viewport | Covers entire screen |
| Image | Max-width/height: 90vw/90vh, centered, `object-fit: contain` | Cloudinary full variant |
| Close button (✕) | 32x32, `white`, top-right, 48px touch target | Closes lightbox |
| Previous (◀) | 40x40, `white`, left center, 48px touch target | Previous photo. Hidden on first. |
| Next (▶) | 40x40, `white`, right center, 48px touch target | Next photo. Hidden on last. |
| Caption | `text-sm`, `white`, centered below image | Photo caption if set |
| Swipe | Touch gesture | Swipe left/right to navigate on mobile |
| Keyboard | Left/Right arrows, Escape to close | Desktop navigation |

---

## Correction Notices

### On Original Report (when a correction exists)

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `info` bg tint, `border-default`, `radius-md`, `space-4` padding | Above verification badge |
| Icon | ℹ info icon, `info` color | Left of text |
| Text | `text-sm`, `info` color | "Se ha emitido una corrección para este reporte." |
| Link | `text-sm`, `brand-accent`, "Ver corrección →" | Links to `/report/{correction_slug}` |

### On Correction Report

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `info` bg tint, `border-default`, `radius-md`, `space-4` padding | Above verification badge |
| Icon | ℹ info icon, `info` color | Left of text |
| Text | `text-sm`, `info` color | "Este reporte corrige una inspección anterior." |
| Link | `text-sm`, `brand-accent`, "Ver original →" | Links to `/report/{original_slug}` |

---

## OpenGraph Meta Tags

For rich previews when sharing links on WhatsApp, MercadoLibre, social media, etc.

```html
<meta property="og:type" content="article" />
<meta property="og:title" content="Inspección — Nissan Sentra 2019 | VinDex" />
<meta property="og:description" content="Inspección pre-compra verificada. 12 items bien, 3 atención, 1 crítico. Firmada por AutoCheck Buenos Aires." />
<meta property="og:image" content="https://vindex.app/api/og/{slug}" />
<meta property="og:url" content="https://vindex.app/report/{slug}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Inspección — Nissan Sentra 2019 | VinDex" />
<meta name="twitter:description" content="Inspección pre-compra verificada. 12 items bien, 3 atención, 1 crítico." />
<meta name="twitter:image" content="https://vindex.app/api/og/{slug}" />
```

### OG Image Generation

**Route:** `/api/og/[slug]`

Dynamic image generated per report using `@vercel/og` (Satori + Resvg).

| Element | Style | Notes |
|---------|-------|-------|
| Dimensions | 1200 x 630 px | Standard OG image size |
| Background | White with subtle gradient | Clean, professional |
| VinDex logo | Top-left corner, small | Brand recognition |
| Vehicle name | Large, bold, centered | "{Make} {Model} {Year}" |
| VIN | Smaller, monospace, below vehicle name | "VIN: {vin}" |
| Status summary | Color-coded counts | "✓ 12 Bien · ⚠ 3 Att · ✕ 1 Crit" |
| Inspector name | Bottom section | "Verificada por {node_name}" |
| Verification badge | Shield/checkmark icon | "Inspección Verificada" |
| Date | Bottom-right | Signed date |

---

## Draft Slug Handling

| Scenario | Behavior |
|----------|----------|
| Slug exists, event status = `signed` | Render full public report |
| Slug exists, event status = `draft` | Return 404 page |
| Slug does not exist | Return 404 page |

### 404 Page

| Element | Style | Behavior |
|---------|-------|----------|
| Container | Shell A, centered content | Standard error layout |
| Icon | Search/question icon, 48x48, `gray-400` | Visual indicator |
| Title | `text-xl`, `font-bold`, `gray-800` | "Reporte no encontrado" |
| Message | `text-base`, `gray-500` | "El reporte que buscás no existe o no está disponible." |
| CTA | Ghost button, "Ir al inicio →" | Links to `/` |

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Vehicle summary card:** icon + name on same row, metadata stacked below.
3. **Inspector identity card:** logo (40x40) + name on same row, contact stacked below.
4. **Finding sections:** all collapsed by default (except sections with critical items). Status pills visible in header.
5. **Finding photos:** 80x80 thumbnails, horizontal scroll.
6. **Vehicle photos gallery:** 2-column grid, below vehicle summary card.
7. **Lightbox:** full-screen, swipe navigation.
8. **Text:** all text readable without zoom (min 14px body text).

---

## Desktop Layout (> 1024px)

- Content centered, max-width `768px`.
- Cards have `space-6` internal padding.
- Finding sections: all expanded by default. Collapse toggle available via header click.
- Finding photos: 100x100 thumbnails.
- Vehicle photos gallery: 3-column grid, below vehicle summary card.
- Lightbox: centered with prev/next arrows visible on sides.
- Inspector identity card: logo + name + contact info could be laid out horizontally if wide enough, but keep vertical for simplicity in Phase 3C.

---

## States

### 1. Loading

- Shell A with skeleton placeholders:
  - Verification badge skeleton (full-width, 80px height).
  - Vehicle card skeleton.
  - Inspector card skeleton.
  - 3 section group skeletons.

### 2. Report Loaded (Default)

- All content rendered from server-side data.
- Photos load progressively (skeleton → thumbnail).
- Links to vehicle history and inspector profile are active.

### 3. Report with Correction Notice

- Correction banner visible above verification badge.
- Rest of report renders normally.

### 4. 404 (Not Found / Draft)

- 404 page with message and CTA.

### 5. Photo Lightbox Open

- Overlay covers page.
- Current photo displayed with navigation.
- Body scroll locked.

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Card | shadcn/ui `Card` | Vehicle summary, inspector identity, summary, section containers |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Vehicle history link, inspector profile link, 404 CTA |
| Badge | shadcn/ui `Badge` | Status indicators |
| Skeleton | shadcn/ui `Skeleton` | Loading state |
| Dialog / Overlay | Custom lightbox | Photo full-screen viewer |
| Alert | Custom banner | Correction notices |
| Collapsible | shadcn/ui `Collapsible` or custom `<details>` | Section expand/collapse |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-900`, `status-good`, `status-good-bg`, `status-attention`, `status-attention-bg`, `status-critical`, `status-critical-bg`, `success`, `info`, `error`
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
| Toggle section | Tap section header row | Expands/collapses section body with 200ms animation. Chevron rotates. |
| View vehicle history | Tap "Ver historial del vehículo →" | Navigates to `/vehicle/{vin}` |
| View inspector profile | Tap "Ver perfil del inspector →" | Navigates to `/inspector/{node_slug}` |
| View finding photo | Tap photo thumbnail | Opens lightbox at that photo |
| Navigate photos | Swipe (mobile) or arrows (desktop) | Prev/next photo in lightbox |
| Close lightbox | Tap ✕, swipe down, or press Escape | Closes lightbox |
| View vehicle photo | Tap photo in vehicle gallery | Opens lightbox |
| View correction | Tap correction link in notice | Navigates to correction/original report |
| Go to home | Tap VinDex logo | Navigates to `/` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render for verification badge, vehicle card, inspector card, sections |
| **Verification badge** | Renders signed date/time, user name, node name, immutability notice |
| **Vehicle summary** | Renders make/model/year/trim (omits nulls), VIN, plate (hidden if null), odometer with separator, inspection type, requested by, date, vehicle history link |
| **Inspector identity** | Renders node name, logo (or fallback), verified label, contact email (hidden if null), phone (hidden if null), profile link, brand color accent |
| **Summary card** | Correct status counts, segmented bar, total items, photo count |
| **Section collapse (mobile)** | All sections collapsed by default except those with critical items · Status pills show correct counts per section · Section meta shows "{n} items · {m} fotos" · Chevron rotates on toggle · Smooth height animation |
| **Section collapse (desktop)** | All sections expanded by default · Click header toggles collapse · Same animation behavior |
| **Section headers** | Render in template order, correct section names, status pills with correct counts, zero-count pills hidden |
| **Finding rows** | Status icon correct per status, item name, observation text (or "Sin observaciones"), photo thumbnails, left border color |
| **Free text findings** | ✎ icon, no status border, observation text displayed |
| **Finding photos** | Thumbnails render with correct Cloudinary URL, tap opens lightbox |
| **Vehicle photos gallery** | Gallery renders below vehicle summary card (not at bottom), grid renders with correct columns per viewport, tap opens lightbox, hidden when 0 photos, overflow "+N" shown when > 6 photos |
| **Photo lightbox** | Opens on thumbnail tap, prev/next navigation, close button, swipe (if testable), caption display |
| **Correction notices** | Original shows "correction issued" with link, correction shows "corrects original" with link, not shown when no correction |
| **OG meta tags** | Page includes correct og:title, og:description, og:image, og:url |
| **OG image route** | Returns 200 with content-type image/png, correct dimensions (~1200x630) |
| **404 page** | Draft slug returns 404 page, unknown slug returns 404 page, signed slug renders report |
| **Vehicle history link** | Links to correct `/vehicle/{vin}` URL |
| **Inspector profile link** | Links to correct `/inspector/{node_slug}` URL |
| **Mobile layout** | Cards full-width, photos 80px, 2-column general photos grid |
| **Desktop layout** | Content max-width 768px, photos 100px, 3-column general photos grid |

---

## Accessibility

- All content readable without authentication.
- All images have `alt` text: finding photos use "{item_name} - foto {n}", vehicle photos use "Foto del vehículo {n}".
- Status icons have `aria-label` alternatives (e.g., "Estado: Bien", "Estado: Atención").
- Links have descriptive text (not "click here").
- Lightbox traps focus when open, returns focus to trigger element on close.
- Lightbox supports keyboard navigation (arrows, Escape).
- Verification badge uses semantic HTML (`<aside>` or `<section>` with `role="status"`).
- Page is fully navigable via keyboard.
- All text meets WCAG AA contrast ratios on white background.
- Segmented status bar has `aria-label` with textual summary for screen readers.
- Collapsible sections use `aria-expanded` on the header button and `aria-controls` pointing to the body.
- Section status pills have `aria-label` (e.g., "3 items bien, 1 atención") for screen readers.
- Responsive images load appropriate sizes via Cloudinary transformations (no unnecessary bandwidth on mobile).
