# Entity: Vehicle

The central entity in the system. All events, inspection reports, and identity data attach to a vehicle identified by VIN.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| vin | VARCHAR(17) | UNIQUE, NOT NULL |
| plate | VARCHAR(20) | nullable |
| make | VARCHAR(100) | nullable |
| model | VARCHAR(100) | nullable |
| year | INTEGER | nullable |
| trim | VARCHAR(100) | nullable — trim level / variant (e.g., "XEI", "SEG", "Sport") |
| created_by_node_id | UUID | FK → nodes(id), nullable |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## Behavior

- **Created as a side effect.** Vehicles are not created directly. They are created when an inspector starts an inspection for a VIN not yet in the system.
- **VIN validation:** exactly 17 alphanumeric characters, no I/O/Q (per ISO 3779). Check digit (position 9, mod-11) validated only for regions that mandate it: USA (first char 1/4/5), Canada (2), Mexico (3), China (L). For all other WMI prefixes, position 9 is a manufacturer descriptor and check digit validation is skipped. Reject with a clear, specific error message.
- **VIN decoding:** on creation, attempt to decode make/model/year/trim via auto.dev VIN Decode API (`GET https://api.auto.dev/vin/{vin}`, Bearer token auth). This is a paid, pay-per-request API — only call it when the vehicle is **not already in the database** (DB miss). If decode fails, returns incomplete data, or the vehicle already exists in the DB, the inspector enters/edits fields manually. Decoding is best-effort convenience, not a blocker.
- **VIN is immutable after creation.** The VIN cannot be changed. Other fields (plate, make, model, year, trim) can be updated if initially blank or incorrect.
- **No owner concept.** The vehicle is a data container identified by VIN, not an owned entity. No ownership claims in Phase 1.
- **Vehicle history persists across any future ownership changes.** The ledger belongs to the VIN, not an owner.

## API

- No public CRUD endpoints. Vehicles are created/looked up internally during the inspection creation flow.
- `GET /api/vehicles/[vin]` — returns vehicle summary + chronological event timeline. Used by the public vehicle page (`/vehicle/[vin]`). No auth required.

## Example Data

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "vin": "3N1AB7AP5KY250312",
  "plate": "AC123BD",
  "make": "Nissan",
  "model": "Sentra",
  "year": 2019,
  "trim": "SR",
  "created_by_node_id": "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
  "created_at": "2026-03-12T14:30:00Z"
}
```

## Dependencies

- **Requires:** Node (for `created_by_node_id` FK)
- **Required by:** Event, Vehicle Page flow

## Acceptance Criteria

- [ ] VIN uniqueness enforced at DB level (unique constraint)
- [ ] VIN validation rejects invalid formats with a specific error message
- [ ] VIN decode populates make/model/year/trim when auto.dev returns data
- [ ] VIN decode failure does not block vehicle creation
- [ ] Vehicle created automatically during inspection flow if VIN not found
- [ ] Duplicate VIN during inspection flow returns existing vehicle (no error)
