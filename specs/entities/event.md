# Entity: Event

The atomic unit of the vehicle's ledger. Every signed record — whether an inspection, a repair, a modification, or a measurement — is an Event. In Phase 1, the only event type is `inspection`.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| vehicle_id | UUID | FK → vehicles(id), NOT NULL |
| node_id | UUID | FK → nodes(id), NOT NULL — signing node |
| signed_by_user_id | UUID | FK → users(id), nullable — set on signing |
| event_type | ENUM(`inspection`) | NOT NULL. Extensible to `execution`, `modification`, `measurement` in future phases |
| odometer_km | INTEGER | NOT NULL |
| event_date | DATE | NOT NULL |
| status | ENUM(`draft`, `signed`) | NOT NULL, default `draft` |
| signed_at | TIMESTAMP | nullable — system-set at the moment of signing |
| slug | VARCHAR(20) | UNIQUE, NOT NULL — URL-friendly identifier for the public report page |
| correction_of_id | UUID | FK → events(id), nullable — references original event if this is a correction |
| created_at | TIMESTAMP | default `now()`, NOT NULL |
| updated_at | TIMESTAMP | default `now()`, NOT NULL |

## Behavior

### Draft State
- An event is editable while in `draft` status.
- All fields except `id`, `slug`, and `created_at` can be modified.
- Drafts are not visible on public pages (vehicle page, report links return 404).
- Drafts are visible on the inspector's dashboard.

### Signing
- Signing transitions the event from `draft` to `signed`.
- On sign, the system sets: `status = 'signed'`, `signed_at = now()`, `signed_by_user_id = current user`.
- **Signing requires connectivity** — the `signed_at` timestamp must be server-authoritative.
- **Signing is irreversible.** Once signed, the event cannot return to draft status.

### Immutability After Signing
- A signed event **cannot be updated or deleted** via any code path.
- The service layer rejects any mutation on a signed event before it reaches the database.
- This is the most critical invariant in the system.

### Corrections
- Corrections are **new events**, not mutations of existing ones.
- A correction references the original via `correction_of_id`.
- The original report displays a notice: "A correction has been issued for this report."
- The correction report displays: "This corrects report [original link]."
- Both appear on the vehicle timeline.

### Slug Generation
- Generated at event creation time (not at signing).
- Short, URL-safe string (e.g., `a7x3k9m2`). 8 characters, alphanumeric, lowercase.
- Must be unique. Regenerate on collision (extremely rare with 8-char alphanumeric).

## API

- Inspector-only CRUD for drafts (create, update, delete draft).
- Sign action (transitions draft → signed).
- `GET /report/[slug]` — public report page. Returns 404 for drafts. No auth required.

## Example Data

```json
{
  "id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "vehicle_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "node_id": "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
  "signed_by_user_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "event_type": "inspection",
  "odometer_km": 87500,
  "event_date": "2026-03-12",
  "status": "signed",
  "signed_at": "2026-03-12T16:45:00Z",
  "slug": "a7x3k9m2",
  "correction_of_id": null,
  "created_at": "2026-03-12T14:30:00Z",
  "updated_at": "2026-03-12T16:45:00Z"
}
```

## Dependencies

- **Requires:** Vehicle, Node, User
- **Required by:** InspectionDetail, InspectionFinding, EventPhoto, Review, Vehicle Page, Public Report

## Acceptance Criteria

- [ ] Draft events are editable; signed events reject all mutations
- [ ] Signing sets signed_at to server timestamp (not client-provided)
- [ ] Signed events are immutable — no update, no delete, no status change
- [ ] Slug is unique, generated at creation, URL-safe
- [ ] Draft events return 404 on public report URL
- [ ] Signed events render on public report URL
- [ ] Correction creates a new event with correction_of_id pointing to original
- [ ] Vehicle page shows all signed events chronologically, including corrections
