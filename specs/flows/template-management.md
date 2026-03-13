# Flow: Template Management

*Describes how an inspector views and customizes their inspection template.*
*Derived from: specs/entities/inspection-template.md | specs/implementation-plan.md (Phase 1)*

---

## Overview

The inspector accesses a single-page editor to customize the structure of their inspection template. The template defines which sections and items appear when they create a new inspection. Changes apply to future inspections only — existing inspections retain their snapshot.

---

## Prerequisites

- User is authenticated with role `user` (inspector).
- User belongs to a node via NodeMember.
- The node has exactly one inspection template (seeded on node creation with the starter template).

---

## Entry Point

- From Dashboard (Shell B), the inspector navigates to **Edit Template** (`/dashboard/template`).
- The page loads the template associated with the user's node via `getTemplate(nodeId)`.

---

## Flow Steps

### 1. View Template

The editor displays the current template:

- **Template name** at the top, editable inline.
- **Sections** listed in order, each showing:
  - Section name (editable inline).
  - Item count badge.
  - Drag handle (desktop) or move up/down buttons (mobile) for reordering.
  - Expand/collapse toggle.
- **Items within each section** (when expanded):
  - Item name (editable inline).
  - Item type indicator (`checklist_item` or `free_text`).
  - Drag handle (desktop) or move up/down buttons (mobile) for reordering.
  - Delete button (icon).
- **"Add Section" button** at the bottom of the section list.

### 2. Edit Template Name

- Inspector taps the template name text.
- Text becomes an editable input field (inline editing).
- Inspector types the new name and presses Enter or taps outside to confirm.
- If the name is empty on blur, revert to the previous name and show a toast: "El nombre del template no puede estar vacío."

### 3. Add a Section

- Inspector taps "Agregar sección" button at the bottom of the section list.
- A new section is appended at the end with:
  - `id`: new UUID (generated client-side).
  - `name`: "Nueva sección" (placeholder, auto-focused for immediate editing).
  - `order`: last position.
  - `items`: empty array.
- The new section is auto-expanded and the name input is focused.

### 4. Rename a Section

- Inspector taps the section name text.
- Text becomes an editable input field.
- Inspector types the new name and confirms (Enter or blur).
- If the name is empty on blur, revert to the previous name and show a toast: "El nombre de la sección no puede estar vacío."

### 5. Delete a Section

- Inspector taps the delete icon on a section.
- Confirmation dialog: "¿Eliminar la sección '{name}' y todos sus items? Esta acción no se puede deshacer."
- On confirm: section and all its items are removed. Remaining sections re-ordered.
- On cancel: no change.

### 6. Reorder Sections

- **Desktop:** drag handle on each section. Drag to reposition within the list. `order` values update accordingly.
- **Mobile:** up/down arrow buttons on each section. Tap to move one position up or down. Disabled at boundaries (first section can't move up, last can't move down).

### 7. Add an Item

- Inspector expands a section and taps "Agregar item" button at the bottom of the item list.
- A new item is appended at the end of that section with:
  - `id`: new UUID (generated client-side).
  - `name`: "Nuevo item" (placeholder, auto-focused for immediate editing).
  - `order`: last position within the section.
  - `type`: `checklist_item` (default).
- The item name input is focused.

### 8. Rename an Item

- Inspector taps the item name text.
- Text becomes an editable input field.
- Inspector types the new name and confirms (Enter or blur).
- If the name is empty on blur, revert to the previous name and show a toast: "El nombre del item no puede estar vacío."

### 9. Change Item Type

- Inspector taps the type indicator on an item.
- Toggles between `checklist_item` and `free_text`.
- Visual feedback: the indicator changes icon/label immediately.
- No confirmation needed — the toggle is instant and reversible.

### 10. Delete an Item

- Inspector taps the delete icon on an item.
- Item is removed immediately (no confirmation for individual items — lightweight action).
- Remaining items within the section re-ordered.

### 11. Reorder Items

- **Desktop:** drag handle on each item. Drag to reposition within the parent section. Items cannot be dragged between sections.
- **Mobile:** up/down arrow buttons on each item. Tap to move one position up or down within the parent section. Disabled at boundaries.

### 12. Save Template

- Inspector taps the "Guardar" (Save) button in the page header.
- Client validates the template structure:
  - Template name is not empty.
  - At least one section exists.
  - Each section has a non-empty name.
  - Each item has a non-empty name and a valid type (`checklist_item` or `free_text`).
  - All section and item IDs are valid UUIDs.
- If validation passes:
  - Server action `updateTemplate` is called with the full sections JSON (full replacement).
  - Server-side Zod validation runs.
  - On success: toast "Template guardado" + `updated_at` refreshed.
  - On error: toast with error message.
- If client validation fails:
  - Inline error indicators on the offending fields.
  - Save button remains enabled; save is blocked until errors are fixed.

### 13. Unsaved Changes Warning

- If the inspector has unsaved changes and tries to navigate away (browser back, link click):
  - Browser `beforeunload` prompt: "Tenés cambios sin guardar. ¿Querés salir?"
  - On confirm: navigate away, changes lost.
  - On cancel: stay on page.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Empty template name** | Revert to previous name on blur. Toast warning. Save blocked if empty. |
| **All sections deleted** | The "Guardar" button shows validation error: "El template debe tener al menos una sección." The inspector must add a section before saving. |
| **Section with zero items** | Allowed. An empty section is valid — the inspector may add items later. During inspection creation, empty sections are shown but have no items to fill. |
| **Duplicate section/item names** | Allowed. Names are display labels, not identifiers. UUIDs handle identity. |
| **Very long names** | Truncated in the UI with ellipsis. Full name visible on edit. VARCHAR(255) limit enforced server-side. |
| **Concurrent editing (same node, two tabs)** | Last-write-wins. The save is a full replacement of the sections JSON. No conflict resolution in Phase 1. |
| **Network error on save** | Toast: "Error al guardar. Verificá tu conexión e intentá de nuevo." Template state in memory is preserved (not reset). |
| **Template not found for node** | Should not happen (seeded on node creation). If it does, show error state: "No se encontró un template. Contactá soporte." |

---

## Data Flow

```
Inspector edits template in browser (local state)
  → Taps "Guardar"
  → Client validates structure
  → Server action: updateTemplate({ templateId, name, sections })
  → Zod validation (validators.ts)
  → Service: template.updateTemplate(templateId, nodeId, name, sections)
    → Verify user is node member
    → Validate sections structure
    → UPDATE inspection_templates SET name=, sections=, updated_at=now() WHERE id= AND node_id=
  → Return { success: true }
  → Toast "Template guardado"
```

---

## Test Plan

Per `specs/architecture.md §5` — coverage target ≥ 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| Template Zod schemas | `validators.ts` | Valid template structure passes · Missing name fails · Empty sections array fails · Item with invalid type fails · Malformed UUID fails · Excessively long name (>255 chars) fails |
| Utility functions | Any helpers used in template logic | Edge cases per function |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `getTemplate` service | `services/template.ts` | Returns template for valid nodeId · Returns null/error for unknown nodeId · Only returns template the user's node owns |
| `updateTemplate` service | `services/template.ts` | Persists name + sections changes · Rejects update from non-member · Rejects empty name · Rejects empty sections array · Updates `updated_at` timestamp |
| `updateTemplate` action | `actions/template.ts` | Validates input with Zod · Returns `{ success: true }` on valid update · Returns `{ success: false, error }` on invalid input · Returns `{ success: false, error }` on authorization failure |

### Component Tests

| Component | Cases |
|-----------|-------|
| Template editor page | Renders loading skeleton · Renders sections/items from data · Save button states (guardado/guardar/guardando) |
| Inline edit | Click activates input · Enter confirms · Escape cancels · Empty blur reverts + shows toast |
| Section card | Renders name + item count · Expand/collapse toggles items · Delete shows confirmation dialog · Add item appends to list |
| Item row | Renders name + type badge · Type toggle switches checklist ↔ free_text · Delete removes immediately |
| Reorder (mobile) | Move up/down buttons work · Disabled at boundaries (first/last) |
| Validation errors | Empty name shows inline error · No sections shows banner · Save blocked until resolved |

---

## Acceptance Criteria

- [ ] Inspector can view their current template with all sections and items
- [ ] Inspector can edit the template name inline
- [ ] Inspector can add, rename, and delete sections
- [ ] Inspector can add, rename, and delete items within sections
- [ ] Inspector can reorder sections (drag on desktop, arrows on mobile)
- [ ] Inspector can reorder items within a section (drag on desktop, arrows on mobile)
- [ ] Inspector can toggle item type between `checklist_item` and `free_text`
- [ ] Save validates template structure (client + server)
- [ ] Save persists changes and updates `updated_at`
- [ ] Empty template name, empty section name, and empty item name are rejected
- [ ] Deleting all sections is blocked on save with clear error message
- [ ] Unsaved changes trigger a navigation warning
- [ ] Network errors are handled with a user-friendly toast
- [ ] Template changes do not affect existing inspections
