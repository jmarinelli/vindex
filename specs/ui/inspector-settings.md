# UI Spec: Inspector Settings

*Screen specification for the inspector's settings page — branding, contact info, and logo management.*
*Derived from: specs/flows/node-branding.md | specs/entities/node.md | specs/ui/design-system.md | specs/ui/dashboard.md*

---

## Overview

Settings page at `/dashboard/settings` using **Shell B** (Dashboard). Allows node admins to update their node's branding: logo, primary color, accent color, contact info, and bio. Includes a link to the template editor. Accessible only to authenticated users with `node_admin` role.

---

## Route & Shell

**Route:** `/dashboard/settings`
**Shell:** B (Dashboard)

### Shell B Context

- **Top bar (64px):** Logo (left) · "Configuración" (center) · User menu (right).
- **Content area:** max-width `1024px`, centered. Background `gray-50`.
- **No sidebar.** Single-column layout.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  VinDex       Configuración                  [User ▾]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ← Volver al dashboard                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Logo e identidad                               │    │
│  │                                                  │    │
│  │  ┌──────────┐                                    │    │
│  │  │          │  Taller Martínez                   │    │
│  │  │   LOGO   │  (nombre no editable)             │    │
│  │  │          │                                    │    │
│  │  └──────────┘                                    │    │
│  │  [Cambiar logo]  [Eliminar]                     │    │
│  │                                                  │    │
│  │  Vista previa del avatar:  ┌────┐               │    │
│  │                            │ av │               │    │
│  │                            └────┘               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Colores de marca                               │    │
│  │                                                  │    │
│  │  Color primario          Color de acento        │    │
│  │  ┌──────────────────┐   ┌──────────────────┐   │    │
│  │  │ [■] #1E293B      │   │ [■] #0EA5E9      │   │    │
│  │  └──────────────────┘   └──────────────────┘   │    │
│  │                                                  │    │
│  │  Vista previa:                                  │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │ ███████████████████████ (3px top border) │   │    │
│  │  │  Logo  Taller Martínez                   │   │    │
│  │  │  Ver perfil →  (accent color link)       │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Información de contacto                        │    │
│  │                                                  │    │
│  │  Email de contacto *                            │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │ contacto@tallermartinez.com              │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                                                  │    │
│  │  Teléfono                                       │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │ +54 11 4555-1234                         │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                                                  │    │
│  │  Dirección                                      │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │ Av. Corrientes 4500, CABA, Argentina     │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                                                  │    │
│  │  Bio                                            │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │ Mecánico especializado en pre-compra...  │   │    │
│  │  │                                          │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │  120/500 caracteres                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [           Guardar cambios           ]                │
│                                                         │
│  ── Enlaces ──────────────────────────────────────────  │
│  [✎ Editor de Template]  [👤 Mi Perfil Público]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Back Navigation

| Element | Style | Behavior |
|---------|-------|----------|
| Back link | `text-sm`, `brand-accent`, with ← arrow icon | "Volver al dashboard" → navigates to `/dashboard` |
| Position | Top of content, below top bar | Left-aligned |

---

## Section 1: Logo e Identidad

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | First card in content |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Logo e identidad" |

### Logo Display Row

| Element | Style | Behavior |
|---------|-------|----------|
| Logo preview | 80x80, `radius-md`, `border-default`, `object-fit: cover` | Current logo via Cloudinary (`w_160,h_160,c_fill`). Fallback: initial letter avatar |
| Node name | `text-lg`, `font-medium`, `gray-800` | Right of logo |
| Non-editable note | `text-xs`, `gray-400` | "(nombre no editable)" below node name |
| Gap | `space-4` | Between logo and text |

### Logo Actions

| Element | Style | Behavior |
|---------|-------|----------|
| Change button | Secondary button, `text-sm` | "Cambiar logo" — opens file picker (accept: image/jpeg, image/png, image/webp) |
| Remove button | Ghost button, `text-sm`, `error` text color | "Eliminar" — shown only when logo_url is not null. Confirm dialog before removal. |

### Avatar Preview

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-xs`, `gray-500` | "Vista previa del avatar:" |
| Avatar | 32x32, `radius-full`, `border-default` | Shows how the logo will appear in the dashboard header. Uses `w_64,h_64,c_fill,g_face` Cloudinary transform. Falls back to initials if no logo. |

---

## Section 2: Colores de Marca

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Below logo section |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Colores de marca" |

### Color Inputs

Two side-by-side color input fields (stacked on mobile).

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | "Color primario" / "Color de acento" |
| Color input | Composite: native `<input type="color">` swatch (24x24, `radius-sm`, `border-default`) + text input for hex (`text-sm`, `font-mono`, 7 chars max) | Color swatch and text sync bidirectionally. Text input validates `#RRGGBB` format. |
| Layout | 2-column on desktop (`space-4` gap), stacked on mobile | Responsive |
| Reset hint | `text-xs`, `gray-400` | "Dejá vacío para usar los colores por defecto de VinDex" — below color inputs |

### Color Preview Card

Live preview showing how brand colors will appear on public surfaces.

| Element | Style | Behavior |
|---------|-------|----------|
| Container | `white` bg, `border-default`, `radius-sm`, `space-3` padding | Below color inputs |
| Top border | 3px, uses current `brand_color` value (or `brand-primary` default) | Live-updates as color changes |
| Mock logo + name | 24x24 avatar + node display_name in `text-sm` | Simulates inspector card appearance |
| Mock link | `text-xs`, uses current `brand_accent` value (or `brand-accent` default) | "Ver perfil →" — non-functional, just preview |

---

## Section 3: Información de Contacto

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `white` bg, `border-default`, `radius-md`, `shadow-sm`, `space-5` padding | Below colors section |
| Section title | `text-base`, `font-semibold`, `gray-800` | "Información de contacto" |

### Form Fields

| Field | Type | Validation | Placeholder |
|-------|------|-----------|-------------|
| Email de contacto * | `<input type="email">` | Required, valid email, max 255 | "tu@email.com" |
| Teléfono | `<input type="tel">` | Optional, max 50 | "+54 11 ..." |
| Dirección | `<input type="text">` | Optional, max 500 | "Calle, Ciudad, País" |
| Bio | `<textarea>` (3 rows) | Optional, max 500 | "Contá sobre tu experiencia..." |

### Field Styling

| Element | Style |
|---------|-------|
| Label | `text-sm`, `font-medium`, `gray-700` |
| Input | `white` bg, `border-default`, `radius-sm`, 40px height, `text-sm`, `gray-800` text |
| Textarea | Same as input, height: 80px (3 rows) |
| Required indicator | `*` after label text, `error` color |
| Character counter (bio) | `text-xs`, `gray-400`, right-aligned below textarea | "{n}/500 caracteres" |
| Validation error | `text-xs`, `error` color, below input | Inline, shown on blur or submit |
| Field spacing | `space-4` gap between fields |

---

## Save Button

| Element | Style | Behavior |
|---------|-------|----------|
| Button | Full-width primary button, 48px height, `radius-sm`, `brand-primary` bg, `white` text, `font-medium` | "Guardar cambios" |
| Disabled state | `gray-100` bg, `gray-400` text | When form is pristine (no changes) or submitting |
| Loading state | Spinner icon + "Guardando..." | During server action |
| Position | Below all form sections, `space-6` top margin | Sticky on mobile at bottom, static on desktop |

### Save Behavior

- Only text/color fields are submitted with the save button. Logo upload is immediate (separate action).
- The button is disabled until at least one field is modified from its initial value.
- On success: toast "Cambios guardados", button returns to disabled (pristine) state.
- On validation error: inline errors shown on relevant fields, button re-enabled.
- On server error: toast "Error al guardar los cambios. Intentá de nuevo.", button re-enabled.

---

## Quick Links

Secondary navigation, same pattern as dashboard.

| Element | Style | Behavior |
|---------|-------|----------|
| Section separator | `text-xs`, `gray-400`, uppercase, `font-medium` | "Enlaces" with horizontal lines |
| Link row | Horizontal, `space-4` gap | Side by side on desktop, stacked on mobile |
| Template link | Ghost button, `brand-primary` text | "Editor de Template" → `/dashboard/template` |
| Profile link | Ghost button, `brand-primary` text | "Mi Perfil Público" → `/inspector/{slug}` |

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Logo row:** logo (64x64) + name stacked vertically (logo centered above name).
3. **Color inputs:** stacked vertically, full-width.
4. **Color preview:** full-width.
5. **Form fields:** full-width, stacked.
6. **Save button:** sticky at bottom of viewport (64px from bottom, full-width with `space-4` horizontal padding, `white` bg with top border `gray-200`).
7. **Quick links:** stacked vertically, full-width ghost buttons.

### Mobile Layout

```
┌─────────────────────────────────────────┐
│  VinDex    Configuración    [User ▾]    │
├─────────────────────────────────────────┤
│                                         │
│  ← Volver al dashboard                 │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Logo e identidad              │    │
│  │                                 │    │
│  │       ┌──────────┐             │    │
│  │       │   LOGO   │             │    │
│  │       └──────────┘             │    │
│  │    Taller Martínez             │    │
│  │    (nombre no editable)        │    │
│  │                                 │    │
│  │  [Cambiar logo]  [Eliminar]   │    │
│  │                                 │    │
│  │  Avatar:  ┌────┐              │    │
│  │           │ av │              │    │
│  │           └────┘              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Colores de marca              │    │
│  │                                 │    │
│  │  Color primario                │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ [■] #1E293B             │  │    │
│  │  └──────────────────────────┘  │    │
│  │                                 │    │
│  │  Color de acento               │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ [■] #0EA5E9             │  │    │
│  │  └──────────────────────────┘  │    │
│  │                                 │    │
│  │  Vista previa:                 │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ ████████ (top border)   │  │    │
│  │  │ Logo  Taller Martínez   │  │    │
│  │  │ Ver perfil →            │  │    │
│  │  └──────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Información de contacto       │    │
│  │                                 │    │
│  │  Email de contacto *           │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ contacto@taller...      │  │    │
│  │  └──────────────────────────┘  │    │
│  │                                 │    │
│  │  Teléfono                      │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ +54 11 4555-1234        │  │    │
│  │  └──────────────────────────┘  │    │
│  │                                 │    │
│  │  Dirección                     │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ Av. Corrientes 4500...  │  │    │
│  │  └──────────────────────────┘  │    │
│  │                                 │    │
│  │  Bio                           │    │
│  │  ┌──────────────────────────┐  │    │
│  │  │ Mecánico especializado  │  │    │
│  │  │ en pre-compra...        │  │    │
│  │  └──────────────────────────┘  │    │
│  │  120/500 caracteres            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [✎ Editor de Template        ]         │
│  [👤 Mi Perfil Público        ]         │
│                                         │
├─────────────────────────────────────────┤
│  [         Guardar cambios         ]    │
└─────────────────────────────────────────┘
```

---

## Desktop Layout (> 1024px)

- Content centered, max-width `1024px`.
- Cards have `space-6` internal padding.
- Color inputs: side by side (2-column grid).
- Save button: static, not sticky. Full-width within content area.
- Quick links: horizontal, inline.

---

## States

### 1. Loading

- Shell B with skeleton placeholders:
  - Logo section: circle (80px) + text block.
  - Color section: two rectangles (200px wide, 40px tall).
  - Contact section: 4 input skeletons.
  - Save button skeleton.

### 2. Loaded (Default)

- All fields pre-filled with current node data.
- Save button disabled (pristine state).
- Logo shown (or initial fallback).
- Color preview reflects current colors.

### 3. Dirty (Changes Made)

- Save button enabled.
- Modified fields visually unchanged (no dirty indicators needed — the enabled button is sufficient).

### 4. Submitting

- Save button shows spinner + "Guardando...".
- All form inputs disabled during submission.
- Logo upload shows progress indicator on the logo preview (overlay with spinner).

### 5. Logo Uploading

- Logo preview shows an overlay spinner during upload.
- "Cambiar logo" button disabled.
- On success: preview updates, toast shown.
- On failure: toast error, preview reverts.

### 6. Validation Errors

- Inline error messages below invalid fields.
- Save button remains enabled for retry.
- First invalid field receives focus.

### 7. Unauthorized (Not node_admin)

- Redirect to `/dashboard` with toast: "No tenés permisos para acceder a esta página."

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Card | shadcn/ui `Card` | Section containers |
| Button (Primary) | shadcn/ui `Button` | Save button |
| Button (Secondary) | shadcn/ui `Button variant="secondary"` | Change logo |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Remove logo, quick links |
| Input | shadcn/ui `Input` | Text fields, hex input |
| Textarea | shadcn/ui `Textarea` | Bio field |
| Avatar | shadcn/ui `Avatar` | Logo preview, avatar preview |
| Skeleton | shadcn/ui `Skeleton` | Loading state |
| Toast | shadcn/ui `Sonner` / toast | Success and error feedback |
| AlertDialog | shadcn/ui `AlertDialog` | Logo removal confirmation |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-800`, `error`, `success`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards)
- **Touch targets:** 48x48px minimum interactive

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Go back | Tap "← Volver al dashboard" | Navigate to `/dashboard` |
| Change logo | Tap "Cambiar logo" | File picker opens (JPG/PNG/WebP, max 5MB) |
| Remove logo | Tap "Eliminar" + confirm dialog | Logo cleared, avatar fallback to initials |
| Pick color | Tap color swatch or edit hex input | Preview updates live |
| Save changes | Tap "Guardar cambios" | Server action, toast on success/error |
| Edit template | Tap "Editor de Template" | Navigate to `/dashboard/template` |
| View profile | Tap "Mi Perfil Público" | Navigate to `/inspector/{slug}` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render for logo, color inputs, contact fields, save button |
| **Loaded state** | All fields pre-filled with node data · Save button disabled (pristine) · Logo shown (or fallback) |
| **Logo display** | Current logo renders at 80x80 · Fallback initials when no logo · Avatar preview shows 32x32 cropped version |
| **Logo upload** | File picker opens on "Cambiar logo" · Rejects non-image files · Rejects > 5MB · Shows upload spinner · Updates preview on success · Toast on success/failure |
| **Logo removal** | "Eliminar" hidden when no logo · Confirm dialog shown · Logo cleared on confirm · Avatar reverts to initials · Toast shown |
| **Color inputs** | Renders current colors · Swatch and text input sync · Invalid hex shows error · Empty value accepted (defaults) · Preview card updates live |
| **Contact form** | Email required · Phone/address/bio optional · Max lengths enforced · Character counter on bio |
| **Save button** | Disabled when pristine · Enabled when dirty · Shows spinner during submit · Disabled during submit · Re-enabled on error |
| **Save success** | Toast "Cambios guardados" · Button returns to disabled · Form values reflect saved state |
| **Save validation error** | Inline errors shown · First invalid field focused · Button re-enabled |
| **Save server error** | Toast "Error al guardar..." · Button re-enabled · Form values preserved |
| **Unauthorized** | Non-node_admin redirected to /dashboard · Toast shown |
| **Back navigation** | "← Volver al dashboard" navigates to /dashboard |
| **Quick links** | Template editor link → /dashboard/template · Profile link → /inspector/{slug} |
| **Mobile layout** | Cards full-width · Color inputs stacked · Save button sticky at bottom · Logo centered above name |

---

## Accessibility

- All form fields have associated `<label>` elements.
- Required fields marked with `aria-required="true"`.
- Validation errors linked via `aria-describedby`.
- Color swatch has `aria-label`: "Elegir color primario" / "Elegir color de acento".
- Logo upload button has `aria-label`: "Cambiar logo del negocio".
- Remove logo button has `aria-label`: "Eliminar logo".
- Character counter on bio has `aria-live="polite"`.
- Save button has `aria-disabled` when pristine.
- Focus management: on validation error, focus moves to first invalid field.
- All interactive elements meet 48x48px touch targets on mobile.
- Color contrast meets WCAG AA on all backgrounds.
