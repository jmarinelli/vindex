"use client";

import { localDb, getUnsyncedFindings, getUnsyncedPhotos, getPendingPhotoDeletions } from "./dexie";
import { uploadAndSavePhoto } from "./photo-upload";
import { updateFindingAction, deleteEventPhotoAction } from "@/lib/actions/inspection";

export interface SyncResult {
  syncedFindings: number;
  syncedPhotos: number;
  failed: number;
}

/**
 * Process all dirty findings and unuploaded photos across all inspections.
 */
export async function processSyncQueue(): Promise<SyncResult> {
  const result: SyncResult = { syncedFindings: 0, syncedPhotos: 0, failed: 0 };

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
      } else {
        result.failed++;
        // Non-retriable server rejection — mark synced to prevent infinite retry
        await localDb.findings.update(f.id, { syncedAt: new Date().toISOString() });
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

  // 3. Process pending photo deletions
  const pendingDeletions = await getPendingPhotoDeletions();
  for (const photo of pendingDeletions) {
    try {
      const res = await deleteEventPhotoAction({ photoId: photo.serverPhotoId! });
      if (res.success) {
        await localDb.photos.delete(photo.id);
      } else {
        // Non-retriable server rejection (e.g. already deleted) — remove locally
        await localDb.photos.delete(photo.id);
      }
    } catch {
      result.failed++;
    }
  }

  return result;
}
