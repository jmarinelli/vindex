# Plan: Cloudinary Photo Upload Integration

**GitHub Issue:** #1 — Cloudinary Integration
**Status:** Approved for implementation

## Summary

Upload inspection photos from IndexedDB to Cloudinary in the background when online, persist the Cloudinary URL in `event_photos` via a server action, and block signing until all uploads complete.

## Related Specs

Read these before implementing:

- **Flow spec:** `specs/flows/cloudinary-upload.md` — full pipeline, retry logic, signing interaction
- **Entity spec:** `specs/entities/event-photo.md` — schema, behavior, upload flows
- **Signing flow:** `specs/flows/inspection-signing.md` — updated edge case: pending uploads block signing
- **UI spec (sign page):** `specs/ui/review-sign.md` — pending upload banners (states 7 & 8)
- **Architecture:** `specs/architecture.md` — conventions for services, actions, validators, testing

## Key Design Decisions

1. **Unsigned direct client-to-Cloudinary upload** — no server proxy needed
2. **Cloudinary folder structure:** `events/{eventId}/{photoType}-{order}`
3. **Insert-on-success:** `event_photos` row created only after Cloudinary URL is available (no rows with `url = null`)
4. **Pending uploads block signing** — enforced client-side since the server never sees un-uploaded photos
5. **Retry:** exponential backoff (3 attempts), then manual retry via UI or delete the photo

## Environment Variables

Already defined in `.env.example`, need real values in `.env.local`:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Server-side keys (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are not needed for unsigned uploads.

---

## Files to Create

### 1. `src/lib/services/cloudinary.ts`

Client-side Cloudinary upload function. Marked `"use client"`.

```typescript
export async function uploadToCloudinary(params: {
  blob: Blob;
  eventId: string;
  photoType: "finding" | "vehicle";
  order: number;
}): Promise<string>  // returns secure_url
```

- POST FormData to `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`
- Fields: `file` (blob), `upload_preset`, `folder` (`events/{eventId}`), `public_id` (`{photoType}-{order}`)
- Returns `data.secure_url` on success
- Throws on non-ok response

### 2. `src/offline/photo-upload.ts`

Upload orchestration. Marked `"use client"`.

```typescript
export async function uploadWithRetry(
  photo: DraftPhoto,
  maxRetries?: number  // default 3
): Promise<string>  // returns Cloudinary URL

export async function processPhotoQueue(eventId: string): Promise<void>
```

**`uploadWithRetry`:**
- Calls `uploadToCloudinary` with the photo's blob, eventId, photoType, order
- On failure: retries with exponential backoff (2s, 4s, 8s delays)
- After max retries: updates photo in Dexie with incremented `retries` count, throws error
- On success: returns the URL

**`processPhotoQueue`:**
- Queries Dexie for photos where `uploaded === false` and `eventId` matches
- For each: calls `uploadWithRetry` → on success calls `saveEventPhotoAction` → updates Dexie (set `uploaded = true`, `url = cloudinaryUrl`)
- Processes sequentially to avoid race conditions on order
- Catches per-photo errors (doesn't abort the queue on one failure)

### 3. `__tests__/unit/services/cloudinary.test.ts`

Unit tests for `uploadToCloudinary`:
- Sends correct FormData fields (file, upload_preset, folder, public_id)
- Returns secure_url on 200
- Throws on non-ok response (400, 500)
- Uses correct env var values

Mock `fetch` directly (or MSW).

### 4. `__tests__/unit/offline/photo-upload.test.ts`

Unit tests for upload orchestration:
- `uploadWithRetry`: succeeds first try, retries on failure with correct delays (use `vi.useFakeTimers`), throws after max retries
- `processPhotoQueue`: processes pending photos, skips already-uploaded, handles per-photo failures gracefully, calls `saveEventPhotoAction` on success

Mock `uploadToCloudinary` and `saveEventPhotoAction`.

---

## Files to Modify

### 5. `src/types/inspection.ts`

Add `retries` field to `DraftPhoto`:

```typescript
export interface DraftPhoto {
  // ... existing fields ...
  retries: number;  // NEW — tracks failed upload attempts, default 0
}
```

### 6. `src/offline/dexie.ts`

Add Dexie version 3 migration to add `retries` field:

```typescript
this.version(3).stores({
  // same indexes as v2
  drafts: "id, nodeId, updatedAt",
  findings: "id, eventId, [eventId+sectionId]",
  photos: "id, eventId, findingId, photoType",
  syncQueue: "++id, type, createdAt",
}).upgrade((tx) => {
  return tx.table("photos").toCollection().modify((photo) => {
    if (photo.retries === undefined) {
      photo.retries = 0;
    }
  });
});
```

### 7. `src/lib/validators.ts`

Update `uploadPhotoSchema` to add `order`:

```typescript
export const uploadPhotoSchema = z.object({
  eventId: z.string().uuid("ID de evento inválido."),
  findingId: z.string().uuid("ID de hallazgo inválido.").optional().nullable(),
  photoType: z.enum(photoTypeValues, {
    error: "Tipo de foto inválido.",
  }),
  url: z.string().url("URL de foto inválida.").max(500),
  caption: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0, "Orden inválido."),
});
```

Also add a `deleteEventPhotoSchema`:

```typescript
export const deleteEventPhotoSchema = z.object({
  photoId: z.string().uuid("ID de foto inválido."),
});
```

Export the new types.

### 8. `src/lib/services/inspection.ts`

Add two service functions:

**`saveEventPhoto`:**
```typescript
export async function saveEventPhoto(params: {
  eventId: string;
  findingId: string | null;
  photoType: "finding" | "vehicle";
  url: string;
  caption: string | null;
  order: number;
  nodeId: string;
}): Promise<EventPhoto>
```
- `assertEventIsMutable(eventId)`
- Verify event belongs to the caller's node
- INSERT into `event_photos` with all fields
- Return the created row

**`deleteEventPhoto`:**
```typescript
export async function deleteEventPhoto(params: {
  photoId: string;
  nodeId: string;
}): Promise<void>
```
- Fetch the photo, get its `eventId`
- `assertEventIsMutable(eventId)`
- Verify event belongs to the caller's node
- DELETE from `event_photos` where id = photoId
- Note: does NOT delete from Cloudinary (orphans are acceptable for MVP)

### 9. `src/lib/actions/inspection.ts`

Add two server actions:

**`saveEventPhotoAction(input: unknown)`:**
- Auth check (session + nodeId)
- Zod parse with `uploadPhotoSchema`
- Call `inspectionService.saveEventPhoto({ ...parsed.data, nodeId })`
- Return `{ success: true, data: { eventPhoto } }` or error

**`deleteEventPhotoAction(input: unknown)`:**
- Auth check
- Zod parse with `deleteEventPhotoSchema`
- Call `inspectionService.deleteEventPhoto({ ...parsed.data, nodeId })`
- Return `{ success: true }` or error

### 10. `src/offline/hooks.ts`

Add `usePhotoUpload` hook:

```typescript
export function usePhotoUpload(eventId: string, isOnline: boolean) {
  return {
    photos: DraftPhoto[];
    pendingCount: number;       // uploaded === false
    failedCount: number;        // retries >= 3
    isUploading: boolean;       // any upload currently in progress
    uploadPhoto: (photo: DraftPhoto) => Promise<void>;
    retryFailed: () => Promise<void>;
    retryPhoto: (photoId: string) => Promise<void>;
  };
}
```

**Behavior:**
- On mount: loads photos from Dexie for the event
- When `isOnline` transitions `false → true`: calls `processPhotoQueue(eventId)`
- `uploadPhoto`: called after `capturePhoto` — triggers immediate upload if online
- `retryFailed`: re-processes all photos with `retries >= 3` (resets retries to 0, re-runs upload)
- `retryPhoto`: same but for a single photo
- Updates local state after each upload completes/fails
- `pendingCount` = photos where `uploaded === false`
- `failedCount` = photos where `uploaded === false && retries >= 3`

### 11. `src/offline/photo-queue.ts`

Update `capturePhoto` to set `retries: 0` on the new photo. No other changes needed — the upload trigger happens in `usePhotoUpload.uploadPhoto`, which the page calls after capture.

### 12. `src/components/inspection/photo-capture.tsx`

Update thumbnail overlay to show upload status:

- **Uploading** (photo.uploaded === false && retries < 3 && isUploading): small spinner overlay
- **Failed** (photo.uploaded === false && retries >= 3): red border + `RotateCcw` retry icon; tap calls `onRetry(photoId)`
- **Offline** (photo.uploaded === false && !isOnline): `CloudOff` icon overlay
- **Uploaded** (photo.uploaded === true): clean thumbnail (no indicator)

Add new props:
```typescript
interface PhotoCaptureProps {
  photos: DraftPhoto[];
  onCapture: (file: File) => void;
  onDelete?: (photoId: string) => void;
  onRetry?: (photoId: string) => void;  // NEW
  isOnline?: boolean;                    // NEW
  uploadingPhotoIds?: Set<string>;       // NEW
}
```

### 13. `src/app/dashboard/inspect/[id]/page.tsx`

Wire `usePhotoUpload`:
- Import and call `usePhotoUpload(eventId, isOnline)`
- After `capturePhoto`, call `uploadPhoto(photo)` if online
- Pass `isOnline`, `uploadingPhotoIds`, and `onRetry` to `PhotoCapture` components
- Use `photos` from the hook instead of local state for photos

### 14. `src/app/dashboard/inspect/[id]/sign/page.tsx`

Add pending uploads check and banners:

- Import `usePhotoUpload` and call it with the eventId
- Compute `canSign = isComplete && isOnline && pendingCount === 0`
- Add warning banners (between offline warning and vehicle photos preview):

```tsx
{/* Pending uploads warning */}
{pendingCount > 0 && isOnline && (
  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
    {failedCount > 0 ? (
      <>
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-red-700">
            Hay {failedCount} foto(s) que no se pudieron subir. Reintentá la subida o eliminá las fotos para continuar.
          </span>
          <button onClick={retryFailed} className="block text-sm text-blue-600 underline mt-1">
            Reintentar subida
          </button>
        </div>
      </>
    ) : (
      <>
        <Loader2 className="h-4 w-4 text-amber-600 animate-spin shrink-0" />
        <span className="text-sm text-amber-700">
          Subiendo {pendingCount} foto(s)... Esperá a que termine la subida para firmar.
        </span>
      </>
    )}
  </div>
)}

{/* Offline + pending photos */}
{!isOnline && pendingCount > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center gap-2" role="alert">
    <CloudOff className="h-4 w-4 text-blue-600 shrink-0" />
    <span className="text-sm text-blue-700">
      Se requiere conexión para subir fotos y firmar.
    </span>
  </div>
)}
```

- Update sign button disabled condition: `disabled={!canSign || signing}`

---

## Implementation Order

1. Types & schema (`types/inspection.ts`, `dexie.ts` migration, `validators.ts`)
2. Cloudinary service (`services/cloudinary.ts`)
3. Server persistence (`services/inspection.ts` + `actions/inspection.ts`)
4. Upload orchestration (`offline/photo-upload.ts`)
5. Hook (`offline/hooks.ts` — `usePhotoUpload`)
6. Update `photo-queue.ts` (add `retries: 0`)
7. Wire field mode page (`inspect/[id]/page.tsx`)
8. Update photo-capture component (`photo-capture.tsx`)
9. Wire sign page (`inspect/[id]/sign/page.tsx`)
10. Tests (all test files)

## Test Plan

| Area | File | Key Cases |
|------|------|-----------|
| Cloudinary upload | `__tests__/unit/services/cloudinary.test.ts` | Correct FormData, returns URL, throws on error |
| Upload retry | `__tests__/unit/offline/photo-upload.test.ts` | First-try success, retries with backoff, max retries exceeded, queue processing |
| `saveEventPhotoAction` | `__tests__/integration/actions/inspection.test.ts` | Creates row, rejects signed event, rejects unauthorized |
| `deleteEventPhotoAction` | `__tests__/integration/actions/inspection.test.ts` | Deletes row, rejects signed event |
| `usePhotoUpload` hook | `__tests__/unit/offline/hooks.test.ts` | Tracks counts, processes on online, retry works |
| Sign page banners | existing component test file | Disabled when pending > 0, correct banner text, enabled when all uploaded |
| Photo indicators | `src/components/inspection/photo-capture.test.tsx` | Spinner during upload, retry icon on fail, cloud-off offline |

**Coverage target:** >= 80% for all new files, >= 70% for modified files.

---

## Checklist

- [ ] `DraftPhoto` type updated with `retries` field
- [ ] Dexie v3 migration adds `retries`
- [ ] `uploadPhotoSchema` includes `order`, new `deleteEventPhotoSchema`
- [ ] `uploadToCloudinary` function works with unsigned preset
- [ ] `saveEventPhoto` service with immutability guard
- [ ] `deleteEventPhoto` service with immutability guard
- [ ] `saveEventPhotoAction` and `deleteEventPhotoAction` server actions
- [ ] `uploadWithRetry` with exponential backoff
- [ ] `processPhotoQueue` processes pending photos sequentially
- [ ] `usePhotoUpload` hook tracks state and auto-processes on online
- [ ] `capturePhoto` sets `retries: 0`
- [ ] Field mode page wired to `usePhotoUpload`
- [ ] Photo thumbnails show upload/failed/offline indicators
- [ ] Sign page blocks on pending uploads with correct banners
- [ ] Sign page retry button works
- [ ] All tests pass with >= 80% coverage on new files
