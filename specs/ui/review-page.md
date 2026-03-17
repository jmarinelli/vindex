# UI Spec: Review Page

*Screen specification for the dedicated review submission page at `/review/{token}`.*
*Derived from: specs/flows/post-purchase-review.md | specs/ui/design-system.md | specs/entities/review.md | specs/entities/review-token.md | specs/entities/event.md | specs/entities/vehicle.md | specs/entities/node.md*

---

## Overview

A standalone page where the buyer submits their review of an inspection report. Accessed exclusively via a tokenized link from the post-signing notification email. Shows inspection context for reference, the review form, and transitions to a confirmation view after submission. Uses **Shell A** (Public) — no authentication required.

---

## Route & Shell

**Route:** `/review/[token]`
**Shell:** A (Public)

### Shell A Context

- **Top bar:** Minimal. VinDex logo (left, small, links to `/`). No auth controls.
- **Content area:** max-width `600px`, centered, `white` background.
- **Footer:** Minimal — "Verificado por VinDex" · Privacy · Terms links.

---

## Page Layout (Valid Token)

```
┌──────────────────────────────────────────────────────────┐
│  VinDex                                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Dejá tu reseña                                          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🚗 Nissan Sentra 2019 — AC123BD                   │  │
│  │    Fecha: 13/03/2026                               │  │
│  │    Inspector: AutoCheck Buenos Aires               │  │
│  │    ✓ 12 Bien · ⚠ 3 Atención · ✕ 1 Crítico       │  │
│  │    [Ver reporte completo →]                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ¿La condición real del vehículo coincidió con lo que    │
│  describió el informe?                                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ✓  Sí, coincidió                                  │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ⚠  Parcialmente                                   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ✕  No coincidió                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Comentario (opcional)                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Contanos tu experiencia...                         │  │
│  └────────────────────────────────────────────────────┘  │
│  0/500                                                   │
│                                                          │
│  [              Enviar reseña              ]              │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│  Verificado por VinDex · Privacidad · Términos           │
└──────────────────────────────────────────────────────────┘
```

---

## Page Title

| Element | Style | Behavior |
|---------|-------|----------|
| Title | `text-2xl`, `font-bold`, `gray-800` | "Dejá tu reseña" |
| Spacing | `space-6` below title | Before context card |

---

## Inspection Context Card

A compact card summarizing the inspection so the buyer knows what they're reviewing.

| Element | Style | Behavior |
|---------|-------|----------|
| Card container | `gray-50` bg, `border-default`, `radius-md`, `space-4` padding | Below page title |
| Vehicle icon | Car emoji or icon, `text-xl` | Left of vehicle name |
| Vehicle name | `text-base`, `font-medium`, `gray-800` | "{Make} {Model} {Year} — {Plate}" (plate omitted if null) |
| Inspection date | `text-sm`, `gray-600` | "Fecha: {event_date}" formatted DD/MM/YYYY |
| Inspector name | `text-sm`, `gray-600` | "Inspector: {node_display_name}" |
| Status summary | `text-sm`, status colors | Inline: "✓ {n} Bien · ⚠ {n} Atención · ✕ {n} Crítico" |
| Report link | `text-sm`, `brand-accent`, "Ver reporte completo →" | Links to `/report/{slug}`, opens in new tab |

---

## Review Question

| Element | Style | Behavior |
|---------|-------|----------|
| Question text | `text-lg`, `font-medium`, `gray-800` | "¿La condición real del vehículo coincidió con lo que describió el informe?" |
| Spacing | `space-4` above question, `space-4` below | Between context card and options |

---

## Rating Options

Three full-width radio cards in a vertical stack.

| Element | Style | Behavior |
|---------|-------|----------|
| Option card | Full-width, 56px min-height, `radius-sm`, `space-3` padding | Tap selects |
| Icon | 20x20, left of label | ✓, ⚠, or ✕ |
| Label | `text-base`, `font-medium` | "Sí, coincidió" / "Parcialmente" / "No coincidió" |
| Gap | `space-2` between cards | Vertical stack |

**States:**

| State | Background | Border | Text/Icon Color | Font Weight |
|-------|-----------|--------|----------------|-------------|
| Unselected | `white` | 1px `gray-200` | `gray-600` | 400 |
| `yes` selected | `status-good-bg` | 2px `status-good` | `status-good` | 600 |
| `partially` selected | `status-attention-bg` | 2px `status-attention` | `status-attention` | 600 |
| `no` selected | `status-critical-bg` | 2px `status-critical` | `status-critical` | 600 |

---

## Comment Textarea

| Element | Style | Behavior |
|---------|-------|----------|
| Label | `text-sm`, `font-medium`, `gray-700` | "Comentario (opcional)" |
| Textarea | `text-base`, `border-default`, `radius-sm`, auto-expanding, min 2 lines | Placeholder: "Contanos tu experiencia..." |
| Character counter | `text-xs`, `gray-400`, right-aligned below textarea | "{current}/500" |
| Max length | 500 characters | Client-side enforcement + server-side Zod validation |

---

## Submit Button

| Element | Style | Behavior |
|---------|-------|----------|
| Button | Full-width primary button, 48px height, `radius-sm` | Fixed at bottom on mobile |
| Label (ready) | "Enviar reseña" | Enabled when rating selected |
| Label (disabled) | "Enviar reseña" | `gray-100` bg, `gray-400` text — no rating selected |
| Label (submitting) | Spinner + "Enviando..." | During server action call |
| Error state | Button re-enabled | Toast: error message from server |

---

## Confirmation View (After Submission)

Replaces the entire form area after successful submission.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                       ✓                                  │
│              ¡Gracias por tu reseña!                     │
│                                                          │
│  Tu opinión ayuda a otros compradores a tomar            │
│  mejores decisiones.                                     │
│                                                          │
│  [          Ver reporte completo          ]              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Checkmark circle | 64x64, `success` bg, white ✓ icon, `radius-full` | Centered |
| Title | `text-2xl`, `font-bold`, `gray-800` | "¡Gracias por tu reseña!" |
| Subtitle | `text-base`, `gray-500`, centered | "Tu opinión ayuda a otros compradores a tomar mejores decisiones." |
| Report link | Full-width primary button, 48px height | "Ver reporte completo" → opens `/report/{slug}` |

---

## Error States

### Invalid Token

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                       ✕                                  │
│              Enlace inválido                             │
│                                                          │
│  Este enlace de reseña no es válido.                     │
│  Verificá que el enlace sea correcto.                    │
│                                                          │
│  [            Ir al inicio            ]                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | 48x48, `error` color, ✕ or alert-circle | Centered |
| Title | `text-xl`, `font-bold`, `gray-800` | "Enlace inválido" |
| Message | `text-base`, `gray-500`, centered | "Este enlace de reseña no es válido. Verificá que el enlace sea correcto." |
| CTA | Ghost button, `brand-primary` text | "Ir al inicio" → navigates to `/` |

### Expired Token

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | 48x48, `warning` color, clock or timer icon | Centered |
| Title | `text-xl`, `font-bold`, `gray-800` | "Enlace expirado" |
| Message | `text-base`, `gray-500`, centered | "El plazo para dejar una reseña era de 90 días y ya pasó." |
| Report link | Ghost button, `brand-accent` text | "Ver reporte →" → opens `/report/{slug}` |

### Already Used Token

Shows the previously submitted review as a read-only card.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                       ✓                                  │
│              Ya dejaste una reseña                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ✓ Sí, coincidió                                   │  │
│  │ "El auto estaba exactamente como describía..."     │  │
│  │ Hace 3 días                                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [          Ver reporte completo          ]              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Style | Behavior |
|---------|-------|----------|
| Icon | 48x48, `success` color, checkmark | Centered |
| Title | `text-xl`, `font-bold`, `gray-800` | "Ya dejaste una reseña" |
| Review card | `gray-50` bg, `border-default`, `radius-md`, `space-4` padding | Shows the submitted review |
| Rating | Status icon + label, status color | "✓ Sí, coincidió" / "⚠ Parcialmente" / "✕ No coincidió" |
| Comment | `text-sm`, `gray-600` | Full comment text (if present) |
| Timestamp | `text-xs`, `gray-400` | Relative: "Hace 3 días" |
| Report link | Full-width primary button | "Ver reporte completo" → `/report/{slug}` |

---

## Mobile Layout (< 640px)

1. **Content:** full-width, no horizontal page padding. Cards have internal `space-4` padding.
2. **Submit button:** fixed full-width at bottom (56px, `shadow-top`, `white` bg, `space-4` padding). Removed from inline flow.
3. **Rating cards:** full-width, 56px minimum height.
4. **Text:** all text readable without zoom (min 16px for inputs).

---

## Desktop Layout (> 1024px)

- Content centered, max-width `600px`.
- Cards have `space-6` internal padding.
- Submit button inline (not fixed at bottom).
- Rating cards: same full-width design, max-width `600px`.

---

## States Summary

| State | Trigger | Display |
|-------|---------|---------|
| **Loading** | Page load | Skeleton: context card + 3 radio card skeletons + textarea skeleton |
| **Valid token — form** | Token validation passes | Full form with context card, rating options, comment, submit button |
| **Rating selected** | User taps rating | Selected card highlighted with status color, submit button enabled |
| **Submitting** | User taps submit | Button shows spinner + "Enviando...", form disabled |
| **Submission error** | Server action fails | Toast with error message, form re-enabled |
| **Confirmation** | Successful submission | Form replaced with success confirmation + report link |
| **Invalid token** | Token not found | Error page with "Enlace inválido" |
| **Expired token** | Token past 90 days | Error page with "Enlace expirado" + report link |
| **Already used** | Token already used | Shows previous review read-only + report link |

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | Submit button, report link button |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Home CTA, report link in error states |
| Card | shadcn/ui `Card` | Context card, review card |
| Textarea | HTML `<textarea>` with auto-expand | Comment input |
| Toast | shadcn/ui `Sonner` / toast | Submission errors |
| Skeleton | shadcn/ui `Skeleton` | Loading state |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-900`, `status-good`, `status-good-bg`, `status-attention`, `status-attention-bg`, `status-critical`, `status-critical-bg`, `success`, `warning`, `error`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- **Spacing:** `space-1` (4px) through `space-12` (48px)
- **Borders:** `border-default` (1px solid gray-200), `border-focus` (2px solid brand-accent)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards), `shadow-top` (mobile fixed bar)
- **Touch targets:** 48x48px minimum interactive, 56px for rating cards

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Select rating | Tap rating card | Card highlights with status color, submit button enables |
| Deselect rating | Tap already-selected card | Card unhighlights, submit button disables |
| Type comment | Type in textarea | Auto-expand, character counter updates |
| Submit review | Tap "Enviar reseña" | Validates → calls `submitTokenReviewAction` → confirmation or error toast |
| View report | Tap "Ver reporte completo →" | Opens `/report/{slug}` in new tab |
| Go home | Tap VinDex logo | Navigates to `/` |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render for context card, rating options, textarea |
| **Context card** | Vehicle name renders (with/without plate) · Date formatted DD/MM/YYYY · Inspector name · Status summary with correct counts and colors · Report link opens correct URL |
| **Rating options** | 3 cards render · Tap selects · Tap selected deselects · Correct status colors per option · Only one selected at a time |
| **Comment textarea** | Renders with placeholder · Character counter updates · Max 500 chars enforced · Auto-expands |
| **Submit button** | Disabled when no rating · Enabled when rating selected · Shows loading state · Re-enables on error |
| **Confirmation** | Checkmark renders · Title and subtitle · Report link works |
| **Invalid token** | Error icon and message render · CTA links to home |
| **Expired token** | Warning icon and message · Report link present |
| **Already used** | Shows previous review with rating, comment, timestamp · Report link |
| **Mobile layout** | Submit button fixed at bottom · Content full-width |

---

## Accessibility

- All interactive elements meet 48x48px touch targets on mobile.
- Rating cards use `role="radiogroup"` with individual `role="radio"` and `aria-checked`.
- Selected rating has `aria-selected="true"` and distinct visual styling (not just color).
- Submit button has `aria-disabled="true"` when no rating selected.
- Comment textarea has associated label.
- Character counter uses `aria-live="polite"`.
- Error states have `role="alert"`.
- Confirmation checkmark has `aria-label="Reseña enviada exitosamente"`.
- Focus management: auto-focus on first rating card on page load. After submission, focus moves to confirmation content.
- Keyboard navigation: Tab through rating cards + comment + submit, Enter to select/submit.
- Report link in context card has `target="_blank"` with `rel="noopener noreferrer"`.
