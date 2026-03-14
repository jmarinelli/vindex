# UI Spec: Inspection Form

*Screen specification for the inspection creation flow (Steps 1–3).*
*Derived from: specs/flows/inspection-creation.md | specs/ui/design-system.md | specs/entities/event.md | specs/entities/vehicle.md | specs/entities/inspection-detail.md | specs/entities/inspection-finding.md | specs/entities/event-photo.md*

---

## Overview

Three-step flow for creating and filling an inspection. Steps 1–2 use **Shell B** (Dashboard). Step 3 uses **Shell C** (Field Mode) — the primary mobile-first inspection interface.

---

## Step 1: Vehicle Identification

**Route:** `/dashboard/inspect`
**Shell:** B (Dashboard)

### Shell B Context

- **Top bar (64px):** Logo (left) · "Nueva Inspección" (center) · User menu (right).
- **Content area:** max-width `768px`, centered. Background `gray-50`.

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Dashboard]          Nueva Inspección                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Paso 1 de 2 — Vehículo                                │
│  ───────────────────────                                │
│                                                         │
│  Número de VIN                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 3N1AB7AP5KY250312                               │    │
│  └─────────────────────────────────────────────────┘    │
│  17/17 caracteres                              ✓ Válido │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🚗 Nissan Sentra 2019 — SR                     │    │
│  │    VIN: 3N1AB7AP5KY250312                       │    │
│  │    ℹ Este vehículo ya tiene 2 inspecciones      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Patente (opcional)                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ AC123BD                                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [              Continuar              ]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### VIN Input

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | Static |
| Input | `text-lg`, `font-mono`, uppercase, 40px height, `radius-sm`, `border-default` | Auto-uppercase, strips spaces, `border-focus` on focus |
| Character counter | `text-xs`, `gray-500`, right-aligned below input | Updates on each keystroke: "{n}/17 caracteres" |
| Valid indicator | `text-xs`, `success` color, "✓ Válido" | Shown only when VIN passes full validation |
| Error message | `text-xs`, `error` color | Inline below input: specific error text |

### Decoded Vehicle Card

- Background: `gray-50`, `border-default`, `radius-md`.
- Icon: car emoji or vehicle icon, `text-2xl`.
- Vehicle name: `text-lg`, `font-medium`, `gray-800` — "{Make} {Model} {Year} — {Trim}".
- VIN echo: `text-sm`, `gray-500`, monospace.
- Existing inspections notice: `text-sm`, `info` color, with ℹ icon.

### Decode Loading State

- Spinner icon next to the input field.
- Text below: `text-sm`, `gray-500`, "Decodificando VIN...".
- Continue button disabled during decode.

### Decode Failure State

- Warning banner: `warning` background tint, `radius-sm`, `text-sm`.
- Message: "No se pudo decodificar el VIN. Podés ingresar los datos manualmente."
- Manual entry fields appear below:
  - Make (text input, optional)
  - Model (text input, optional)
  - Year (number input, optional)
  - Trim (text input, optional)
- Each field: label + input, standard form styling.

### Plate Input

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | Static |
| Input | `text-base`, 40px height, `radius-sm`, `border-default`, uppercase | Optional, max 20 chars |

### Continue Button

- Full-width primary button, 48px height, `radius-sm`.
- Label: "Continuar".
- Disabled state: `gray-100` bg, `gray-400` text — when VIN is invalid.
- Enabled: `brand-primary` bg, `white` text.
- On mobile: fixed at bottom as full-width button (same pattern as template editor save).

---

## Step 2: Inspection Metadata

**Route:** `/dashboard/inspect/metadata`
**Shell:** B (Dashboard)

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Volver]            Nueva Inspección                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Paso 2 de 2 — Datos de inspección                      │
│  ──────────────────────────────                         │
│                                                         │
│  Nissan Sentra 2019 — AC123BD                           │
│                                                         │
│  Tipo de inspección                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ● Pre-compra                                    │    │
│  │ ○ Recepción                                     │    │
│  │ ○ Periódica                                     │    │
│  │ ○ Otra                                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Solicitada por                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ● Comprador                                     │    │
│  │ ○ Vendedor                                      │    │
│  │ ○ Agencia                                       │    │
│  │ ○ Otro                                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Kilometraje                                            │
│  ┌──────────────────────────────────────────┐  km       │
│  │                                  87500  │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  Fecha de inspección                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 2026-03-13                                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [           Iniciar Inspección           ]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Vehicle Summary (Top)

- `text-lg`, `font-medium`, `gray-800`: "{Make} {Model} {Year}".
- `text-sm`, `gray-500`: "Patente: {plate}" (if provided).
- Separator: 1px `gray-200` line below.

### Radio Button Groups

| Element | Style | Behavior |
|---------|-------|----------|
| Group container | Card: `white` bg, `border-default`, `radius-md` | Contains all options |
| Option row | 56px height, `padding` 16px, `border-default` bottom (except last) | Full-width tap target |
| Radio circle | 20px, `gray-300` border, `white` fill. Selected: `brand-accent` fill + border | Standard radio styling |
| Option label | `text-base`, `gray-800`. Selected: `font-medium` | Clear, readable |

### Odometer Input

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | Static |
| Input | `text-lg`, `font-medium`, right-aligned, 48px height, `radius-sm` | `type="number"`, `inputmode="numeric"` |
| Suffix | `text-base`, `gray-500`, "km" — positioned right of input | Static |
| Error | `text-xs`, `error` color | "Ingresá un kilometraje válido" if zero/negative |

### Date Input

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | Static |
| Input | `text-base`, 40px height, `radius-sm`, `border-default` | Native `<input type="date">`, default today |

### Start Button

- Full-width primary button, 48px height, `radius-sm`.
- Label: "Iniciar Inspección".
- Disabled while creating (spinner + "Creando...").
- On mobile: fixed at bottom.

---

## Step 3: Field Mode (Findings Form)

**Route:** `/dashboard/inspect/[id]`
**Shell:** C (Field Mode)

This is the most critical screen. Optimized for one-handed mobile use in field conditions.

### Shell C Layout

```
┌──────────────────────────────────────┐
│  Nissan Sentra 2019     3/9  ●  ✕    │ ← top bar, 48px, fixed
├──────────────────────────────────────┤
│ [Ext] [Motor] [Int] [Tren] [→]      │ ← section tabs, 44px, fixed
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📷 Fotos del vehículo (3)  ▾ │  │ ← collapsible vehicle photos
│  │ [img1] [img2] [img3] [ + ]   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │▌Carrocería y pintura          │  │
│  │ [✓ Bien][⚠ Att][✕ Cri][— N/E]│  │ ← status buttons, 56px
│  │                                │  │
│  │ Observación:                   │  │
│  │ ┌──────────────────────────┐   │  │
│  │ │ Agregar observación...   │   │  │ ← auto-expanding textarea
│  │ └──────────────────────────┘   │  │
│  │ 📷 Agregar foto [thumb][thumb]│  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │▌Vidrios y espejos             │  │ ← scrollable item list
│  │ [✓ Bien][⚠ Att][✕ Cri][— N/E]│  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│  [◀ Anterior]  📷 Foto  [Siguiente ▶]│ ← bottom bar, 56px, fixed
└──────────────────────────────────────┘
```

### Top Bar (Fixed, 48px)

| Element | Style | Behavior |
|---------|-------|----------|
| Vehicle name | `text-sm`, `font-medium`, `gray-800`, truncate with ellipsis | "{Make} {Model} {Year}" |
| Section progress | `text-xs`, `gray-500` | "{n}/{total}" — updates on tab change |
| Sync indicator | `text-xs`, see §Sync Indicator below | Shows save/sync status |
| Close button (✕) | `gray-400`, 24x24, hover `gray-600` | Navigate to dashboard. Draft auto-saved. |
| Background | `white`, `border-default` bottom | Fixed position |

### Section Tabs (Fixed, 44px)

| Element | Style | Behavior |
|---------|-------|----------|
| Tab container | `white` bg, `border-default` bottom, `overflow-x: auto`, no visible scrollbar | Horizontal scroll |
| Active tab | `brand-accent` text, `font-medium`, 2px bottom border `brand-accent` | Highlighted |
| Inactive tab | `gray-500` text, no border | Tappable, 44px height, `padding` 0 16px |
| Completed indicator | Small ✓ icon after section name, `success` color, `text-xs` | Shown when all items in section have status ≠ not_evaluated |
| Touch target | 44px height, text width + 32px horizontal padding | Scrollable |

### Vehicle Photos Section (Top of Scrollable Content)

A dedicated, collapsible section at the **top of the item area**, above the first item card. This is where the inspector captures vehicle overview photos (exterior, VIN plate, odometer, interior). It mirrors the position these photos will have in the public report (just below the vehicle summary).

Photos are stored with `photo_type = 'vehicle'` and `finding_id = null`.

```
┌─────────────────────────────────────────┐
│ 📷 Fotos del vehículo (3)           ▾  │ ← collapsible header
├─────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ img1 │ │ img2 │ │ img3 │ │  +   │   │ ← 2-col grid + add button
│ └──────┘ └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `border-default`, `radius-md`, `shadow-sm` | Positioned above the first item card in the scrollable area |
| Header | `text-sm`, `font-medium`, `gray-700`, with 📷 icon, full-width tap target | Tap toggles expand/collapse. Shows photo count: "Fotos del vehículo ({n})" |
| Chevron | 16x16, `gray-400` | ▾ expanded, ▸ collapsed. Rotates with 150ms transition. |
| Photo grid | 2-column grid, `space-2` gap, `space-3` padding | 80x80 thumbnails, `radius-sm`, `border-default`, `object-fit: cover` |
| Add button | 80x80, dashed `gray-300` border, `radius-sm`, camera icon `gray-400` | Opens device camera for new vehicle photo |
| Thumbnail tap | Opens full-screen viewer | Same as finding photo viewer |
| Thumbnail long-press | Delete photo (draft only) | Confirmation: removes from Dexie and grid |
| Collapse default | **Collapsed** when 0 photos, **expanded** when ≥ 1 | Auto-expands when first vehicle photo is captured |
| Bottom bar camera | Same bottom bar camera button | Shortcut: adds vehicle photo AND auto-expands this section if collapsed |

### Item Cards

Items are displayed as vertically stacked cards within the active section, below the vehicle photos section.

#### Checklist Item Card

```
┌─────────────────────────────────────────┐
│▌Estado de carrocería y pintura         │ ← item name + status border
├─────────────────────────────────────────┤
│ [✓ Bien] [⚠ Att ] [✕ Crit] [— N/E ]  │ ← status buttons
│                                         │
│ Observación:                            │
│ ┌─────────────────────────────────────┐ │
│ │ Rayón profundo en puerta trasera    │ │ ← auto-expanding textarea
│ │ derecha, 15cm aprox.                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📷 Agregar foto  [img1] [img2]         │ ← photo row
└─────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-4` padding | Stack within section |
| Left border | 3px, status color (green/amber/red/gray) | Visual status indicator |
| Item name | `text-base`, `font-medium`, `gray-800` | Static |
| Status buttons | 4-column grid, 56px height per button, `space-2` gap | See §Status Buttons |
| Observation label | `text-xs`, `gray-500`, "Observación:" | Static |
| Observation textarea | `text-base`, `border-default`, `radius-sm`, auto-expanding, min 1 line | Placeholder "Agregar observación...", debounced 500ms auto-save |
| Photo button | 48x48, `gray-200` border, `radius-sm`, camera icon `gray-500` | Opens device camera |
| Photo thumbnails | 64x64, `radius-sm`, `border-default` | Horizontal scroll if many, tap = full view, long-press = delete |
| Card gap | `space-4` between cards | Consistent spacing |

#### Free Text Item Card

```
┌─────────────────────────────────────────┐
│ Observaciones generales y recomendación │ ← item name
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Vehículo en buen estado general    │ │ ← larger textarea, min 3 lines
│ │ para el kilometraje. El rayón...   │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📷 Agregar foto  [img1]               │
└─────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | Same as checklist card but no left border color | No status concept |
| Item name | `text-base`, `font-medium`, `gray-800` | Static |
| Textarea | `text-base`, `border-default`, `radius-sm`, auto-expanding, min 3 lines | Placeholder "Escribir...", debounced 500ms auto-save |
| Photo row | Same as checklist card | Same behavior |

### Status Buttons

The most critical interaction component. Four equal-width buttons in a row.

```
┌──────────┬──────────┬──────────┬──────────┐
│ ✓ Bien   │ ⚠ Att    │ ✕ Crit   │ — N/E    │
└──────────┴──────────┴──────────┴──────────┘
```

| State | Background | Border | Text | Font Weight |
|-------|-----------|--------|------|-------------|
| Unselected | `white` | 1px `gray-200` | `gray-600` | 400 |
| Good (selected) | `status-good-bg` | 2px `status-good` | `status-good` | 600 |
| Attention (selected) | `status-attention-bg` | 2px `status-attention` | `status-attention` | 600 |
| Critical (selected) | `status-critical-bg` | 2px `status-critical` | `status-critical` | 600 |
| Not Evaluated (selected) | `status-not-evaluated-bg` | 2px `status-not-evaluated` | `status-not-evaluated` | 600 |

- **Height:** 56px minimum.
- **Radius:** `radius-sm` on outer edges of first and last button.
- **Icons:** small icon left of text label. ✓, ⚠, ✕, — respectively.
- **Touch behavior:** single tap selects. Tapping the already-selected button deselects (returns to `not_evaluated`).
- **Immediate save:** status change writes to Dexie immediately (no debounce).

### Bottom Bar (Fixed, 56px)

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `shadow-top`, `padding` 8px 16px | Fixed bottom |
| Previous button | Ghost button, `gray-600` text, "◀ Anterior" | Navigate to previous section. Disabled (gray-300) on first section. |
| Camera button | `brand-primary` icon, 48x48, center | Adds vehicle photo (`photo_type = 'vehicle'`, not tied to finding). Auto-expands vehicle photos section if collapsed. |
| Next button | Ghost button, `brand-primary` text, "Siguiente ▶" | Navigate to next section. On last section: "Revisar ▶" |
| Touch targets | 48px minimum height | All buttons |

### Sync Indicator

| State | Display | Position |
|-------|---------|----------|
| Saved locally | `gray-400` text: "Guardado" + `text-xs` check icon | Top bar, right of progress |
| Syncing | `gray-400` text: "Sincronizando..." + spinner icon | Same |
| Synced | `success` text: "Sincronizado" + check icon (fades to gray after 2s) | Same |
| Offline | `warning` text: "Sin conexión" + cloud-off icon | Same |

---

## Mobile Layout (< 640px)

Steps 1 & 2 follow the same mobile adaptations as the template editor:

1. **Back link:** left-aligned in top bar.
2. **Continue/Start button:** fixed full-width at bottom (56px, `shadow-top`, `white` bg, `space-4` padding). Removed from inline flow.
3. **Content area:** full-width, no horizontal padding from page container. Cards have internal `space-4` padding.
4. **Radio button groups:** full-width rows, 56px height per option.
5. **VIN input:** full-width, `text-lg` for readability and to prevent iOS zoom.

Step 3 (Field Mode) IS the mobile layout. See §Desktop Layout for tablet/desktop adaptations.

---

## Desktop Layout (> 1024px)

### Steps 1 & 2

- Content centered, max-width `768px`.
- Form cards have `space-6` internal padding.
- Continue/Start button inline (not fixed at bottom).
- Radio button groups could potentially be displayed as a 2x2 grid, but kept as vertical list for Phase 2 simplicity.

### Step 3 (Field Mode) — Tablet / Desktop (≥ 640px)

The single-column layout is preserved — no side panels or multi-column grids. Adaptations for the larger viewport:

| Element | Mobile (< 640px) | Tablet / Desktop (≥ 640px) |
|---------|-------------------|----------------------------|
| Content area | Full width | max-width `768px`, centered (`mx-auto`) |
| Top bar | Full width, 48px | Full viewport width, 48px |
| Section tabs | Full width, scroll | Full viewport width, centered text, scroll if needed |
| Bottom bar | Full width, 56px | Full viewport width, 56px |
| Item card padding | `space-4` | `space-6` |
| Photo thumbnails | 64x64px | 80x80px |
| Status buttons | 56px height | 56px height (unchanged) |
| Observation textarea | `text-base` | `text-base` (unchanged) |

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Nissan Sentra 2019                              3/9  Guardado  ✕       │ ← top bar, full width
├──────────────────────────────────────────────────────────────────────────┤
│      [Ext] [Motor] [Int] [Tren] [Mec.] [Ruta] [Elec.] [Doc.] [Concl.] │ ← tabs, centered
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              ┌────────────────────────────────────────────┐              │
│              │ 📷 Fotos del vehículo (3)              ▾  │              │
│              │ [img1] [img2] [img3] [ + ]                │              │
│              └────────────────────────────────────────────┘              │
│                                                                          │
│              ┌────────────────────────────────────────────┐              │
│              │▌Carrocería y pintura                       │              │
│              │ [✓ Bien] [⚠ Att ] [✕ Crit] [— N/E ]      │              │
│              │                                            │              │
│              │ Observación:                               │              │
│              │ ┌────────────────────────────────────────┐ │              │
│              │ │ Agregar observación...                 │ │              │
│              │ └────────────────────────────────────────┘ │              │
│              │ 📷 Agregar foto [thumb] [thumb]           │              │
│              └────────────────────────────────────────────┘              │
│                                                                          │
│              ┌────────────────────────────────────────────┐              │
│              │▌Vidrios y espejos                         │              │
│              │ [✓ Bien] [⚠ Att ] [✕ Crit] [— N/E ]      │              │
│              │ ...                                        │              │
│              └────────────────────────────────────────────┘              │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  [◀ Anterior]              📷 Foto              [Siguiente ▶]           │ ← bottom bar, full width
└──────────────────────────────────────────────────────────────────────────┘
```

The key principle: **same flow, more breathing room.** No layout changes that would confuse an inspector switching between phone and tablet.

---

## States

### Step 1 States

#### 1. Initial (Empty)

- VIN input empty, no character counter visible (or "0/17").
- Decoded vehicle card hidden.
- Continue button disabled.

#### 2. VIN Partial

- VIN input has < 17 characters.
- Character counter updates live.
- No validation error yet (only shown after blur or when VIN = 17 chars but invalid).
- Continue button disabled.

#### 3. VIN Valid + Decoding

- VIN has 17 valid characters.
- Spinner next to input, "Decodificando VIN..." below.
- Continue button disabled during decode.

#### 4. VIN Valid + Decoded

- Decoded vehicle card visible with make/model/year/trim.
- Character counter shows "17/17 caracteres ✓ Válido".
- Continue button enabled.

#### 5. VIN Valid + Decode Failed

- Warning banner visible.
- Manual entry fields (Make, Model, Year, Trim) visible below.
- Continue button enabled (manual data is optional).

#### 6. VIN Invalid

- Inline error below input with specific message.
- Continue button disabled.

### Step 2 States

#### 1. Default

- Pre-compra and Comprador pre-selected.
- Date defaults to today.
- Odometer empty.
- Start button enabled.

#### 2. Creating

- Start button shows spinner + "Creando...".
- All inputs disabled.

#### 3. Error

- Toast: "Error al crear la inspección. Intentá de nuevo."
- Start button re-enabled.

### Step 3 States (Field Mode)

#### 1. Loading

- Shell C with skeleton placeholders:
  - Top bar with gray rectangles.
  - Tab bar with 3 skeleton tabs.
  - 2 skeleton item cards with pulse animation.

#### 2. Active (Editing)

- Template snapshot rendered as sections and items.
- First section active.
- All items in default state (`not_evaluated`).
- Sync indicator: "Guardado".

#### 3. Partially Filled

- Some items have status set (colored left border).
- Some items have observations.
- Section tabs show completion indicators for fully evaluated sections.
- Sync indicator cycles through states as changes are saved.

#### 4. Offline

- Sync indicator: "Sin conexión — guardado local" in `warning` color.
- All interactions continue normally (status changes, observations, photos all saved to Dexie).
- Photo thumbnails show cloud-off overlay.

#### 5. Photo Uploading

- Thumbnail appears immediately (local blob).
- Subtle progress overlay on thumbnail during upload.
- Clean thumbnail after successful upload.
- Red border + retry icon on failed upload.

#### 6. Empty Section

- Section tab exists but content area shows centered message: "Esta sección no tiene items."
- `gray-500` text, `text-sm`.

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | Continue, Start, Status buttons (custom) |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Back link, Previous/Next navigation |
| Button (Icon) | shadcn/ui `Button variant="ghost" size="icon"` | Close (✕), Camera (📷) |
| Card | shadcn/ui `Card` | Vehicle decode result, item cards, radio groups |
| Input | shadcn/ui `Input` | VIN, plate, odometer, manual vehicle fields |
| Textarea | HTML `<textarea>` with auto-expand | Observations |
| RadioGroup | shadcn/ui `RadioGroup` + `RadioGroupItem` | Inspection type, requested by |
| Toast | shadcn/ui `Sonner` / toast | Errors, sync feedback |
| Skeleton | shadcn/ui `Skeleton` | Loading states |
| Tabs | Custom horizontal scroll tabs | Section navigation in field mode |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-900`, `status-good`, `status-good-bg`, `status-attention`, `status-attention-bg`, `status-critical`, `status-critical-bg`, `status-not-evaluated`, `status-not-evaluated-bg`, `error`, `success`, `warning`, `info`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200), `border-focus` (2px solid brand-accent)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards), `shadow-top` (fixed bottom bars)
- **Touch targets:** 48x48px minimum interactive, 56px for status buttons and radio rows

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Enter VIN | Type in VIN input | Auto-uppercase, validate, decode on 17 chars |
| Continue (Step 1) | Tap Continue button | Create/find vehicle, navigate to Step 2 |
| Select inspection type | Tap radio option | Radio selected, visual update |
| Select requested by | Tap radio option | Radio selected, visual update |
| Enter odometer | Type number | Number input with numeric keyboard |
| Start inspection | Tap "Iniciar Inspección" | Create event + detail + findings, navigate to Field Mode |
| Switch section | Tap section tab | Content switches to selected section's items |
| Set item status | Tap status button | Button highlights, left border updates, auto-save to Dexie |
| Deselect status | Tap already-selected status | Returns to not_evaluated |
| Write observation | Type in textarea | Auto-expand, debounced 500ms auto-save |
| Take finding photo | Tap 📷 on item card | Device camera → compress → save blob → upload in bg |
| Take vehicle photo | Tap 📷 in bottom bar or "+" in vehicle photos section | Adds photo with `photo_type = 'vehicle'`, auto-expands section |
| Navigate prev/next | Tap ◀/▶ in bottom bar | Section changes, tabs scroll |
| Close inspection | Tap ✕ in top bar | Draft saved, navigate to dashboard |
| View photo | Tap thumbnail | Full-screen photo viewer |
| Delete photo | Long-press thumbnail | Remove photo (draft only) |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Step 1 — VIN input** | Input renders with placeholder · Auto-uppercase on type · Character counter updates · Valid VIN shows "✓ Válido" · Invalid chars (I, O, Q) show error · Continue disabled when invalid · Continue enabled when valid |
| **Step 1 — VIN decode** | Decode triggers at 17 chars · Loading spinner shown · Success populates vehicle card · Failure shows warning + manual fields · Existing vehicle shows inspection count |
| **Step 1 — Continue** | Calls findOrCreateVehicle · Navigates to Step 2 on success · Shows error toast on failure |
| **Step 2 — Radio groups** | Renders 4 options each · Default selections correct · Tap changes selection · Only one selected per group |
| **Step 2 — Odometer** | Renders number input · Accepts positive numbers · Rejects zero/negative · Shows error for invalid |
| **Step 2 — Date** | Defaults to today · Accepts valid dates · Native date picker |
| **Step 2 — Start** | Creates inspection on tap · Shows spinner during creation · Error toast on failure · Navigates to field mode on success |
| **Step 3 — Loading** | Skeleton tabs + cards render |
| **Step 3 — Section tabs** | Tabs render from template · Active tab highlighted · Tap switches content · Scroll behavior · Completed sections show ✓ |
| **Step 3 — Status buttons** | 4 buttons render per checklist item · Tap selects · Tap selected deselects · Correct colors per status · Auto-save on change |
| **Step 3 — Observation** | Textarea renders with placeholder · Auto-expands · Debounced 500ms save · Text persists on section switch |
| **Step 3 — Vehicle photos section** | Section renders collapsed when empty · Expands when photos exist · Add photo via section button works · Add photo via bottom bar camera expands section · Remove photo works (draft only) · Photo grid displays correct thumbnails |
| **Step 3 — Finding photos** | Camera button on item card triggers file input · Thumbnail appears after capture · Upload indicator states · Long-press to delete |
| **Step 3 — Free text card** | No status buttons · Larger textarea · Photo row works |
| **Step 3 — Bottom bar** | Previous disabled on first section · Next disabled on last (or label "Revisar") · Camera adds vehicle photo and expands vehicle photos section |
| **Step 3 — Sync indicator** | Shows saved/syncing/synced/offline correctly |
| **Step 3 — Offline** | Status changes saved to Dexie · Observations saved · Photos saved as blobs · Sync indicator shows offline · Reconnect triggers sync |
| **Step 3 — Draft resume** | Navigating away and back restores state · Browser refresh restores from Dexie |
| **Mobile layout** | Steps 1–2: button fixed at bottom · Step 3: full mobile layout renders correctly |

---

## Accessibility

- All interactive elements meet 48x48px touch targets on mobile.
- VIN input has associated label (visually shown).
- Radio button groups use native `<input type="radio">` with proper labeling.
- Status buttons have `role="radiogroup"` with individual `role="radio"` and `aria-checked`.
- Observation textareas have associated labels (visually hidden if needed).
- Section tabs use `role="tablist"` with `role="tab"` and `aria-selected`.
- Photo thumbnails have `alt` text describing the photo context.
- Sync indicator has `aria-live="polite"` for screen reader updates.
- Keyboard navigation: Tab through elements, Enter to activate buttons, Escape to close.
- Focus management: auto-focus on VIN input (Step 1), first status button of first item (Step 3).
- Color is not the only indicator: status buttons include text labels and icons alongside color.
