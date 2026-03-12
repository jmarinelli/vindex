# Entity: Event Photo

Photos attached to findings or to the event as a whole. Named `EventPhoto` (not `InspectionPhoto`) because it belongs to the base event model and will be reused by future event types.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| event_id | UUID | FK → events(id), NOT NULL |
| finding_id | UUID | FK → inspection_findings(id), nullable — null if general event photo |
| url | VARCHAR(500) | NOT NULL — Cloudinary URL |
| caption | VARCHAR(500) | nullable — optional description |
| order | INTEGER | NOT NULL — display order within the finding or event |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## Behavior

- **Two types of photos:**
  - **Finding photos** (`finding_id` is set): attached to a specific finding as per-item evidence. Displayed under that finding in the report.
  - **General event photos** (`finding_id` is null): vehicle overview shots (exterior, VIN plate, odometer). Displayed in a separate section on the report.
- **Upload flow (online):** client compresses photo → uploads directly to Cloudinary → receives URL → saves URL to event_photo record via server action.
- **Upload flow (offline):** client captures photo → saves blob to IndexedDB → displays local thumbnail → queues for Cloudinary upload when connectivity returns → on successful upload, updates the record with the Cloudinary URL.
- **Photos cannot be modified or replaced after the event is signed.** Immutability extends to photos.
- **Order** determines display sequence within the finding or within the general photos section.
- **Cloudinary URL stored** is the base URL. Responsive variants are derived at render time via URL transformation parameters.

## Example Data

```json
{
  "id": "c9d0e1f2-a3b4-5678-ijkl-789012345678",
  "event_id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "finding_id": "a7b8c9d0-e1f2-3456-ghij-567890123456",
  "url": "https://res.cloudinary.com/vindex/image/upload/v1234567890/events/a7x3k9m2/ext-body-1.jpg",
  "caption": "Rayón en puerta trasera derecha",
  "order": 1,
  "created_at": "2026-03-12T15:02:00Z"
}
```

## Cloudinary URL Variants (at render time)

```
Thumbnail: https://res.cloudinary.com/vindex/image/upload/w_200,c_fill,q_auto/{public_id}.jpg
Standard:  https://res.cloudinary.com/vindex/image/upload/w_800,q_auto/{public_id}.jpg
Full:      https://res.cloudinary.com/vindex/image/upload/{public_id}.jpg
```

## Dependencies

- **Requires:** Event, InspectionFinding (optional)
- **Required by:** Report Viewing flow, OG image generation (first general photo used as preview)

## Acceptance Criteria

- [ ] Photos with finding_id display under the corresponding finding in the report
- [ ] Photos without finding_id display in a general photos section
- [ ] Photos are immutable after the parent event is signed
- [ ] Cloudinary upload works from mobile browser
- [ ] Local blob display works immediately after capture (before upload completes)
- [ ] Upload queue retries on failure with exponential backoff
- [ ] Order determines display sequence
