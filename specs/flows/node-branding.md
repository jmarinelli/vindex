# Flow: Node Branding (Self-Service)

*Describes how a node admin updates their node's branding — logo, colors, contact info, and bio — via the inspector settings page.*
*Derived from: specs/entities/node.md | specs/flows/cloudinary-upload.md | specs/architecture.md*

---

## Description

A node admin updates their node's branding (logo, primary color, accent color, contact info, bio) through a self-service settings page, so that public reports and the inspector profile reflect their identity.

## Actors

- **Node admin** — a user with `node_admin` role in `node_members` for the target node. Triggers the flow.
- **Public viewers** — see updated branding on reports and inspector profile (downstream effect).

## Preconditions

- User is authenticated.
- User is an active `node_admin` member of exactly one node.
- Node status is `active`.

## Steps

### 1. Load settings page

```
User navigates to /dashboard/settings
  → getSessionUser() — get authenticated user
  → getNodeForMember(userId) — get the node where user is active node_admin
  → Return current node data (display_name, logo_url, brand_color, brand_accent, contact_email, contact_phone, address, bio)
  → Render settings form pre-filled with current values
```

### 2. Update branding fields (text/color)

```
User edits fields and taps "Guardar cambios"
  → Client-side validation:
    → contact_email: required, valid email format
    → brand_color: optional, must be valid hex (#RRGGBB) if provided
    → brand_accent: optional, must be valid hex (#RRGGBB) if provided
    → contact_phone: optional, max 50 chars
    → address: optional, max 500 chars
    → bio: optional, max 500 chars
  → updateNodeBrandingAction({ contactEmail, contactPhone, address, bio, brandColor, brandAccent })
    → Zod validation (server-side)
    → getSessionUser() — verify authenticated
    → getNodeMembership(userId) — verify user is active node_admin
    → UPDATE nodes SET contact_email, contact_phone, address, bio, brand_color, brand_accent WHERE id = nodeId
    → Return { success: true, data: updatedNode }
  → Toast: "Cambios guardados"
```

### 3. Upload logo

```
User taps logo area → file picker opens
  → User selects image file
  → Client-side validation:
    → File type: image/jpeg, image/png, image/webp
    → File size: max 5MB before compression
  → compressImage(file) — canvas API, target ~500KB, JPEG/WebP
  → Show preview of compressed image immediately
  → uploadNodeLogo(blob, nodeId)
    → Direct unsigned POST to Cloudinary Upload API
    → Folder: inspectors/{nodeId}
    → public_id: logo-{uuid} (unique per upload to avoid cache issues)
    → On success: returns Cloudinary secure_url
  → updateNodeLogoAction({ logoUrl })
    → Zod validation
    → getSessionUser() — verify authenticated
    → getNodeMembership(userId) — verify user is active node_admin
    → UPDATE nodes SET logo_url = :logoUrl WHERE id = nodeId
    → Return { success: true }
  → Toast: "Logo actualizado"
  → Dashboard header avatar updates to show the new logo
```

### 4. Remove logo

```
User taps "Eliminar logo" button
  → Confirm dialog: "¿Eliminar el logo?"
  → updateNodeLogoAction({ logoUrl: null })
    → UPDATE nodes SET logo_url = NULL WHERE id = nodeId
  → Toast: "Logo eliminado"
  → Avatar falls back to initial letter
```

## Business Rules

- **Authorization:** only active `node_admin` members can update branding. Regular `member` role cannot.
- **display_name and slug are NOT editable** via self-service. These are set by platform admin at node creation. If an inspector needs to change their name, they contact the platform admin.
- **Logo Cloudinary folder:** `inspectors/{nodeId}/logo-{uuid}.{ext}` — different from event photos which use `events/{eventId}/`.
- **Old logos are NOT deleted from Cloudinary** on replacement. Orphan cleanup can happen out of band if needed (same pattern as event photos).
- **Color validation:** hex format `#RRGGBB` (7 chars including `#`). Both `brand_color` and `brand_accent` are optional — when null, the platform defaults (`brand-primary` and `brand-accent` from the design system) are used on public surfaces.
- **contact_email cannot be cleared** — it's required at the DB level.
- **No offline support needed.** Settings changes require connectivity. The settings page is not available offline.
- **Avatar in dashboard header:** when `logo_url` is set, the header `UserMenu` component uses the logo (Cloudinary-cropped to square, e.g. `w_64,h_64,c_fill`) instead of the initial-letter fallback. This applies across all dashboard pages.

## Postconditions

- Node record updated with new branding values.
- Public report pages (`/report/{slug}`) reflect the updated brand_color, brand_accent, and logo on next load.
- Inspector profile page (`/inspector/{slug}`) reflects updated branding on next load.
- Email templates sent after the update use the node's brand_color for CTA button styling.
- Dashboard header shows the updated logo as avatar (or falls back to initials if removed).

---

## Cloudinary Logo Upload Details

### Configuration

Same Cloudinary credentials as event photo uploads (shared upload preset).

| Key | Source | Purpose |
|-----|--------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `.env` (public) | Cloud name for upload URL |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `.env` (public) | Unsigned upload preset name |

### Upload Request

**Method:** `POST` to `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`

**Payload (FormData):**

| Field | Value |
|-------|-------|
| `file` | Compressed image blob |
| `upload_preset` | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` |
| `folder` | `inspectors/{nodeId}` |
| `public_id` | `logo-{uuid}` |

### Avatar Transformation

When rendering the logo as an avatar (dashboard header, inspector cards), use Cloudinary URL transformations:

- **Square crop:** `w_64,h_64,c_fill,g_face` (face-aware crop, fallback to center)
- **Retina:** `w_128,h_128,c_fill,g_face` for 2x displays
- **Format:** auto (`f_auto`) for optimal format negotiation

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **User is member but not node_admin** | Server action returns `{ success: false, error: "No autorizado" }`. Settings page shows read-only view or redirects to dashboard. |
| **Node is suspended** | Settings page still accessible (inspector can prepare branding for when node is reactivated). Branding changes are saved. |
| **Logo upload fails (network)** | Toast error: "Error al subir el logo. Intentá de nuevo." Preview reverts. No retry logic needed (simple single upload). |
| **Invalid hex color submitted** | Zod validation rejects. Inline error on color input: "Color inválido. Usá formato #RRGGBB." |
| **Very large image (> 5MB)** | Client-side rejection before compression: "La imagen es demasiado grande. Máximo 5MB." |
| **Unsupported file type** | Client-side rejection: "Formato no soportado. Usá JPG, PNG o WebP." |
| **Concurrent edits (two tabs)** | Last write wins. No optimistic locking needed for MVP. |

---

## Server Actions

### `updateNodeBrandingAction`

**Location:** `src/lib/actions/node.ts` (new file)

**Input:**

```typescript
{
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  bio: string | null;
  brandColor: string | null;
  brandAccent: string | null;
}
```

**Zod Schema:**

```typescript
const updateNodeBrandingSchema = z.object({
  contactEmail: z.string().email().max(255),
  contactPhone: z.string().max(50).nullable(),
  address: z.string().max(500).nullable(),
  bio: z.string().max(500).nullable(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  brandAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
});
```

### `updateNodeLogoAction`

**Location:** `src/lib/actions/node.ts`

**Input:**

```typescript
{
  logoUrl: string | null;  // Cloudinary URL or null to remove
}
```

---

## Test Plan

### Unit Tests

| Target | Cases |
|--------|-------|
| `updateNodeBrandingAction` Zod schema | Valid input passes · Invalid email fails · Invalid hex color fails · Bio > 500 chars fails · Null optionals pass |
| `uploadNodeLogo` (Cloudinary) | Sends correct FormData with folder `inspectors/{nodeId}` · Returns secure_url · Throws on non-ok response |

### Integration Tests

| Target | Cases |
|--------|-------|
| `updateNodeBrandingAction` | Updates node record with valid input · Rejects non-authenticated user · Rejects non-node_admin member · Rejects regular member · Returns updated node data |
| `updateNodeLogoAction` | Sets logo_url on node · Clears logo_url when null · Rejects unauthorized user |
| Branding propagation | Updated brand_color appears on public report · Updated logo appears on inspector profile · Dashboard header shows updated avatar |

### Component Tests

| Component | Cases |
|-----------|-------|
| Settings form | Pre-fills current values · Validates email required · Validates hex format · Shows toast on success · Shows error on failure |
| Logo upload | File picker opens on tap · Rejects invalid file type · Rejects > 5MB · Shows preview after compression · Shows toast on upload success · Remove button clears logo |
| Color picker | Renders current color · Updates preview on change · Validates hex format |

---

## Acceptance Criteria

- [ ] Node admin can access settings page from dashboard
- [ ] Settings form pre-fills with current node branding data
- [ ] contact_email, contact_phone, address, bio are editable and saved
- [ ] brand_color and brand_accent editable via color picker with hex validation
- [ ] Logo upload to Cloudinary folder `inspectors/{nodeId}/logo-{uuid}`
- [ ] Logo removal sets logo_url to null
- [ ] Client-side image compression before upload (~500KB target)
- [ ] File type validation (JPG, PNG, WebP only)
- [ ] File size validation (max 5MB before compression)
- [ ] Dashboard header avatar shows logo when set, initials when not
- [ ] Updated branding visible on public report pages
- [ ] Updated branding visible on inspector profile page
- [ ] Updated brand_color used in email CTA buttons
- [ ] Only node_admin can update branding (member role rejected)
- [ ] display_name and slug are NOT editable via self-service
- [ ] Toast feedback on save success and error
