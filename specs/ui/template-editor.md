# UI Spec: Template Editor

*Screen specification for the inspection template editor.*
*Derived from: specs/flows/template-management.md | specs/ui/design-system.md | specs/entities/inspection-template.md*

---

## Overview

Single page at `/dashboard/template` using **Shell B** (Dashboard). The inspector views and edits their inspection template — sections, items, ordering, naming, and item types. All editing happens inline; there is no separate "edit mode."

---

## Shell B Context

- **Top bar (64px):** Logo (left) · "Editor de Template" (center) · User menu (right).
- **Content area:** max-width `1024px`, centered. Background `gray-50`.
- **No sidebar.** Single-column layout.

---

## Page Layout

### Header Row

```
┌─────────────────────────────────────────────────────────┐
│  [← Dashboard]   Inspección Pre-Compra Completa  [Guardar] │
│                   ─────────────────────────               │
│                   (editable, click to rename)              │
└─────────────────────────────────────────────────────────┘
```

- **Back link** (left): Ghost button "← Dashboard", navigates to `/dashboard`.
- **Template name** (center): `text-2xl`, `font-bold`, `gray-800`. Click to edit inline (input replaces text). On mobile, template name is left-aligned below the back link.
- **Save button** (right): Primary button "Guardar". Disabled while saving (shows spinner). On mobile, fixed at bottom of screen as a full-width button.

### Section List

Below the header, sections are listed vertically with `space-4` gap between them.

Each section is a **card** (`white` bg, `border-default`, `radius-md`, `shadow-sm`):

```
┌─────────────────────────────────────────────────────────┐
│  ⠿  Exterior                          4 items  ▾  🗑  │
├─────────────────────────────────────────────────────────┤
│  ⠿  Estado de carrocería y pintura    ☑ checklist  🗑  │
│  ⠿  Vidrios y espejos                 ☑ checklist  🗑  │
│  ⠿  Luces y ópticas                   ☑ checklist  🗑  │
│  ⠿  Neumáticos y llantas              ☑ checklist  🗑  │
│                                                         │
│  [+ Agregar item]                                       │
└─────────────────────────────────────────────────────────┘
```

#### Section Header (within card)

| Element | Style | Behavior |
|---------|-------|----------|
| Drag handle (⠿) | `gray-400`, 24x24, left edge | Desktop: drag to reorder. Mobile: replaced by ▲/▼ buttons. |
| Section name | `text-lg`, `font-medium`, `gray-800` | Click → inline input. Enter/blur → confirm. Empty → revert + toast. |
| Item count badge | `text-sm`, `gray-500`, pill (`radius-full`, `gray-100` bg) | "4 items" — auto-updates. |
| Expand/collapse (▾/▸) | `gray-400`, 20x20 | Toggles item list visibility. Default: collapsed for sections after the first. |
| Delete (🗑) | `gray-400`, hover `error`, 20x20 | Confirmation dialog before delete. |

#### Item Row (within expanded section)

| Element | Style | Behavior |
|---------|-------|----------|
| Drag handle (⠿) | `gray-300`, 20x20, left edge | Desktop: drag within section. Mobile: replaced by ▲/▼ buttons. |
| Item name | `text-base`, `gray-700` | Click → inline input. Enter/blur → confirm. Empty → revert + toast. |
| Type toggle | `text-xs`, pill badge | `checklist_item`: `brand-accent` bg tint, "☑ Checklist". `free_text`: `gray-200` bg, "✎ Texto libre". Click toggles between the two. |
| Delete (🗑) | `gray-300`, hover `error`, 18x18 | Removes immediately (no confirmation). |

#### Add Item Button

- Inside the card, below the last item.
- Ghost button: "+ Agregar item", `text-sm`, `brand-primary` text.
- Creates item with default name "Nuevo item" and type `checklist_item`.

### Add Section Button

Below the last section card:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│              + Agregar sección                           │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

- Dashed border card, `gray-200` border, `gray-500` text, full width.
- Click → appends section with default name "Nueva sección", auto-expanded, name auto-focused.

---

## Mobile Layout (< 640px)

Key differences from desktop:

1. **Template name**: left-aligned below the back link, full width. `text-xl` instead of `text-2xl`.
2. **Save button**: removed from header. Instead, a fixed full-width primary button at the bottom of the viewport (56px tall, `shadow-top`, `white` bg, `space-4` padding).
3. **Drag handles replaced** with ▲/▼ arrow buttons:
   - Sections: two small buttons (up/down) at the right edge of the section header, before the delete icon.
   - Items: two small buttons (up/down) at the right edge of each item row.
   - Disabled state (gray-300) at boundaries.
   - Touch target: 44x44px per button.
4. **Section cards**: full-width (no horizontal padding from page container, cards have internal `space-4` padding).
5. **Item rows**: slightly condensed. Type toggle badge wraps below the item name if space is tight.

### Mobile Section Header

```
┌─────────────────────────────────────────┐
│  Exterior              4 items          │
│                        ▲ ▼  ▾  🗑      │
└─────────────────────────────────────────┘
```

### Mobile Item Row

```
│  Estado de carrocería y pintura         │
│  ☑ Checklist           ▲ ▼  🗑         │
```

---

## Desktop Layout (> 1024px)

- Content centered, max-width `1024px`.
- Section cards have `space-6` internal padding.
- Drag handles visible on hover (hidden by default, opacity transition).
- Item rows have subtle hover state (`gray-50` bg).
- Two-column potential: the section list is single column but could be widened to use the available space — keep single column for Phase 1 simplicity.

---

## States

### 1. Loading

- Page shows Shell B with skeleton placeholders:
  - One rectangle for the template name (200px wide, 32px tall).
  - 3 skeleton cards (section placeholders) with pulse animation.

### 2. Template with Starter Data (Default)

- 9 sections loaded, first section expanded, rest collapsed.
- All items visible in the expanded section.
- Template name: "Inspección Pre-Compra Completa".
- Save button enabled (but no changes yet — shows as "Guardado" in secondary style until changes are made).

### 3. Editing

- Any change (rename, add, delete, reorder, type toggle) transitions the save button to primary style with "Guardar" label.
- Changed fields have no special styling — the save button is the indicator of unsaved changes.

### 4. Inline Editing (Name)

- When a name is clicked, the text is replaced by an input field:
  - Same font size and weight as the display text.
  - `border-focus` (2px `brand-accent`).
  - Auto-selected text for easy replacement.
  - Enter → confirm. Escape → cancel (revert). Blur → confirm.

### 5. Drag in Progress (Desktop Only)

- Dragged element has `shadow-lg`, slight scale (1.02), reduced opacity on the original position.
- Drop target indicator: 2px `brand-accent` line at the drop position.
- Sections can be dragged within the section list.
- Items can be dragged within their section (not between sections).

### 6. Saving

- Save button shows spinner icon + "Guardando..." text.
- All interactions remain enabled (optimistic — if save fails, the user can retry).

### 7. Save Success

- Toast notification (bottom-right on desktop, bottom-center on mobile): "Template guardado" with `success` color, auto-dismiss 3s.
- Save button reverts to "Guardado" secondary style.

### 8. Save Error

- Toast notification: "Error al guardar. Verificá tu conexión e intentá de nuevo." with `error` color, manual dismiss.
- Save button reverts to "Guardar" primary style (retry enabled).

### 9. Validation Error

- Inline: red border on the offending field (empty name input).
- Below the field: `text-xs`, `error` color, message (e.g., "El nombre no puede estar vacío").
- Save button remains enabled but save is blocked until errors are resolved.
- If "no sections" error: a banner above the section list: "El template debe tener al menos una sección."

### 10. Empty Template (All Sections Deleted)

- No section cards visible.
- Center-aligned message: "No tenés secciones. Agregá una para empezar."
- The "Agregar sección" button is prominent below the message.
- Save button shows validation error if tapped.

### 11. Error State (Template Not Found)

- Full-page error within Shell B.
- Icon: warning triangle.
- Message: "No se encontró un template. Contactá soporte."
- Link back to dashboard.

---

## Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| Button (Primary) | shadcn/ui `Button` | Save button |
| Button (Ghost) | shadcn/ui `Button variant="ghost"` | Back link, Add item, Add section |
| Button (Destructive icon) | shadcn/ui `Button variant="ghost" size="icon"` | Delete section/item |
| Card | shadcn/ui `Card` | Section container |
| Input | shadcn/ui `Input` | Inline name editing |
| Badge | shadcn/ui `Badge` | Item count, item type toggle |
| Toast | shadcn/ui `Sonner` / toast | Save success/error, validation warnings |
| Dialog | shadcn/ui `AlertDialog` | Section delete confirmation |
| Skeleton | shadcn/ui `Skeleton` | Loading state |
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Section and item reordering (desktop) |

---

## Design Tokens Reference

From `specs/ui/design-system.md`:

- **Colors:** `brand-primary`, `brand-accent`, `gray-50` through `gray-800`, `error`, `success`
- **Typography:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- **Spacing:** `space-3` (12px), `space-4` (16px), `space-5` (20px), `space-6` (24px)
- **Borders:** `border-default` (1px solid gray-200), `border-focus` (2px solid brand-accent)
- **Radius:** `radius-sm` (6px), `radius-md` (8px), `radius-full` (9999px)
- **Shadows:** `shadow-sm` (cards), `shadow-lg` (drag), `shadow-top` (mobile save bar)
- **Touch targets:** 48x48px minimum interactive, 44x44px nav elements

---

## Interaction Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Edit template name | Click name text | Inline input, Enter/blur confirms |
| Add section | Click "+ Agregar sección" | New section appended, expanded, name focused |
| Rename section | Click section name | Inline input |
| Delete section | Click 🗑 on section | Confirmation dialog → remove |
| Reorder section | Drag (desktop) / ▲▼ (mobile) | Section moves, orders update |
| Add item | Click "+ Agregar item" in section | New item appended, name focused |
| Rename item | Click item name | Inline input |
| Toggle item type | Click type badge | Toggles checklist ↔ free_text |
| Delete item | Click 🗑 on item | Immediate remove (no confirmation) |
| Reorder item | Drag (desktop) / ▲▼ (mobile) | Item moves within section |
| Save | Click "Guardar" | Validate → server action → toast |
| Navigate away | Browser back / link | beforeunload warning if unsaved |

---

## Test Plan

Per `specs/architecture.md §5` — all component tests use React Testing Library.

| Component / State | Test Cases |
|-------------------|------------|
| **Loading state** | Skeleton placeholders render (3 cards + name rectangle) |
| **Template with data** | Sections render in order · First section expanded, rest collapsed · Items visible in expanded section · Template name displayed |
| **Inline editing** | Click name → input appears with current value, text selected · Enter → confirms new value · Escape → reverts · Blur on empty → reverts + toast |
| **Add section** | Click "Agregar sección" → new card appended · Name input auto-focused · Default name "Nueva sección" |
| **Delete section** | Click delete → AlertDialog shown · Confirm → section removed · Cancel → no change |
| **Add item** | Click "Agregar item" → new row appended · Name input auto-focused · Default type `checklist_item` |
| **Delete item** | Click delete → item removed immediately (no dialog) |
| **Type toggle** | Click badge → toggles between checklist and free_text · Visual label updates |
| **Reorder (mobile)** | ▲/▼ buttons change order · First item: ▲ disabled · Last item: ▼ disabled |
| **Save button** | No changes → "Guardado" (secondary) · After change → "Guardar" (primary) · During save → "Guardando..." + spinner · After success → "Guardado" + toast · After error → "Guardar" + error toast |
| **Validation errors** | Empty template name → red border + inline message · All sections deleted → banner message · Save blocked until resolved |
| **Mobile save bar** | Save button renders fixed at bottom on mobile viewport |
| **Unsaved changes** | `beforeunload` event listener active when changes exist · Removed when saved |

---

## Accessibility

- All interactive elements meet 48x48px touch targets on mobile.
- Inline editing inputs have associated labels (visually hidden).
- Drag-and-drop uses `@dnd-kit` ARIA announcements ("Sección Exterior movida a posición 2 de 9").
- Delete confirmation dialog traps focus.
- Type toggle badge has `role="switch"` with `aria-checked`.
- Section expand/collapse uses `aria-expanded`.
- Keyboard navigation: Tab through sections/items, Enter to edit, Escape to cancel.
