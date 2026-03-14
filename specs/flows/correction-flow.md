# Flow: Correction Flow

*Describes how inspectors issue corrections to signed reports: creation, relationship display, timeline behavior, and immutability preservation.*
*Derived from: specs/entities/event.md | specs/entities/node.md | specs/entities/node-member.md | specs/entities/vehicle.md | specs/ui/report-public.md | specs/ui/vehicle-page.md | specs/implementation-plan.md (Phase 5D)*

---

## Overview

A correction is a **new inspection event** that references an original signed report via `correction_of_id`. Corrections preserve the immutability invariant — the original signed event is never modified. Instead, a new draft event is created with a link to the original, allowing the inspector to re-evaluate findings and produce an updated report.

Corrections are visible on both the original and correction report pages (as cross-linked notices), and on the vehicle timeline where both events appear chronologically.

---

## Prerequisites

- User is authenticated with role `user` (inspector).
- User has an active NodeMember record for the original event's node.
- The original event has `status = 'signed'`.
- The original event has `event_type = 'inspection'`.

---

## Entry Point

- On the public report page (`/report/{slug}`), a "Crear corrección" button is visible **only to authenticated inspectors who are members of the report's node**.
- The button is not visible to:
  - Unauthenticated visitors.
  - Authenticated users who are not members of the event's node.
  - Platform admins who are not members of the event's node.
- The button is visible regardless of whether a correction already exists for the event. An event can have multiple corrections (each is a separate event).

---

## Flow Steps

### Step 1: Initiate Correction

The inspector taps "Crear corrección" on a signed report page.

#### 1.1 Confirmation Dialog

Before creating the correction, a confirmation dialog is shown:

| Element | Style | Behavior |
|---------|-------|----------|
| Title | `text-lg`, `font-semibold` | "¿Crear una corrección?" |
| Message | `text-sm`, `gray-600` | "Se creará un nuevo borrador vinculado a este reporte. El reporte original no será modificado." |
| Cancel button | Secondary button | "Cancelar" — dismisses the dialog |
| Confirm button | Primary button | "Crear corrección" — triggers the server action |

#### 1.2 Server Action: `createCorrectionAction`

On confirmation, the client calls the server action.

### Step 2: Correction Draft Created

After successful creation, the inspector is redirected to the new draft in Field Mode (`/dashboard/inspect/{newEventId}`).

The new draft:
- Has `correction_of_id = original_event_id`.
- Inherits the same `vehicle_id` from the original event.
- Starts with the same template snapshot (copied from the original event's InspectionDetail).
- Pre-populates findings from the original event's findings (status, observations copied).
- Pre-populates metadata from the original event (`odometer_km`, `event_date`, `inspection_type`, `requested_by`).
- Has a new `slug` generated at creation time.
- Has `status = 'draft'`.
- Does **not** copy photos — the inspector captures new photos as needed.

The inspector can then modify any findings, add/update observations, capture new photos, and update metadata before signing.

### Step 3: Sign the Correction

The correction follows the standard signing flow (Phase 3A). All the same preconditions apply:
- Completeness validation (all checklist items evaluated).
- Authentication and authorization (active NodeMember for event's node).
- Connectivity required.

After signing, the correction report is publicly accessible at `/report/{new_slug}`.

---

## Relationship Display

### On the Original Report (when a correction exists)

A notice banner appears at the top of the report page, above the vehicle summary card:

| Element | Style | Behavior |
|---------|-------|----------|
| Notice container | `status-attention-bg` bg, `radius-sm`, `space-3` padding, full-width | Top of report page |
| Icon | ⚠ warning icon, `status-attention` color | Left of text |
| Text | `text-sm`, `status-attention` color, `font-medium` | "Se emitió una corrección para este reporte." |
| Link | `text-sm`, `brand-accent`, underlined | "Ver corrección →" — navigates to `/report/{correction_slug}` |

- If multiple corrections exist, display the most recent correction's link.
- The notice does not affect the rest of the report content. All findings, photos, and inspector info remain unchanged (immutability).

### On the Correction Report

A notice banner appears at the top of the report page:

| Element | Style | Behavior |
|---------|-------|----------|
| Notice container | `info` bg tint (`blue-50`), `radius-sm`, `space-3` padding, full-width | Top of report page |
| Icon | ℹ info icon, `info` color | Left of text |
| Text | `text-sm`, `info` color, `font-medium` | "Este reporte corrige un reporte anterior." |
| Link | `text-sm`, `brand-accent`, underlined | "Ver original →" — navigates to `/report/{original_slug}` |

### On the Vehicle Timeline

Both the original and the correction appear as separate events on the vehicle timeline (`/vehicle/{vin}`), each in chronological order based on `signed_at`.

Correction markers on the timeline follow the specification in `specs/ui/vehicle-page.md`:
- Original event shows "Se emitió una corrección" notice inside the event card.
- Correction event shows "Corrige reporte anterior" notice inside the event card.

---

## Server Action

### `createCorrectionAction`

**Location:** `src/lib/actions/inspection.ts`

**Input:**

```typescript
{
  eventId: string  // UUID of the original signed event to correct
}
```

**Zod Schema:**

```typescript
const createCorrectionSchema = z.object({
  eventId: z.string().uuid("ID de inspección inválido."),
});
```

**Flow:**

```
Client calls createCorrectionAction({ eventId })
  → Zod validation on input
  → Get authenticated user from session
  → Call service: inspection.createCorrection(eventId, userId)
    → SELECT original event WHERE id = :eventId
    → Check: event exists → NOT_FOUND
    → Check: event.status = 'signed' → INVALID_STATE
    → Check: event.event_type = 'inspection' → INVALID_EVENT_TYPE
    → Check: user has active NodeMember for event.node_id → FORBIDDEN
    → SELECT inspection_detail WHERE event_id = :eventId
    → SELECT inspection_findings WHERE event_id = :eventId
    → Generate new slug (8 chars, unique)
    → BEGIN TRANSACTION
      → INSERT new event (correction_of_id = :eventId, same vehicle_id, node_id, status='draft')
      → INSERT inspection_detail (copy template_snapshot, inspection_type, requested_by)
      → INSERT inspection_findings (copy all findings with status + observations from original)
    → COMMIT
  → On success: return { success: true, data: { event } }
  → On error: return { success: false, error: errorMessage }
```

**Return Shape:**

```typescript
// Success
{ success: true, data: { event: Event } }

// Error
{ success: false, error: string }
```

---

## Service Function

### `inspection.createCorrection`

**Location:** `src/lib/services/inspection.ts`

**Signature:**

```typescript
async function createCorrection(
  originalEventId: string,
  userId: string
): Promise<Event>
```

**Logic:**

1. Fetch original event. Validate it exists, is signed, and is an inspection.
2. Authorize: user has active NodeMember for original event's `node_id`.
3. Fetch original event's InspectionDetail and InspectionFindings.
4. Generate a unique slug for the new event.
5. In a single transaction:
   - Create new event with `correction_of_id = originalEventId`, same `vehicle_id`, `node_id`, copied `odometer_km`, `event_date`.
   - Create InspectionDetail with copied `template_snapshot`, `inspection_type`, `requested_by`.
   - Create InspectionFindings — copy all findings from the original (same `section_id`, `item_id`, `status`, `observation`). New UUIDs for each finding. `event_id` points to the new event.
6. Return the new event.

---

## Error Handling

All errors are caught at the server action level and returned as `{ success: false, error }`.

| Error Code | Message | Cause |
|-----------|---------|-------|
| `UNAUTHENTICATED` | "Debés iniciar sesión para crear una corrección." | No session |
| `FORBIDDEN` | "No tenés permisos para corregir esta inspección." | Not a node member or inactive membership |
| `NOT_FOUND` | "La inspección no fue encontrada." | Event does not exist |
| `INVALID_STATE` | "Solo se pueden corregir inspecciones firmadas." | Event is not signed |
| `INVALID_EVENT_TYPE` | "Solo se pueden corregir inspecciones." | Event type is not `inspection` |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Original event is a draft** | Server action returns `INVALID_STATE`. Only signed events can be corrected. |
| **Multiple corrections of the same event** | Allowed. Each creates a new independent event with `correction_of_id` pointing to the same original. The original report shows the most recent correction's link. |
| **Correction of a correction** | Allowed. The new correction's `correction_of_id` points to the correction event, not the root original. The chain is two-level: original → correction → correction-of-correction. |
| **Inspector from different node** | Authorization check fails with `FORBIDDEN`. Only members of the original event's node can create corrections. |
| **Original event has photos** | Photos are NOT copied. The correction starts without photos. The inspector captures new ones if needed. |
| **Correction draft is deleted** | Allowed — the draft can be deleted like any other draft. The original event is unaffected. |
| **Correction draft is never signed** | The correction remains as a draft indefinitely. The original report does not show a correction notice (notices only appear when the correction is signed). |
| **Original report shows correction notice** | Only for signed corrections. Draft corrections do not trigger the notice on the original report. |
| **Suspended node** | If the node is suspended after the original was signed, correction creation should still fail at the authorization step (node must be active). |
| **User navigates to correction from report** | Taps "Crear corrección" → confirmation dialog → creates draft → redirected to Field Mode. |
| **Offline** | Correction creation requires connectivity (creates records on the server). The button should show a "Requiere conexión" tooltip or disable when offline. |

---

## Data Flow

### Correction Creation

```
Inspector views signed report at /report/{slug}
  → Taps "Crear corrección"
  → Confirmation dialog shown
  → Taps "Crear corrección" (confirm)
  → Server action: createCorrectionAction({ eventId })
  → Zod validation: eventId is valid UUID
  → Auth: get userId from session
  → Service: createCorrection(eventId, userId)
    → SELECT event WHERE id = :eventId
    → Check: event exists → NOT_FOUND
    → Check: event.status = 'signed' → INVALID_STATE
    → Check: event.event_type = 'inspection' → INVALID_EVENT_TYPE
    → SELECT node_members WHERE node_id = event.node_id AND user_id = :userId AND status = 'active'
    → Check: membership exists → FORBIDDEN
    → SELECT inspection_details WHERE event_id = :eventId
    → SELECT inspection_findings WHERE event_id = :eventId
    → Generate slug (8 chars, unique)
    → BEGIN TRANSACTION
      → INSERT events (correction_of_id = :eventId, vehicle_id, node_id, status='draft', slug=:newSlug, ...)
      → INSERT inspection_details (template_snapshot, inspection_type, requested_by from original)
      → INSERT inspection_findings (copy status, observation for each from original, new event_id)
    → COMMIT
  → Return { success: true, data: { event: newEvent } }
  → Client redirects to /dashboard/inspect/{newEvent.id}
```

### Correction Notice Display (on original report)

```
Report page loads at /report/{slug} (server component)
  → Service: inspection.getPublicReport(slug)
    → SELECT event WHERE slug = :slug AND status = 'signed'
    → SELECT events WHERE correction_of_id = event.id AND status = 'signed'
      ORDER BY signed_at DESC LIMIT 1
    → If correction exists: include { hasCorrectionSlug: correction.slug }
  → Render correction notice banner if hasCorrectionSlug is present
```

### Correction Notice Display (on correction report)

```
Report page loads at /report/{slug} (server component)
  → Service: inspection.getPublicReport(slug)
    → SELECT event WHERE slug = :slug AND status = 'signed'
    → If event.correction_of_id IS NOT NULL:
      → SELECT original_event WHERE id = event.correction_of_id
      → Include { correctsOriginalSlug: original_event.slug }
  → Render correction notice banner if correctsOriginalSlug is present
```

---

## Test Plan

Per `specs/architecture.md §5` — coverage target ≥ 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| Correction Zod schema | `validators.ts` | Valid UUID passes · Missing `eventId` fails · Invalid UUID format fails · Extra fields stripped |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `createCorrection` service | `services/inspection.ts` | Creates correction draft linked to original via `correction_of_id` · Copies template snapshot, findings (status + observations), metadata from original · Does NOT copy photos · Generates unique slug · Correction has `status = 'draft'` · Rejects correction of draft event (`INVALID_STATE`) · Rejects correction of non-existent event (`NOT_FOUND`) · Rejects unauthorized user (not node member) → `FORBIDDEN` · Rejects inactive membership → `FORBIDDEN` · Allows multiple corrections of same original · Allows correction of a correction |
| `getPublicReport` service (correction notices) | `services/inspection.ts` | Returns `hasCorrectionSlug` when original has a signed correction · Returns `null` when original has no correction · Returns `null` when correction is still a draft · Returns most recent correction slug when multiple exist · Returns `correctsOriginalSlug` on correction report · Returns `null` on non-correction report |
| `createCorrectionAction` action | `actions/inspection.ts` | Valid input + signed event → `{ success: true, data: { event } }` · Invalid eventId → `{ success: false, error }` · Draft event → `{ success: false, error: "Solo se pueden corregir inspecciones firmadas." }` · Unauthenticated → `{ success: false, error }` · Return shape matches contract |

### Component Tests

| Component | Cases |
|-----------|-------|
| **"Crear corrección" button** | Visible to authenticated node member on signed report · Hidden for unauthenticated visitors · Hidden for authenticated non-members · Tap shows confirmation dialog |
| **Confirmation dialog** | Renders title, message, cancel and confirm buttons · Cancel dismisses dialog · Confirm triggers server action · Shows loading state during creation · Redirects to new draft on success · Shows error toast on failure |
| **Original report correction notice** | Renders notice banner when correction exists · Notice shows "Se emitió una corrección" text · Link navigates to correction report · Hidden when no signed correction exists |
| **Correction report notice** | Renders notice banner on correction report · Notice shows "Este reporte corrige un reporte anterior" text · Link navigates to original report |

---

## Acceptance Criteria

- [ ] "Crear corrección" button visible only to authenticated node members on signed reports
- [ ] Confirmation dialog shown before creating correction
- [ ] Correction creates a new draft event with `correction_of_id` pointing to original
- [ ] Original event is never modified (immutability preserved)
- [ ] Correction copies template snapshot, findings (status + observations), and metadata from original
- [ ] Correction does NOT copy photos
- [ ] Correction generates a new unique slug
- [ ] Inspector is redirected to Field Mode with the new draft
- [ ] Standard signing flow applies to correction drafts
- [ ] Original report shows "Se emitió una corrección" notice (only for signed corrections)
- [ ] Correction report shows "Este reporte corrige un reporte anterior" notice
- [ ] Both events appear on vehicle timeline with correction markers
- [ ] Multiple corrections of the same original are allowed
- [ ] Server action validates input with Zod and returns `{ success, data?, error? }` shape
- [ ] Authorization checks: user must be active NodeMember for original event's node
- [ ] All error messages in Spanish
