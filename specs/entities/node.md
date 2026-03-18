# Entity: Node

A verified entity authorized to sign inspection events. In Phase 1, all nodes are inspectors. The model is extensible to workshops in Phase 2.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| type | ENUM(`inspector`) | NOT NULL, default `inspector`. Extensible to `workshop` in Phase 2 |
| slug | VARCHAR(100) | UNIQUE, NOT NULL — URL-friendly identifier for public profile |
| display_name | VARCHAR(255) | NOT NULL |
| logo_url | VARCHAR(500) | nullable — Cloudinary URL for brand logo |
| brand_color | VARCHAR(7) | nullable — hex primary color (e.g., `#1E293B`). Used as top-border accent on identity cards, report cards, and email CTA buttons |
| brand_accent | VARCHAR(7) | nullable — hex accent color (e.g., `#0EA5E9`). Used for links and secondary CTA buttons on branded surfaces |
| contact_email | VARCHAR(255) | NOT NULL |
| contact_phone | VARCHAR(50) | nullable |
| address | TEXT | nullable — physical location |
| bio | TEXT | nullable — short professional description |
| status | ENUM(`active`, `suspended`) | NOT NULL, default `active` |
| verified_at | TIMESTAMP | NOT NULL — date of verification/onboarding |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## Behavior

- **Created by platform admin only.** No self-registration. The founder creates each node during onboarding.
- **Branding is self-service.** Node admins can update their own node's branding (logo, colors, contact info, bio) via the settings page. Structural fields (slug, type, status, verified_at) remain admin-only.
- **Signing authority belongs to the node**, not individual users. Users execute signing actions on the node's behalf.
- **Node identity is visible on all signed reports.** The node's display_name, logo, and contact info appear on every report they sign. Accountability is structural.
- **Slug is generated from display_name** at creation time (kebab-case, deduplicated with suffix if needed). Used for public profile URL: `/inspector/{slug}`.
- **Suspension:** a suspended node cannot sign new events. Existing signed events remain visible and unchanged.

## API

- Admin-only CRUD (create, update status, list all).
- Self-service branding update by node_admin members (logo, colors, contact info, bio).
- `GET /api/nodes/[slug]` — returns public profile data + aggregated metrics. Used by inspector profile page (`/inspector/{slug}`). No auth required.

## Public Profile Metrics (computed, not stored)

These are computed from the node's signed events at query time:

- Total signed inspections (count of signed events where node_id = this node).
- "Inspecting since" date (signed_at of the earliest signed event).
- Average detail level: average sections completed, photos per report, observations per report.
- Review aggregation: count and breakdown of match ratings from reviews on this node's events.

## Example Data

```json
{
  "id": "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
  "type": "inspector",
  "slug": "taller-martinez",
  "display_name": "Taller Martínez",
  "logo_url": "https://res.cloudinary.com/vindex/image/upload/nodes/taller-martinez-logo.png",
  "brand_color": "#2563EB",
  "brand_accent": "#0EA5E9",
  "contact_email": "contacto@tallermartinez.com",
  "contact_phone": "+54 11 4555-1234",
  "address": "Av. Corrientes 4500, CABA, Argentina",
  "bio": "Mecánico especializado en pre-compra con 12 años de experiencia. Inspecciones detalladas para vehículos nacionales e importados.",
  "status": "active",
  "verified_at": "2026-03-10T10:00:00Z",
  "created_at": "2026-03-10T10:00:00Z"
}
```

## Dependencies

- **Requires:** nothing
- **Required by:** NodeMember, InspectionTemplate, Event, Vehicle (created_by_node_id)

## Acceptance Criteria

- [ ] Only platform_admin can create nodes
- [ ] Slug generated automatically, unique constraint enforced at DB level
- [ ] Suspended node cannot sign new events (enforced at service layer)
- [ ] Public profile endpoint returns computed metrics without exposing internal IDs
- [ ] Logo upload works via Cloudinary
- [ ] Node admin can update branding fields (logo, brand_color, brand_accent, contact info, bio) via self-service
- [ ] brand_color and brand_accent validated as hex format (#RRGGBB)
- [ ] Logo used as avatar in dashboard header when set
