# Entity: Inspection Template

Defines the structure an inspector uses for their reports. Each inspector has one template in Phase 1.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| node_id | UUID | FK → nodes(id), NOT NULL |
| name | VARCHAR(255) | NOT NULL — e.g., "Pre-purchase Full Inspection" |
| sections | JSONB | NOT NULL — ordered list of sections with items |
| created_at | TIMESTAMP | default `now()`, NOT NULL |
| updated_at | TIMESTAMP | default `now()`, NOT NULL — updated on every save |

## Sections JSON Structure

```json
{
  "sections": [
    {
      "id": "uuid-section-1",
      "name": "Exterior",
      "order": 1,
      "items": [
        {
          "id": "uuid-item-1",
          "name": "Body condition and paint",
          "order": 1,
          "type": "checklist_item"
        },
        {
          "id": "uuid-item-2",
          "name": "Glass and mirrors",
          "order": 2,
          "type": "checklist_item"
        }
      ]
    },
    {
      "id": "uuid-section-8",
      "name": "Conclusion",
      "order": 8,
      "items": [
        {
          "id": "uuid-item-conclusion",
          "name": "General observations and recommendation",
          "order": 1,
          "type": "free_text"
        }
      ]
    }
  ]
}
```

## Item Types

- **`checklist_item`** — renders with: status selector (good / attention / critical / not_evaluated), free-text observation, photo upload, optional tags. Used for specific evaluation points.
- **`free_text`** — renders with: text field and optional photo upload only. No status selector, no tags. Used for general observations, conclusions, notes.

## Behavior

- **One template per node in Phase 1.** Multiple templates deferred.
- **Starter template provided on node creation.** Based on PRD Section 9.9:
  1. Exterior (body, paint, glass, lights, tires, wheels)
  2. Engine Bay (oil, coolant, belts, hoses, battery, leaks)
  3. Interior (seats, dashboard, controls, HVAC, electronics, odometer)
  4. Undercarriage (frame, suspension, exhaust, drivetrain, fluid leaks)
  5. Mechanical Test (engine start/idle, transmission, brakes, steering, noises)
  6. Road Test (acceleration, braking, steering response, suspension, alignment)
  7. Electrical / Electronics (OBD scan, warning lights, sensors)
  8. Documentation (title verification, service records, VIN match)
  9. Conclusion (general observations and recommendation — `free_text` type)

  Each section has 4-8 `checklist_item` items, except Conclusion which has 1 `free_text` item.
- **Inspector customizes freely:** add, remove, reorder sections. Add, remove, reorder, rename items within sections. Change item type.
- **Template changes apply to future inspections only.** Completed inspections retain the template structure via snapshot (see InspectionDetail).
- **Section/item IDs are UUIDs generated client-side** when the inspector creates them in the editor. These IDs are referenced by findings.

## API

- `GET` — returns the template for the authenticated user's node.
- `PUT` — updates the template (full replacement of sections JSON). Validates structure.
- No public endpoint.

## Example — Starter Template (abbreviated)

```json
{
  "id": "d4e5f6a7-b8c9-0123-defg-234567890123",
  "node_id": "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
  "name": "Inspección Pre-Compra Completa",
  "sections": {
    "sections": [
      {
        "id": "sec-exterior",
        "name": "Exterior",
        "order": 1,
        "items": [
          { "id": "ext-body", "name": "Estado de carrocería y pintura", "order": 1, "type": "checklist_item" },
          { "id": "ext-glass", "name": "Vidrios y espejos", "order": 2, "type": "checklist_item" },
          { "id": "ext-lights", "name": "Luces y ópticas", "order": 3, "type": "checklist_item" },
          { "id": "ext-tires", "name": "Neumáticos y llantas", "order": 4, "type": "checklist_item" }
        ]
      },
      {
        "id": "sec-conclusion",
        "name": "Conclusión",
        "order": 9,
        "items": [
          { "id": "concl-obs", "name": "Observaciones generales y recomendación", "order": 1, "type": "free_text" }
        ]
      }
    ]
  },
  "created_at": "2026-03-10T10:15:00Z",
  "updated_at": "2026-03-10T10:15:00Z"
}
```

## Dependencies

- **Requires:** Node
- **Required by:** InspectionDetail (template_snapshot), Inspection Creation flow

## Acceptance Criteria

- [ ] Starter template seeded when a new node is created
- [ ] Template editor allows add/remove/reorder sections and items
- [ ] Template editor allows renaming sections and items
- [ ] Template editor allows changing item type (checklist_item ↔ free_text)
- [ ] Template save validates JSON structure (sections, items, required fields)
- [ ] Template changes do not affect already-created inspections
- [ ] Section and item IDs are stable UUIDs (not array indices)
