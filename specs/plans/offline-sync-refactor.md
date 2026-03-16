# Offline Sync Refactor

**Issues:** #15 (photo duplication), #16 (findings not persisting offline)
**Scope:** Refactor offline sync to be reliable, queue-based, and global

## Context

The offline inspection form has several interconnected bugs rooted in architectural issues:

1. **Dual storage divergence**: `saveFinding()` writes to `localDb.findings`, but `load()` reads from `draft.findings` (embedded array in `drafts` table). These two are never reconciled.
2. **useDraft race condition**: `useDraft` is async (`draft` starts `null`). The `load()` effect runs immediately, sees `draft` as null, takes the server path — overwriting local unsynced data and re-seeding photos (duplication).
3. **syncQueue is dead code**: `processQueue()` in `sync.ts` is never called. Finding sync relies on fire-and-forget `updateFindingAction` calls.
4. **Fake SyncIndicator**: Shows "synced" optimistically after enqueueing, not after server confirmation.
5. **No Dexie cleanup after sign**: Stale data can resurface on re-entry.

## Design Decisions

- **Single source of truth**: `localDb.findings` table is authoritative. Remove embedded `findings` array from `DraftInspection`.
- **Implicit queue**: Instead of a separate `syncQueue` table, use `syncedAt` on findings and `uploaded` on photos as sync markers. Unsynced = `syncedAt === null`.
- **Global sync worker**: `<SyncProvider>` at dashboard layout level. Processes queue on mount, on reconnect, and when items are added.
- **SyncIndicator is real**: Derived from pending count + connectivity. `saved` = persisted in Dexie; `syncing` = processing queue; `synced` = queue empty + online; `offline` = no connectivity.
- **Last-write-wins**: No conflict resolution. Single device per inspection is the typical case.

---

## Phase 1 — Fix useDraft Race Condition

**Goal**: `load()` must wait for the Dexie lookup to finish before deciding local vs server path.

### `src/offline/hooks.ts` — useDraft

- Already returns `loading: boolean`. No changes needed here.

### `src/app/dashboard/inspect/[id]/page.tsx` — load effect

- Destructure `loading: draftLoading` from `useDraft(eventId)`.
- Add `draftLoading` to the effect dependency array.
- Guard: `if (draftLoading) return;` at the top of `load()`.

```typescript
const { draft, loading: draftLoading, setDraft } = useDraft(eventId);

useEffect(() => {
  if (draftLoading) return;  // Wait for Dexie lookup

  async function load() {
    if (draft) { /* local path */ }
    else { /* server path */ }
  }
  load();
}, [eventId, draftLoading]); // eslint-disable-line react-hooks/exhaustive-deps
```

This fixes #15 (photo duplication) and the data-loss-on-reload bug.

---

## Phase 2 — Eliminate Dual Finding Storage + Schema Migration

**Goal**: `findings` table is the single source of truth. Remove `findings`/`photos` arrays from `DraftInspection`.

### `src/types/inspection.ts`

- Remove `findings: DraftFinding[]` from `DraftInspection`.
- Remove `photos: DraftPhoto[]` from `DraftInspection`.
- Add `findingsSeeded: boolean` to `DraftInspection` (indicates server findings have been written to `findings` table).
- Add `syncedAt: string | null` to `DraftFinding`.

### `src/offline/dexie.ts`

Add version 5 (replaces current version 4 that we added for #15):

```typescript
this.version(5).stores({
  drafts: "id, nodeId, updatedAt",
  findings: "id, eventId, [eventId+sectionId], syncedAt",
  photos: "id, eventId, findingId, photoType, serverPhotoId",
  syncQueue: null,  // DROP TABLE
}).upgrade(async (tx) => {
  // Migrate embedded findings from drafts to findings table
  const drafts = await tx.table("drafts").toArray();
  for (const draft of drafts) {
    if (draft.findings && Array.isArray(draft.findings)) {
      for (const f of draft.findings) {
        const existing = await tx.table("findings").get(f.id);
        if (!existing) {
          await tx.table("findings").put({ ...f, syncedAt: null });
        }
      }
      delete draft.findings;
      delete draft.photos;
      draft.findingsSeeded = true;
      await tx.table("drafts").put(draft);
    }
  }
  // Add syncedAt to existing findings
  await tx.table("findings").toCollection().modify((f) => {
    if (f.syncedAt === undefined) f.syncedAt = null;
  });
});
```

Add new helpers:
- `clearInspectionData(eventId: string)` — deletes from `drafts`, `findings`, `photos` where eventId matches.
- `getUnsyncedFindings()` — returns findings where `syncedAt === null`.
- `getUnsyncedPhotos()` — returns photos where `uploaded === false && retries < 3`.

Remove: `enqueueSyncItem`, `dequeueSyncItems`, `removeSyncItem`, `SyncQueueItem` type.

### `src/app/dashboard/inspect/[id]/page.tsx`

- **Local path**: load findings from `localDb.findings.where("eventId").equals(eventId)` instead of `draft.findings`. Remove merge logic.
- **Server path**: write findings to `localDb.findings` individually (with `syncedAt: null`). Don't embed in draft.
- **handleFinishReview**: remove `{ ...draft, findings, ... }` save. Just navigate — findings already persisted individually.
- **handleStatusChange / handleObservationChange**: call `saveFinding(updated)` (now sets `syncedAt: null`). Remove direct `updateFindingAction` calls — the sync worker handles this.

### `src/app/dashboard/inspect/[id]/sign/page.tsx`

- Update the `photos` useMemo that reads `draft.photos` → read from `dexiePhotos` directly (draft no longer has photos).

---

## Phase 3 — Unified Sync Worker

**Goal**: Replace dead `syncQueue` + fire-and-forget calls with a queue-based sync system.

### `src/offline/sync.ts` — Full Rewrite

```typescript
export async function processSyncQueue(): Promise<SyncResult> {
  const result = { syncedFindings: 0, syncedPhotos: 0, failed: 0 };

  // 1. Sync unsynced findings
  const unsyncedFindings = await getUnsyncedFindings();
  for (const f of unsyncedFindings) {
    try {
      const res = await updateFindingAction({
        findingId: f.id,
        status: f.status,
        observation: f.observation,
      });
      if (res.success) {
        await localDb.findings.update(f.id, { syncedAt: new Date().toISOString() });
        result.syncedFindings++;
      }
    } catch {
      result.failed++;
    }
  }

  // 2. Sync unuploaded photos (across all events)
  const unsyncedPhotos = await getUnsyncedPhotos();
  for (const photo of unsyncedPhotos) {
    const success = await uploadAndSavePhoto(photo);
    if (success) result.syncedPhotos++;
    else result.failed++;
  }

  return result;
}
```

### `src/offline/sync-provider.tsx` — New File

`"use client"` component providing sync context:

```typescript
type SyncContextValue = {
  syncStatus: "saved" | "syncing" | "synced" | "offline";
  pendingCount: number;
  triggerSync: () => void;
};
```

Behavior:
- On mount: if online and pending items exist, trigger sync.
- Listen to `online`/`offline` events. On `online`, trigger sync.
- After each sync, re-check pending count.
- `triggerSync()` exposed for manual trigger (e.g., after a finding change).
- Pending count: query `localDb.findings.where("syncedAt").equals(null).count()` + `localDb.photos.where("uploaded").equals(0).count()`.
- Re-check pending count on an interval (every 5s) or after `triggerSync()`.

### `src/offline/hooks.ts`

- **Remove `useAutoSave`** entirely. Its responsibilities:
  - Local save → page calls `saveFinding()` directly.
  - Sync → handled by `SyncProvider`.
  - Status → from `useSyncStatus()`.
- **Simplify `usePhotoUpload`**: remove offline→online reconnect handler (lines 194-199) and mount-time pending processing (lines 181-191). The global sync worker handles both. Keep `uploadPhoto` for immediate uploads when online + call `triggerSync()` from context.

---

## Phase 4 — Dashboard Layout + SyncProvider Mount

### `src/app/dashboard/layout.tsx` — New File

```tsx
import { SyncProvider } from "@/offline/sync-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SyncProvider>{children}</SyncProvider>;
}
```

### `src/app/dashboard/inspect/[id]/page.tsx`

- Import `useSyncStatus` from sync-provider.
- Replace `syncStatus` from `useAutoSave` with `useSyncStatus()`.
- After `saveFinding()` in handlers, call `triggerSync()` to nudge the worker.

### `src/components/inspection/sync-indicator.tsx`

- Optionally consume `useSyncStatus()` directly instead of accepting a prop. Keep prop for testing.

---

## Phase 5 — Clear Dexie After Sign

### `src/app/dashboard/inspect/[id]/sign/page.tsx`

In `handleSign`, after `signInspectionAction` succeeds:

```typescript
if (result.success) {
  await clearInspectionData(eventId);
  router.replace(`/dashboard/inspect/${eventId}/signed`);
}
```

---

## Implementation Order

| Step | Phase | Risk | Depends On |
|------|-------|------|------------|
| 1 | Phase 1: Fix race condition | Low | None |
| 2 | Phase 2: Eliminate dual storage + migration | Medium | Phase 1 |
| 3 | Phase 3: Unified sync worker | Medium | Phase 2 |
| 4 | Phase 4: Dashboard layout + SyncProvider | Low | Phase 3 |
| 5 | Phase 5: Clear on sign | Low | Phase 2 |

Phases 1 and 5 are independent low-risk changes. Phases 2–4 form a connected chain.

## Files Modified

| File | Phases | Change |
|------|--------|--------|
| `src/offline/dexie.ts` | 2 | Schema v5, new helpers, drop syncQueue |
| `src/offline/hooks.ts` | 1, 3 | Fix useDraft usage, remove useAutoSave, simplify usePhotoUpload |
| `src/offline/sync.ts` | 3 | Full rewrite: processSyncQueue |
| `src/offline/sync-provider.tsx` | 4 | **New**: SyncProvider + useSyncStatus |
| `src/types/inspection.ts` | 2 | Remove findings/photos from DraftInspection, add syncedAt to DraftFinding |
| `src/app/dashboard/layout.tsx` | 4 | **New**: mount SyncProvider |
| `src/app/dashboard/inspect/[id]/page.tsx` | 1, 2, 3, 4 | Fix race, single source of truth, consume SyncContext |
| `src/app/dashboard/inspect/[id]/sign/page.tsx` | 2, 5 | Update photo source, clear Dexie on sign |
| `src/components/inspection/sync-indicator.tsx` | 4 | Optionally consume context directly |

## Verification

1. **Race condition (Phase 1)**: Open inspection → close browser → reopen → findings and photos should load from Dexie, not re-fetch from server.
2. **Offline findings (Phase 2-3)**: Go offline → change finding statuses and observations → close browser → reopen → changes should persist. Go online → changes should sync to server.
3. **Sync indicator (Phase 4)**: Go offline → make changes → indicator shows "offline". Go online → indicator shows "syncing" → "synced".
4. **Photo sync (Phase 3)**: Capture photos offline → close browser → reopen online → photos upload automatically.
5. **Sign cleanup (Phase 5)**: Sign inspection → reopen inspection URL → should fetch fresh from server (no stale Dexie data).
6. **Migration (Phase 2)**: Existing users with data in old schema should see their data migrate cleanly.
