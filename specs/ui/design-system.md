# Design System

*Visual contract for the entire application. All UI specs inherit from this document.*

---

## 1. Screen Map

```
Landing (/)
│  └── "¿Sos inspector? Contactanos" CTA
│
├── Login (/login)
│   └── → Dashboard
│
├── Dashboard (/dashboard)                        [auth: inspector]
│   ├── → New Inspection (/dashboard/inspect)
│   ├── → Edit Template (/dashboard/template)
│   ├── → View Draft → resume editing
│   ├── → View Signed → public report
│   └── → My Profile → /inspector/{slug}
│
├── New Inspection (/dashboard/inspect)           [auth: inspector]
│   ├── Step 1: Vehicle Identification
│   ├── Step 2: Inspection Metadata
│   ├── Step 3: Findings Form (field mode)
│   └── Step 4: Review & Sign → Confirmation + share link
│
├── Template Editor (/dashboard/template)         [auth: inspector]
│
├── Public Report (/report/{slug})                [no auth]
│   ├── → Inspector Profile
│   ├── → Vehicle Page
│   └── → Leave Review
│
├── Inspector Profile (/inspector/{slug})         [no auth]
│   └── → Individual reports
│
├── Vehicle Page (/vehicle/{vin})                 [no auth]
│   └── → Individual events
│
└── Admin (/admin)                                [auth: platform_admin]
    ├── Nodes list + create
    ├── Users list + create
    └── Metrics dashboard
```

---

## 2. Design Tokens

### 2.1 Colors

**Brand**

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#1E293B` | Primary actions, headers, links |
| `brand-primary-hover` | `#0F172A` | Hover state |
| `brand-accent` | `#0EA5E9` | Active states, focus rings, highlights |

**Status** — the most important colors in the system. Used on every inspection form and report.

| Token | Hex | Usage |
|-------|-----|-------|
| `status-good` | `#16A34A` | Good condition — green |
| `status-good-bg` | `#F0FDF4` | Good background fill |
| `status-attention` | `#D97706` | Attention needed — amber |
| `status-attention-bg` | `#FFFBEB` | Attention background fill |
| `status-critical` | `#DC2626` | Critical issue — red |
| `status-critical-bg` | `#FEF2F2` | Critical background fill |
| `status-not-evaluated` | `#6B7280` | Not evaluated — gray |
| `status-not-evaluated-bg` | `#F9FAFB` | Not evaluated background fill |

**Neutrals**

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#F9FAFB` | Page backgrounds |
| `gray-100` | `#F3F4F6` | Card backgrounds, subtle borders |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-300` | `#D1D5DB` | Disabled states |
| `gray-400` | `#9CA3AF` | Placeholder text |
| `gray-500` | `#6B7280` | Secondary text |
| `gray-600` | `#4B5563` | Body text |
| `gray-700` | `#374151` | Headings |
| `gray-800` | `#1F2937` | Primary text |
| `gray-900` | `#111827` | Emphasis text |
| `white` | `#FFFFFF` | Cards, inputs, surfaces |

**Semantic**

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#16A34A` | Success messages, confirmations |
| `warning` | `#D97706` | Warnings |
| `error` | `#DC2626` | Errors, destructive actions |
| `info` | `#0EA5E9` | Informational messages |

### 2.2 Typography

System font stack — no custom fonts to load (performance, offline).

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 12px | 400 | 16px | Captions, timestamps, metadata |
| `text-sm` | 14px | 400 | 20px | Secondary text, labels |
| `text-base` | 16px | 400 | 24px | Body text, form inputs |
| `text-lg` | 18px | 500 | 28px | Section headings in forms |
| `text-xl` | 20px | 600 | 28px | Page subtitles |
| `text-2xl` | 24px | 700 | 32px | Page titles |
| `text-3xl` | 30px | 700 | 36px | Hero text (landing, report vehicle name) |

**Minimum input font size: 16px.** This prevents iOS from zooming into form inputs.

### 2.3 Spacing

Base unit: **4px**. All spacing is a multiple of the base.

| Token | Value | Common usage |
|-------|-------|-------------|
| `space-1` | 4px | Tight gaps (icon to label) |
| `space-2` | 8px | Inside compact elements |
| `space-3` | 12px | Input padding, small gaps |
| `space-4` | 16px | Standard gap between elements |
| `space-5` | 20px | Between card sections |
| `space-6` | 24px | Between components |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Large section spacing |
| `space-12` | 48px | Page section spacing |

### 2.4 Touch Targets

**Minimum touch target: 48x48px** (all interactive elements).

- Status buttons in inspection form: **full width, divided into 4 columns, 56px tall minimum**.
- Bottom bar actions: **56px tall**.
- Navigation tabs: **44px tall minimum**, full text width + 16px horizontal padding.
- Camera/photo button: **48x48px minimum**, with clear icon.

### 2.5 Borders and Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Buttons, inputs |
| `radius-md` | 8px | Cards |
| `radius-lg` | 12px | Modals, large cards |
| `radius-full` | 9999px | Badges, pills, avatars |

| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | 1px solid `gray-200` | Cards, inputs |
| `border-focus` | 2px solid `brand-accent` | Focus state |

### 2.6 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation (cards) |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Floating elements |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `shadow-top` | `0 -2px 4px rgba(0,0,0,0.05)` | Fixed bottom bars |

---

## 3. Layout Patterns

### 3.1 Shell A — Public Pages

Used by: verified report, vehicle page, inspector profile, landing.

```
┌──────────────────────────────────┐
│  Logo (small)          [nav?]    │ ← minimal top bar, 56px
├──────────────────────────────────┤
│                                  │
│                                  │
│         Content Area             │ ← scrollable, max-width 768px centered
│                                  │
│                                  │
├──────────────────────────────────┤
│  "Verified on VinDex"  •  Links  │ ← footer, platform attribution
└──────────────────────────────────┘
```

- **White-label principle:** on report pages, the inspector's brand is prominent (name, logo, contact). The platform appears only as footer-level attribution: "Verificado en VinDex" with a small logo.
- **Max content width:** 768px. Centered on desktop. Full width on mobile.
- **Background:** `gray-50`. Content on `white` cards.

### 3.2 Shell B — Dashboard (Authenticated)

Used by: inspector dashboard, template editor, admin panel.

```
┌──────────────────────────────────┐
│  Logo     Dashboard    [User ▾]  │ ← top bar, 64px, white bg
├──────────────────────────────────┤
│                                  │
│                                  │
│         Content Area             │ ← scrollable, max-width 1024px centered
│                                  │
│                                  │
└──────────────────────────────────┘
```

- **Top bar:** platform logo (left), current section name (center), user menu dropdown (right).
- **No sidebar.** The dashboard is simple enough for a single-column layout. Navigation is via top bar and in-page links.
- **Max content width:** 1024px on desktop. Full width on mobile.
- **Background:** `gray-50`. Content on `white` cards.

### 3.3 Shell C — Field Mode (Inspection Form)

Used by: inspection creation (Step 3 — Findings Form).

This is the most critical layout. Optimized for one-handed mobile use in hostile conditions (garage, outdoor, dirty hands).

```
┌──────────────────────────────────┐
│  Nissan Sentra 2019     3/7  ✕   │ ← vehicle info + section progress, 48px, fixed
├──────────────────────────────────┤
│ [Ext] [Motor] [Int] [Tren] [→]  │ ← section tabs, horizontal scroll, 44px, fixed
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ Carrocería y pintura       │  │
│  │ [✓ Bien][⚠ Att][✕ Cri][—] │  │ ← status buttons, 56px tall
│  │                            │  │
│  │ Observación: [tap to add]  │  │ ← expandable textarea
│  │ 📷 Foto   [thumb] [thumb]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │ ← scrollable item list
│  │ Vidrios y espejos          │  │
│  │ [✓ Bien][⚠ Att][✕ Cri][—] │  │
│  │ ...                        │  │
│  └────────────────────────────┘  │
│                                  │
├──────────────────────────────────┤
│  [◀ Prev]    📷 Foto   [Next ▶] │ ← bottom bar, 56px, fixed, shadow-top
└──────────────────────────────────┘
```

- **Fixed top bar:** vehicle make/model/year (abbreviated), section progress indicator (e.g., "3/7"), close/back button. 48px. Compact because vertical space is premium on mobile.
- **Fixed section tabs:** horizontally scrollable. Active section highlighted with `brand-accent` underline. Tap to jump, swipe to change.
- **Scrollable content:** item cards stacked vertically. Each card is self-contained with status + observation + photos.
- **Fixed bottom bar:** previous/next section navigation + camera shortcut (quick-add general photo). 56px. `shadow-top` to separate from content.
- **No page-level scrollbar issues:** only the content area scrolls. Top bar, tabs, and bottom bar are fixed.

---

## 4. Component Patterns

### 4.1 Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| Primary | `brand-primary` bg, white text, `radius-sm` | Main actions (Sign, Save, Create) |
| Secondary | white bg, `gray-200` border, `gray-700` text | Secondary actions (Cancel, Back) |
| Ghost | transparent bg, `brand-primary` text | Tertiary actions, inline links |
| Destructive | `error` bg, white text | Destructive actions (Delete draft) |
| Disabled | `gray-100` bg, `gray-400` text | Disabled state for any variant |

Sizes:
- `sm`: 32px height, `text-sm`, 12px horizontal padding
- `md`: 40px height, `text-base`, 16px horizontal padding (default)
- `lg`: 48px height, `text-lg`, 20px horizontal padding (field mode actions)

### 4.2 Status Buttons (Inspection Form)

The most used component. Four equal-width buttons in a row, 56px tall minimum.

```
┌────────┬────────┬────────┬────────┐
│ ✓ Bien │ ⚠ Att  │ ✕ Crit │ — N/E  │
└────────┴────────┴────────┴────────┘
```

- **Unselected:** white bg, `gray-200` border, `gray-600` text.
- **Selected:** status color bg (e.g., `status-good-bg`), status color border (2px), status color text, bold.
- **Touch behavior:** single tap selects. Tapping the already-selected button deselects (returns to `not_evaluated`).
- **Icons:** small icon left of text. ✓ for good, ⚠ for attention, ✕ for critical, — for not evaluated.

### 4.3 Item Cards

**Checklist Item Card:**
```
┌─────────────────────────────────────┐
│ Item name                        ▾  │ ← tap to expand/collapse
├─────────────────────────────────────┤
│ [✓ Bien] [⚠ Att] [✕ Crit] [— N/E] │ ← status buttons
│                                     │
│ Observación:                        │
│ ┌─────────────────────────────────┐ │
│ │ Tap to add observation...       │ │ ← auto-expanding textarea
│ └─────────────────────────────────┘ │
│                                     │
│ 📷 Agregar foto  [thumb] [thumb]    │ ← photo row
└─────────────────────────────────────┘
```

**Free Text Item Card:**
```
┌─────────────────────────────────────┐
│ Item name                           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Tap to write...                 │ │ ← larger textarea, auto-expanding
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📷 Agregar foto  [thumb] [thumb]    │
└─────────────────────────────────────┘
```

- **Card background:** `white`, `border-default`, `radius-md`, `shadow-sm`.
- **Spacing:** `space-4` padding inside, `space-4` gap between cards.
- **Completed indicator:** a subtle left border color matching the status (e.g., green left border if status = good).

### 4.4 Inspection Summary Card (Dashboard)

```
┌─────────────────────────────────────┐
│ Nissan Sentra 2019            DRAFT │ ← vehicle + status badge
│ VIN: 3N1AB7AP5KY250312              │
│ 12 Mar 2026 • 87,500 km            │ ← date + odometer
│ Pre-compra • Solicitado por comprador│
├─────────────────────────────────────┤
│ 18/23 items • 4 fotos • 12 obs     │ ← progress summary
└─────────────────────────────────────┘
```

- **Status badge:** `DRAFT` in amber pill, `SIGNED` in green pill.
- **Tap → opens** the inspection (draft: edit mode, signed: report view).

### 4.5 Form Inputs

- **Text inputs:** 40px height, `text-base` (16px — prevents iOS zoom), `radius-sm`, `border-default`, `border-focus` on focus.
- **Textareas:** auto-expanding, minimum 2 lines, `text-base`.
- **Selects:** native on mobile (better UX than custom dropdowns), styled on desktop.
- **Date picker:** native `<input type="date">` on mobile. Defaults to today.
- **Number input:** `<input type="number">` for odometer. Large text, right-aligned.

### 4.6 Navigation — Section Tabs

Horizontal scrollable tabs for inspection sections.

```
[Exterior] [Motor] [Interior] [Tren] [Mec.] [Ruta] [Elec.] [Doc.] [Concl.]
   ═════
```

- **Active tab:** `brand-accent` text, 2px bottom border in `brand-accent`.
- **Inactive tab:** `gray-500` text, no border.
- **Tab height:** 44px.
- **Scrollable:** horizontal scroll with CSS `overflow-x: auto`, no scrollbar visible. Scroll snap optional.
- **Truncation:** long section names truncated with ellipsis. Full name on tap (tooltip or expand).

### 4.7 Sync Status Indicator

Subtle, non-intrusive indicator of save/sync state.

| State | Display |
|-------|---------|
| Saved locally | `gray-400` text: "Guardado" + small check icon |
| Syncing | `gray-400` text: "Sincronizando..." + spinner icon |
| Synced | `success` text: "Sincronizado" + check icon (fades to gray after 2s) |
| Offline | `warning` text: "Sin conexión — guardado local" |

Position: top-right corner of field mode top bar, or below the top bar in dashboard.

### 4.8 Verification Badge (Public Report)

```
┌─────────────────────────────────────────────┐
│ ✓ Este informe fue firmado el 12 Mar 2026   │
│   por Taller Martínez y no puede ser        │
│   modificado.                               │
└─────────────────────────────────────────────┘
```

- Background: `status-good-bg`, border: 1px `status-good`, `radius-md`.
- Icon: shield or checkmark in `status-good`.
- Text: `text-sm`, `gray-700`.

### 4.9 Photo Thumbnails

- **In form (field mode):** 64x64px, `radius-sm`, `border-default`. Tap to view full. Long-press to delete (draft only).
- **In report (public):** responsive grid. 2 columns on mobile, 3 on desktop. Tap to open lightbox.
- **Upload state indicators:**
  - Uploading: subtle progress overlay on thumbnail.
  - Failed: red border + retry icon.
  - Local only (offline): small cloud-off icon overlay.

### 4.10 OpenGraph Preview Card

When the report link is shared on WhatsApp, MercadoLibre, Facebook:

```
┌─────────────────────────────────────┐
│ [Vehicle Photo]                     │
│                                     │
│ Nissan Sentra 2019                  │
│ Inspección pre-compra — 23 items    │
│ evaluados, 4 hallazgos              │
│ Por: Taller Martínez                │
│ Verificado en VinDex                │
└─────────────────────────────────────┘
```

- Dynamic OG image generated per report at sign time (Satori / @vercel/og).
- Includes: vehicle photo (or branded placeholder), vehicle identity, inspection summary line, inspector name, platform attribution.
- Dimensions: 1200x630px (standard OG image).

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | < 640px | Phones (primary for field mode) |
| Tablet | 640px – 1024px | Tablets (secondary for field mode, primary for template editor) |
| Desktop | > 1024px | Dashboard, admin, template editor |

**Mobile-first:** all CSS starts from mobile and scales up.

**Field mode (inspection form) is optimized for mobile.** The inspector is typically holding a phone. On tablet/desktop (≥ 640px), the layout adapts: content area is capped at `768px` centered, item cards get more internal padding (`space-6`), and photo thumbnails increase to 80x80px. The fixed top bar, section tabs, and bottom bar span full viewport width. No side panel or multi-column layout — the single-column flow is preserved at a comfortable reading width.

**Public report is optimized for all viewports.** Buyers may view on phone (WhatsApp link) or desktop (marketplace listing).

---

## 6. Accessibility

- **Contrast ratios:** all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- **Focus indicators:** visible 2px `brand-accent` outline on all interactive elements.
- **Status colors are not the only indicator.** Status buttons include text labels and icons, not just color. The report uses text labels alongside colored indicators.
- **Touch targets:** 48px minimum (as specified in Section 2.4).
- **Screen reader support:** semantic HTML, ARIA labels where needed. Not over-engineered for MVP but not broken.

---

## 7. Dark Mode

**Not built in Phase 1.** The design system uses light mode only. High-contrast light mode is more readable in the field (garages with mixed lighting, outdoor sun glare).

Future consideration: a dark mode for evening/indoor use could reduce eye strain. Not a priority.
