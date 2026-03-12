# Entity: Inspection Finding

The content the inspector produces for each item in the template. Each finding is anchored to a specific slot (section + item) in the template snapshot.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| event_id | UUID | FK → events(id), NOT NULL |
| section_id | UUID | NOT NULL — reference to section in template snapshot |
| item_id | UUID | NOT NULL — reference to item in template snapshot |
| status | ENUM(`good`, `attention`, `critical`, `not_evaluated`) | nullable — null for `free_text` items |
| observation | TEXT | nullable — free-text observation or content |
| tags | JSONB | nullable — optional normalized tags |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

**Unique constraint:** (`event_id`, `section_id`, `item_id`) — one finding per item per inspection.

## Behavior

### How Template and Findings Relate

1. The inspector defines their **template**: sections in order, each with items in order.
2. When an inspection is created, the template is **snapshotted** into InspectionDetail.template_snapshot.
3. For **each item** in the snapshot, a **Finding** record is created with default values (`status = not_evaluated`, `observation = null`).
4. The **report is rendered** by walking the template snapshot in order: Section 1 → Item 1 → render Finding for Item 1 → Item 2 → render Finding for Item 2 → etc.

### Behavior by Item Type

- **`checklist_item`:** finding has a `status` (good/attention/critical/not_evaluated), an `observation` (optional), photos, and optional tags. The report renders status indicator + observation + photos.
- **`free_text`:** finding has `status = null`, an `observation` (the text content), and optional photos. No status selector shown in form or report.

### Status Values (checklist items only)

- `good` — item is in acceptable condition.
- `attention` — item shows wear or minor issues; not urgent but notable.
- `critical` — item requires immediate attention or repair.
- `not_evaluated` — item was not assessed in this inspection.

### Optional Normalized Tags (checklist items only)

```json
{
  "vehicle_system": "brakes",
  "finding_type": "wear",
  "severity": "moderate"
}
```

Tags are optional in Phase 1. Not enforced, not required. Preserves the option for structured analytics in Phase 2 without adding friction now.

## Example Data — Checklist Item

```json
{
  "id": "a7b8c9d0-e1f2-3456-ghij-567890123456",
  "event_id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "section_id": "sec-exterior",
  "item_id": "ext-body",
  "status": "attention",
  "observation": "Rayón profundo en puerta trasera derecha, 15cm aprox. Pintura levantada. Resto de la carrocería en buen estado general.",
  "tags": { "vehicle_system": "body", "finding_type": "damage", "severity": "moderate" },
  "created_at": "2026-03-12T15:00:00Z"
}
```

## Example Data — Free Text Item

```json
{
  "id": "b8c9d0e1-f2a3-4567-hijk-678901234567",
  "event_id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "section_id": "sec-conclusion",
  "item_id": "concl-obs",
  "status": null,
  "observation": "Vehículo en buen estado general para el kilometraje. El rayón en la puerta trasera es el único daño estético relevante. Mecánicamente sólido. Recomiendo la compra con presupuesto de retoque de pintura.",
  "tags": null,
  "created_at": "2026-03-12T15:45:00Z"
}
```

## Dependencies

- **Requires:** Event, InspectionDetail (for template snapshot context)
- **Required by:** EventPhoto (photos attached to findings), Report Viewing flow

## Acceptance Criteria

- [ ] One finding per item per inspection (unique constraint on event_id + section_id + item_id)
- [ ] Findings are pre-created with defaults when inspection is created
- [ ] checklist_item findings have status; free_text findings have status = null
- [ ] Findings are immutable after the parent event is signed
- [ ] Report renders findings in template snapshot order (section order → item order)
- [ ] Tags are optional and do not block saving
