# Entity: Inspection Detail

Type-specific data for events where `event_type = inspection`. One-to-one relationship with Event.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| event_id | UUID | FK → events(id), UNIQUE, NOT NULL |
| template_snapshot | JSONB | NOT NULL — frozen copy of the inspector's template at inspection creation time |
| inspection_type | ENUM(`pre_purchase`, `intake`, `periodic`, `other`) | NOT NULL |
| requested_by | ENUM(`buyer`, `seller`, `agency`, `other`) | NOT NULL |

## Behavior

- **One InspectionDetail per event.** The FK to events is unique — this is a strict 1:1 relationship.
- **Created when the inspector starts a new inspection.** The inspection detail is created at the same time as the event.
- **Template snapshot:** at inspection creation, the inspector's current template is copied into `template_snapshot`. This preserves the exact template structure used, ensuring the report renders correctly even if the inspector later modifies their template. The snapshot format is identical to the InspectionTemplate `sections` JSON.
- **inspection_type and requested_by** are metadata displayed on the report. They inform the buyer about the context of the inspection but do not change the form structure.

## Why a Separate Table

The Event entity is the base of the vehicle ledger — shared across all event types. InspectionDetail holds inspection-specific data only. When future event types are added (execution, modification), they get their own detail tables without polluting the Event or InspectionDetail schemas.

## Example Data

```json
{
  "id": "f6a7b8c9-d0e1-2345-fghi-456789012345",
  "event_id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "template_snapshot": {
    "sections": [
      {
        "id": "sec-exterior",
        "name": "Exterior",
        "order": 1,
        "items": [
          { "id": "ext-body", "name": "Estado de carrocería y pintura", "order": 1, "type": "checklist_item" },
          { "id": "ext-glass", "name": "Vidrios y espejos", "order": 2, "type": "checklist_item" }
        ]
      }
    ]
  },
  "inspection_type": "pre_purchase",
  "requested_by": "buyer"
}
```

## Dependencies

- **Requires:** Event, InspectionTemplate (for snapshot source)
- **Required by:** InspectionFinding (findings reference section/item IDs from the snapshot), Report Viewing flow

## Acceptance Criteria

- [ ] 1:1 with Event enforced at DB level (unique constraint on event_id)
- [ ] Template snapshot is a frozen copy — not a reference to the live template
- [ ] Modifying the live template does not affect existing inspection details
- [ ] inspection_type and requested_by are displayed on the public report
