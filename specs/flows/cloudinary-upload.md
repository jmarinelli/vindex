# Flow: Cloudinary Photo Upload

*Describes the background upload pipeline: client-side compression, direct unsigned upload to Cloudinary, server persistence, retry logic, and interaction with the signing flow.*
*Derived from: specs/entities/event-photo.md | specs/flows/inspection-creation.md | specs/flows/inspection-signing.md | specs/architecture.md*

---

## Overview

Photos captured during an inspection are stored locally first (IndexedDB via Dexie.js) and uploaded to Cloudinary in the background when the device is online. Once uploaded, the Cloudinary URL is persisted to the `event_photos` table via a server action. Photos that haven't finished uploading **block signing** — the inspector must wait for all uploads to complete before signing.

---

## Upload Pipeline

### Happy Path (Online)

```
Inspector captures photo (camera input)
  → compressImage(file) — canvas API, target ~500KB–1MB, JPEG
  → savePhoto(draftPhoto) — blob saved to Dexie with uploaded: false
  → UI shows thumbnail immediately (blob URL)
  → uploadToCloudinary(blob, eventId, photoType, order)
    → Direct unsigned POST to Cloudinary Upload API
    → Folder: events/{eventId}/{photoType}-{order}
    → On success: returns Cloudinary URL (secure_url)
  → saveEventPhotoAction({ eventId, findingId, photoType, url, caption, order })
    → Zod validation
    → assertEventIsMutable(eventId)
    → INSERT INTO event_photos (id, event_id, finding_id, photo_type, url, caption, order)
  → Update Dexie photo: uploaded = true, url = cloudinaryUrl
  → UI removes upload indicator from thumbnail
```

### Offline Path

```
Inspector captures photo (camera input)
  → compressImage(file) — same compression
  → savePhoto(draftPhoto) — blob saved to Dexie with uploaded: false
  → UI shows thumbnail immediately (blob URL) with cloud-off overlay
  → Device comes online (navigator.onLine event)
  → processPhotoQueue(eventId)
    → Query Dexie: photos where uploaded = false
    → For each pending photo: run upload pipeline (same as happy path)
```

---

## Cloudinary Upload Details

### Configuration

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
| `folder` | `events/{eventId}` |
| `public_id` | `{photoType}-{order}` (e.g., `finding-0`, `vehicle-2`) |

**Response (success):**

```json
{
  "secure_url": "https://res.cloudinary.com/{cloud}/image/upload/v{version}/events/{eventId}/{photoType}-{order}.jpg",
  "public_id": "events/{eventId}/{photoType}-{order}",
  "format": "jpg",
  "width": 1920,
  "height": 1440
}
```

The `secure_url` is what gets stored in `event_photos.url`.

### Folder Structure

```
events/
  {eventId}/
    vehicle-0.jpg
    vehicle-1.jpg
    vehicle-2.jpg
    finding-0.jpg     ← first finding photo (across all findings)
    finding-1.jpg
    ...
```

---

## Server Persistence

### Server Action: `saveEventPhotoAction`

**Location:** `src/lib/actions/inspection.ts`

**Input:**

```typescript
{
  eventId: string;       // UUID
  findingId: string | null;  // UUID or null for vehicle photos
  photoType: "finding" | "vehicle";
  url: string;           // Cloudinary secure_url
  caption: string | null;
  order: number;
}
```

**Zod Schema:**

```typescript
const saveEventPhotoSchema = z.object({
  eventId: z.string().uuid(),
  findingId: z.string().uuid().nullable(),
  photoType: z.enum(["finding", "vehicle"]),
  url: z.string().url().max(500),
  caption: z.string().max(500).nullable(),
  order: z.number().int().min(0),
});
```

**Flow:**

```
Client calls saveEventPhotoAction(input)
  → Zod validation
  → Get authenticated user from session
  → Verify user is active NodeMember for event's node
  → assertEventIsMutable(eventId)
  → INSERT INTO event_photos (id, event_id, finding_id, photo_type, url, caption, order)
  → Return { success: true, data: { eventPhoto } }
```

**Return Shape:**

```typescript
// Success
{ success: true, data: { eventPhoto: EventPhoto } }

// Error
{ success: false, error: string }
```

The `event_photos` row is only created **after** a successful Cloudinary upload. There is no row with `url = null`.

---

## Retry Logic

Failed uploads retry with exponential backoff.

| Attempt | Delay | Notes |
|---------|-------|-------|
| 1 | Immediate | First attempt right after capture |
| 2 | 2s | After first failure |
| 3 | 8s | After second failure |
| 4+ | No auto-retry | Photo stays in local queue with "retry" indicator. Manual retry available via tap. |

### Implementation

```typescript
async function uploadWithRetry(
  photo: DraftPhoto,
  maxRetries = 3
): Promise<string> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const url = await uploadToCloudinary(photo);
      return url;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Upload failed after retries");
}
```

After all retries are exhausted:
- The photo remains in Dexie with `uploaded: false`.
- The thumbnail shows a red border + retry icon.
- Tapping the retry icon re-triggers `uploadWithRetry`.
- The photo queue is also re-processed when the device comes back online.

---

## Photo Deletion

### Draft Photos (Before Signing)

```
Inspector long-presses thumbnail → confirms delete
  → If uploaded (has Cloudinary URL):
    → deleteEventPhotoAction({ photoId })
      → assertEventIsMutable(eventId)
      → DELETE FROM event_photos WHERE id = :photoId
      → Note: Cloudinary file is NOT deleted (orphaned files cleaned up separately if needed)
    → Remove from Dexie
  → If not uploaded (local only):
    → Remove from Dexie only (no server action needed)
  → UI removes thumbnail
```

### Signed Event Photos

All mutations (add, delete, reorder) are rejected by the immutability guard.

---

## Interaction with Signing

**Pending uploads block signing.** This is a critical change from the original spec.

### Rationale

Since signed events are immutable, allowing photos to upload after signing creates a contradiction: the photo was captured as part of the inspection but would need to create an `event_photos` row on a signed (immutable) event. Therefore:

1. Before signing, the client checks for any photos in Dexie with `uploaded: false`.
2. If pending uploads exist, the sign button is **disabled** with a message.
3. If the device is offline and has pending uploads, both the connectivity warning and the pending uploads warning are shown.

### Sign Precondition (Client-Side)

```typescript
// In the Review & Sign page
const pendingPhotos = photos.filter((p) => !p.uploaded);
const canSign = pendingPhotos.length === 0 && isOnline && allItemsEvaluated;
```

### UI States for Pending Uploads

| State | Sign Button | Message |
|-------|-------------|---------|
| All photos uploaded, online, complete | Enabled | (none) |
| Photos uploading | Disabled | "Subiendo {n} foto(s)... Esperá a que termine la subida para firmar." |
| Photos failed (retry exhausted) | Disabled | "Hay {n} foto(s) que no se pudieron subir. Reintentá la subida o eliminá las fotos para continuar." |
| Offline + pending photos | Disabled | "Se requiere conexión para subir fotos y firmar." |
| Offline + all photos uploaded | Disabled | "Se requiere conexión para firmar." (existing behavior) |

---

## New Hook: `usePhotoUpload`

A new hook to manage the upload lifecycle for an inspection's photos.

**Location:** `src/offline/hooks.ts`

```typescript
function usePhotoUpload(eventId: string, isOnline: boolean) {
  // Returns:
  return {
    photos: DraftPhoto[];           // All photos for this event
    pendingCount: number;            // Photos with uploaded = false
    failedCount: number;             // Photos that exhausted retries
    isUploading: boolean;            // Any upload in progress
    uploadPhoto: (photo: DraftPhoto) => Promise<void>;  // Trigger single upload
    retryFailed: () => Promise<void>;  // Retry all failed uploads
    retryPhoto: (photoId: string) => Promise<void>;  // Retry specific photo
  };
}
```

**Behavior:**
- On mount: loads photos from Dexie for the event.
- When `isOnline` transitions to `true`: processes pending upload queue.
- Tracks upload state per photo (idle, uploading, uploaded, failed).
- Exposes `pendingCount` and `failedCount` for the signing precondition.

---

## Cloudinary Upload Service

**Location:** `src/lib/services/cloudinary.ts`

Client-side module (runs in browser). Handles the HTTP POST to Cloudinary.

```typescript
export async function uploadToCloudinary(params: {
  blob: Blob;
  eventId: string;
  photoType: "finding" | "vehicle";
  order: number;
}): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append("file", params.blob);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `events/${params.eventId}`);
  formData.append("public_id", `${params.photoType}-${params.order}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url;
}
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Photo captured offline, device comes online** | Photo queue auto-processes. Upload + server persist happen in background. |
| **Upload succeeds, server persist fails** | Photo marked as failed in Dexie. Retry will re-attempt the server persist (skip Cloudinary re-upload if URL already obtained). |
| **Duplicate public_id on Cloudinary** | Cloudinary overwrites by default with unsigned presets. This is acceptable — same photo slot gets the latest version. |
| **Photo deleted while uploading** | Upload completes but Dexie record is gone. Server persist skipped (photo was deleted). Cloudinary file becomes orphan (acceptable). |
| **Event signed between capture and upload** | Cannot happen — signing is blocked while uploads are pending. |
| **Large photo (> 10MB after compression)** | Cloudinary free tier accepts up to 10MB. If compression doesn't achieve this, the upload fails and follows retry logic. |
| **Multiple photos captured rapidly** | Uploads are sequential per event to avoid race conditions on order. Compression runs in parallel (CPU-bound). |
| **Browser tab closed during upload** | Upload is lost. On next app open, photo is in Dexie with `uploaded: false` — queue re-processes. |
| **Cloudinary quota exceeded** | Upload fails with 4xx. Retry won't help. Photo stays local with failed indicator. Inspector can still sign if they delete the failed photos. |

---

## Test Plan

Per `specs/architecture.md §5` — coverage target >= 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| `uploadToCloudinary` | `services/cloudinary.ts` | Sends correct FormData fields · Returns secure_url on success · Throws on non-ok response · Uses correct env vars |
| `uploadWithRetry` | `offline/photo-upload.ts` | Succeeds on first attempt · Retries on failure with increasing delay · Throws after max retries · Backoff delays are correct |
| `saveEventPhoto` Zod schema | `validators.ts` | Valid input passes · Missing eventId fails · Invalid URL fails · Invalid photoType fails · Negative order fails |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `saveEventPhotoAction` | `actions/inspection.ts` | Creates event_photo row with valid input · Rejects on signed event (immutability) · Rejects unauthorized user · Returns correct shape |
| Photo upload pipeline | `offline/photo-upload.ts` | Capture → compress → upload → persist flow works end-to-end (Cloudinary mocked via MSW) · Offline → online triggers queue processing · Failed upload retries correctly |

### Component Tests

| Component | Cases |
|-----------|-------|
| **Upload indicator** | Shows progress during upload · Shows cloud-off when offline · Shows retry icon on failure · Clean state after success |
| **Retry button** | Tapping retry re-triggers upload · Retry succeeds and clears indicator |
| **Sign button (pending uploads)** | Disabled when pendingCount > 0 · Shows correct message · Enabled when all uploaded |

---

## Acceptance Criteria

- [ ] Photos upload to Cloudinary directly from the client (unsigned preset)
- [ ] Cloudinary folder structure: `events/{eventId}/{photoType}-{order}`
- [ ] `event_photos` row created only after successful Cloudinary upload
- [ ] Upload retries with exponential backoff (3 attempts)
- [ ] Failed uploads show retry indicator on thumbnail
- [ ] Manual retry available via tap on failed photo
- [ ] Offline photos queue and upload when connectivity returns
- [ ] Pending uploads block signing with descriptive message
- [ ] Failed uploads block signing with message to retry or delete
- [ ] Deleting a draft photo removes it from Dexie and server (if persisted)
- [ ] Signed events reject photo additions (immutability guard)
- [ ] `usePhotoUpload` hook tracks pending/failed/uploading state
- [ ] Upload indicator states: uploading, uploaded, failed, offline
