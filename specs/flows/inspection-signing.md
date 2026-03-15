# Flow: Inspection Signing

*Describes the signing logic: preconditions, completeness validation, immutability enforcement, slug behavior, and status transition.*
*Derived from: specs/entities/event.md | specs/entities/inspection-detail.md | specs/entities/inspection-finding.md | specs/entities/event-photo.md | specs/entities/node-member.md | specs/implementation-plan.md (Phase 3A)*

---

## Overview

Signing is the irreversible transition of an inspection event from `draft` to `signed`. Once signed, the event and all its associated data (findings, photos) become immutable. This flow covers the service-layer logic only — no UI is introduced in Phase 3A.

The signing action sets three fields atomically: `status = 'signed'`, `signed_at = now()` (server timestamp), and `signed_by_user_id = current user`. After signing, the public report becomes accessible at `/report/{slug}`.

---

## Prerequisites

- User is authenticated with role `user` (inspector).
- User has an active NodeMember record for the event's node.
- The event exists, has `status = 'draft'`, and `event_type = 'inspection'`.
- The device has network connectivity — signing **cannot** happen offline because `signed_at` must be server-authoritative.

---

## Sign Action Preconditions

Before transitioning the event, the service must validate all of the following. If any check fails, the action returns an error and the event remains in `draft` status.

### 1. Authentication & Authorization

| Check | Error |
|-------|-------|
| User is authenticated | `UNAUTHENTICATED` — "Debés iniciar sesión para firmar." |
| User has active NodeMember for event's `node_id` | `FORBIDDEN` — "No tenés permisos para firmar esta inspección." |
| NodeMember status is `active` | `FORBIDDEN` — "Tu membresía en este nodo está inactiva." |

### 2. Event State

| Check | Error |
|-------|-------|
| Event exists | `NOT_FOUND` — "La inspección no fue encontrada." |
| Event `status` is `draft` | `ALREADY_SIGNED` — "Esta inspección ya fue firmada." |
| Event `event_type` is `inspection` | `INVALID_EVENT_TYPE` — "Solo se pueden firmar inspecciones." |

### 3. Completeness Validation

The inspection must be sufficiently complete before signing. Completeness is evaluated against the template snapshot stored in InspectionDetail.

| Check | Error |
|-------|-------|
| InspectionDetail exists for the event | `INVALID_STATE` — "La inspección no tiene detalle asociado." |
| All `checklist_item` findings have `status ≠ not_evaluated` | `INCOMPLETE` — "Hay items sin evaluar. Completá todos los items de checklist antes de firmar." |

#### Completeness Rules — Detail

- Walk the `template_snapshot.sections` from InspectionDetail.
- For each section, iterate over items.
- For each item where `type = 'checklist_item'`: look up the corresponding InspectionFinding by `(event_id, section_id, item_id)`.
  - The finding must exist (it was pre-created at inspection creation).
  - The finding `status` must be one of: `good`, `attention`, or `critical`. A status of `not_evaluated` means the item was skipped.
- Items where `type = 'free_text'` are **exempt** from completeness checks. They have no `status` field (status is `null`). An empty observation on a free-text item does not block signing.
- **Photos are not required** for completeness. An item with zero photos can still be signed. However, if photos have been captured but not yet uploaded to Cloudinary, signing is blocked until uploads complete (see `specs/flows/cloudinary-upload.md`).
- **Observations are not required** for completeness. An evaluated checklist item with an empty observation is valid.

#### What Counts as Incomplete

- At least one `checklist_item` finding has `status = 'not_evaluated'`.
- A finding record is missing for a `checklist_item` in the template snapshot (should not happen if creation logic is correct, but guarded defensively).

---

## Status Transition

When all preconditions pass, the service executes the signing in a single database transaction:

```
BEGIN TRANSACTION

  1. SELECT event WHERE id = :eventId AND status = 'draft' FOR UPDATE
     → Lock the row to prevent concurrent signing attempts.
     → If no row returned (already signed or deleted): abort, return ALREADY_SIGNED.

  2. UPDATE events SET
       status = 'signed',
       signed_at = now(),                    -- server timestamp, never client-provided
       signed_by_user_id = :currentUserId,
       updated_at = now()
     WHERE id = :eventId

  3. Return updated event record.

COMMIT
```

### Post-Signing State

After a successful signing:

| Field | Value |
|-------|-------|
| `status` | `'signed'` |
| `signed_at` | Server-set timestamp (`now()` at the moment of the UPDATE) |
| `signed_by_user_id` | The authenticated user's ID |
| `updated_at` | Same as `signed_at` |

The slug was already generated at event creation (Phase 2). Signing does not modify the slug.

---

## Slug Behavior

- The slug is generated at **event creation time** (in `createInspection`), not at signing time.
- The slug is 8 characters, lowercase alphanumeric, unique across all events.
- The slug is already present on draft events but the public route `/report/{slug}` returns 404 for drafts.
- After signing, the slug becomes the permanent URL identifier: `/report/{slug}`.
- **No slug changes occur during signing.** The slug is immutable once created.

---

## Immutability Enforcement

After an event is signed, the service layer must reject **all** mutations on the event and its associated data. This is the most critical invariant in the system.

### What Is Immutable After Signing

| Entity | Mutations Rejected |
|--------|-------------------|
| **Event** | Any field update (`odometer_km`, `event_date`, `vehicle_id`, etc.), status change, soft delete |
| **InspectionDetail** | Any field update (`template_snapshot`, `inspection_type`, `requested_by`) |
| **InspectionFinding** | Status change, observation edit, tag modification, deletion |
| **EventPhoto** | URL change, caption edit, reorder, deletion, new photo creation for this event |

### Where to Enforce

Immutability is enforced at the **service layer**, before any database query is executed. Every service function that mutates event-related data must include an immutability guard:

```typescript
// Pattern: immutability guard (applied in every mutation service function)
async function assertEventIsMutable(eventId: string): Promise<void> {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event[0]) throw new NotFoundError("Evento no encontrado.");
  if (event[0].status === "signed") {
    throw new ImmutableEventError("No se puede modificar una inspección firmada.");
  }
}
```

### Service Functions That Must Guard

| Service | Function | Guard |
|---------|----------|-------|
| `inspection` | `updateDraft` | `assertEventIsMutable(eventId)` |
| `inspection` | `updateFinding` | `assertEventIsMutable(finding.eventId)` |
| `inspection` | `deleteDraft` | `assertEventIsMutable(eventId)` |
| `inspection` | `addPhoto` | `assertEventIsMutable(eventId)` |
| `inspection` | `deletePhoto` | `assertEventIsMutable(photo.eventId)` |
| `inspection` | `updatePhoto` | `assertEventIsMutable(photo.eventId)` |

### Guard Does NOT Apply To

- **Read operations**: fetching event, findings, photos, detail — always allowed.
- **Signing itself**: the `signInspection` function checks `status = 'draft'` as a precondition, not via the generic guard.
- **Correction creation**: creating a *new* event with `correction_of_id` pointing to the signed event is allowed. The original signed event is not modified.

---

## Server Action

The server action is a thin wrapper around the service function, following the standard pattern from `specs/architecture.md`.

### `signInspectionAction`

**Location:** `src/lib/actions/inspection.ts`

**Input:**

```typescript
{
  eventId: string  // UUID of the event to sign
}
```

**Zod Schema:**

```typescript
const signInspectionSchema = z.object({
  eventId: z.string().uuid("ID de inspección inválido."),
});
```

**Flow:**

```
Client calls signInspectionAction({ eventId })
  → Zod validation on input
  → Get authenticated user from session
  → Call service: inspection.signInspection(eventId, userId)
    → Authorization check (active NodeMember for event's node)
    → Event state check (exists, is draft, is inspection)
    → Completeness validation (all checklist items evaluated)
    → Execute signing transaction (status, signed_at, signed_by_user_id)
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

## Error Handling

All errors are caught at the server action level and returned as `{ success: false, error }`. No thrown errors cross the server-client boundary.

| Error Code | HTTP-like | Message | Cause |
|-----------|-----------|---------|-------|
| `UNAUTHENTICATED` | 401 | "Debés iniciar sesión para firmar." | No session |
| `FORBIDDEN` | 403 | "No tenés permisos para firmar esta inspección." | Not a node member or inactive membership |
| `NOT_FOUND` | 404 | "La inspección no fue encontrada." | Event does not exist |
| `ALREADY_SIGNED` | 409 | "Esta inspección ya fue firmada." | Event status is `signed` |
| `INVALID_EVENT_TYPE` | 422 | "Solo se pueden firmar inspecciones." | Event type is not `inspection` |
| `INVALID_STATE` | 422 | "La inspección no tiene detalle asociado." | Missing InspectionDetail |
| `INCOMPLETE` | 422 | "Hay items sin evaluar. Completá todos los items de checklist antes de firmar." | Unevaluated checklist items |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Concurrent signing attempts** | `SELECT ... FOR UPDATE` locks the row. Second attempt sees `status = 'signed'` and returns `ALREADY_SIGNED`. |
| **Event with zero findings** | Should not happen if creation logic is correct. Defensively: if no findings exist, signing fails with `INCOMPLETE` because there are zero evaluated items against the template. |
| **Event with only free_text items** | All items are exempt from completeness checks. Signing succeeds — free_text items have no status to evaluate. |
| **Template snapshot has empty sections** | Sections with zero items contribute nothing to completeness. If all sections are empty, there are no checklist items to evaluate, so signing succeeds. |
| **Photo uploads still pending (in Dexie queue)** | Signing is **blocked**. The client checks for photos with `uploaded = false` in Dexie before enabling the sign button. The inspector must wait for all uploads to complete, retry failed uploads, or delete pending photos before signing. This is enforced client-side (not a server precondition) since the server never sees un-uploaded photos. See `specs/flows/cloudinary-upload.md §Interaction with Signing`. |
| **Network lost during signing** | The server action fails. The client shows an error toast. The event remains in `draft`. The inspector retries when connectivity returns. |
| **User signs from a different device** | Allowed, as long as the user has an active NodeMember for the event's node. The Dexie draft on the original device becomes stale (last-write-wins on next sync). |
| **Event belongs to a different node than user's** | Authorization check fails with `FORBIDDEN`. |
| **Inactive NodeMember tries to sign** | Authorization check fails with `FORBIDDEN`. |
| **Attempt to update event after signing** | Immutability guard throws `ImmutableEventError`. Server action returns `{ success: false, error: "No se puede modificar una inspección firmada." }`. |
| **Attempt to delete finding on signed event** | Immutability guard throws `ImmutableEventError`. |
| **Attempt to add photo to signed event** | Immutability guard throws `ImmutableEventError`. |
| **Signed event soft delete attempted** | Immutability guard throws `ImmutableEventError`. Signed events cannot be deleted — they are permanent records. |

---

## Data Flow

### Signing

```
Inspector triggers sign (from UI in Phase 3B, or test harness)
  → Server action: signInspectionAction({ eventId })
  → Zod validation: eventId is valid UUID
  → Auth: get userId from session
  → Service: signInspection(eventId, userId)
    → SELECT event WHERE id = :eventId
    → Check: event exists → NOT_FOUND
    → Check: event.status = 'draft' → ALREADY_SIGNED
    → Check: event.event_type = 'inspection' → INVALID_EVENT_TYPE
    → SELECT node_members WHERE node_id = event.node_id AND user_id = :userId AND status = 'active'
    → Check: membership exists → FORBIDDEN
    → SELECT inspection_details WHERE event_id = :eventId
    → Check: detail exists → INVALID_STATE
    → Walk template_snapshot.sections → for each checklist_item:
      → SELECT inspection_findings WHERE event_id AND section_id AND item_id
      → Check: finding.status ≠ 'not_evaluated' → INCOMPLETE
    → BEGIN TRANSACTION
      → SELECT events WHERE id = :eventId AND status = 'draft' FOR UPDATE
      → UPDATE events SET status='signed', signed_at=now(), signed_by_user_id=:userId, updated_at=now()
    → COMMIT
  → Return { success: true, data: { event } }
```

### Immutability Guard (on any subsequent mutation)

```
Any mutation attempt on a signed event
  → Service function called (updateDraft, updateFinding, deletePhoto, etc.)
  → assertEventIsMutable(eventId)
    → SELECT event WHERE id = :eventId
    → event.status === 'signed' → throw ImmutableEventError
  → Mutation never reaches the database
  → Server action catches error → { success: false, error: "No se puede modificar una inspección firmada." }
```

---

## Test Plan

Per `specs/architecture.md §5` — coverage target ≥ 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| Sign action Zod schema | `validators.ts` | Valid UUID passes · Missing eventId fails · Invalid UUID format fails · Extra fields stripped |
| Completeness validation | `services/inspection.ts` | All checklist items evaluated → passes · One `not_evaluated` → fails · All free_text items → passes (exempt) · Mixed checklist + free_text, all checklist evaluated → passes · Empty sections (no items) → passes · Missing finding record for checklist item → fails |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `signInspection` service | `services/inspection.ts` | Signs valid complete draft → status `signed`, `signed_at` set to server timestamp, `signed_by_user_id` set · Rejects incomplete draft (unevaluated items) → error, status remains `draft` · Rejects already signed event → `ALREADY_SIGNED` · Rejects non-existent event → `NOT_FOUND` · Rejects unauthorized user (not node member) → `FORBIDDEN` · Rejects inactive membership → `FORBIDDEN` · Concurrent signing (race condition) → one succeeds, other gets `ALREADY_SIGNED` |
| Immutability guard | `services/inspection.ts` | `updateDraft` on signed event → throws `ImmutableEventError` · `updateFinding` on signed event → throws · `deleteDraft` on signed event → throws · `addPhoto` to signed event → throws · `deletePhoto` on signed event → throws · Read operations on signed event → succeed (no guard) |
| `signInspectionAction` action | `actions/inspection.ts` | Valid input + complete draft → `{ success: true, data: { event } }` with correct DB state · Invalid eventId → `{ success: false, error }` · Incomplete draft → `{ success: false, error }` with descriptive message · Unauthenticated → `{ success: false, error }` |

---

## Acceptance Criteria

- [ ] `signInspection(eventId, userId)` transitions a complete draft to `signed` status
- [ ] `signed_at` is set to server timestamp (`now()`), never client-provided
- [ ] `signed_by_user_id` is set to the authenticated user's ID
- [ ] Signing requires all `checklist_item` findings to have `status ≠ not_evaluated`
- [ ] `free_text` items are exempt from completeness validation
- [ ] Photos and observations are not required for completeness
- [ ] Signing is atomic (single transaction with row lock)
- [ ] Concurrent signing attempts are handled safely (one succeeds, others get `ALREADY_SIGNED`)
- [ ] Signed events reject all mutations at the service layer (update, delete, status change)
- [ ] Findings on signed events reject mutations (status change, observation edit, deletion)
- [ ] Photos on signed events reject mutations (add, delete, edit)
- [ ] Immutability guard runs before any database write
- [ ] Slug is not modified during signing (already generated at creation)
- [ ] Server action validates input with Zod and returns `{ success, data?, error? }` shape
- [ ] Authorization checks: user must be active NodeMember for event's node
- [ ] All error cases return descriptive Spanish-language messages
