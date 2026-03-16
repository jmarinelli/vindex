import Dexie, { type EntityTable } from "dexie";
import type { DraftFinding, DraftInspection, DraftPhoto } from "@/types/inspection";

// ─── Dexie Database Definition ──────────────────────────────────────────────

class VindexDB extends Dexie {
  drafts!: EntityTable<DraftInspection, "id">;
  findings!: EntityTable<DraftFinding, "id">;
  photos!: EntityTable<DraftPhoto, "id">;

  constructor() {
    super("vindex");

    this.version(1).stores({
      drafts: "id, nodeId, updatedAt",
      findings: "id, eventId, [eventId+sectionId]",
      photos: "id, eventId, findingId",
      syncQueue: "++id, type, createdAt",
    });

    this.version(2).stores({
      drafts: "id, nodeId, updatedAt",
      findings: "id, eventId, [eventId+sectionId]",
      photos: "id, eventId, findingId, photoType",
      syncQueue: "++id, type, createdAt",
    }).upgrade((tx) => {
      return tx.table("photos").toCollection().modify((photo) => {
        if (!photo.photoType) {
          photo.photoType = photo.findingId ? "finding" : "vehicle";
        }
      });
    });

    this.version(3).stores({
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

    this.version(4).stores({
      drafts: "id, nodeId, updatedAt",
      findings: "id, eventId, [eventId+sectionId]",
      photos: "id, eventId, findingId, photoType, serverPhotoId",
      syncQueue: "++id, type, createdAt",
    });

    this.version(5).stores({
      drafts: "id, nodeId, updatedAt",
      findings: "id, eventId, [eventId+sectionId], syncedAt",
      photos: "id, eventId, findingId, photoType, serverPhotoId",
      syncQueue: null, // DROP TABLE
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
      await tx.table("findings").toCollection().modify((f: DraftFinding) => {
        if (f.syncedAt === undefined) f.syncedAt = null;
      });
    });

    this.version(6).stores({
      drafts: "id, nodeId, updatedAt",
      findings: "id, eventId, [eventId+sectionId], syncedAt",
      photos: "id, eventId, findingId, photoType, serverPhotoId",
    }).upgrade((tx) => {
      return tx.table("photos").toCollection().modify((photo: DraftPhoto) => {
        if (photo.deletedAt === undefined) photo.deletedAt = null;
      });
    });
  }
}

export const localDb = new VindexDB();

// ─── Draft Helpers ──────────────────────────────────────────────────────────

export async function saveDraft(draft: DraftInspection): Promise<void> {
  await localDb.drafts.put(draft);
}

export async function getDraft(eventId: string): Promise<DraftInspection | undefined> {
  return localDb.drafts.get(eventId);
}

export async function saveFinding(finding: DraftFinding): Promise<void> {
  await localDb.findings.put(finding);
}

export async function getFindingsByEvent(eventId: string): Promise<DraftFinding[]> {
  return localDb.findings.where("eventId").equals(eventId).toArray();
}

export async function savePhoto(photo: DraftPhoto): Promise<void> {
  await localDb.photos.put(photo);
}

export async function getPhotosByEvent(eventId: string): Promise<DraftPhoto[]> {
  const all = await localDb.photos.where("eventId").equals(eventId).toArray();
  return all.filter((p) => !p.deletedAt);
}

export async function deletePhoto(photoId: string): Promise<void> {
  const photo = await localDb.photos.get(photoId);
  if (!photo) return;
  // If never uploaded to server, hard-delete immediately
  if (!photo.serverPhotoId) {
    await localDb.photos.delete(photoId);
  } else {
    // Soft-delete — sync worker will handle server deletion
    await localDb.photos.update(photoId, { deletedAt: new Date().toISOString() });
  }
}

// ─── Sync Helpers ───────────────────────────────────────────────────────────

export async function clearInspectionData(eventId: string): Promise<void> {
  await localDb.drafts.delete(eventId);
  await localDb.findings.where("eventId").equals(eventId).delete();
  await localDb.photos.where("eventId").equals(eventId).delete();
}

export async function getUnsyncedFindings(): Promise<DraftFinding[]> {
  const all = await localDb.findings.toArray();
  return all.filter((f) => f.syncedAt === null);
}

export async function getUnsyncedPhotos(): Promise<DraftPhoto[]> {
  const all = await localDb.photos.toArray();
  return all.filter((p) => !p.uploaded && !p.deletedAt && p.blob && p.retries < 3);
}

export async function getPendingPhotoDeletions(): Promise<DraftPhoto[]> {
  const all = await localDb.photos.toArray();
  return all.filter((p) => !!p.deletedAt && !!p.serverPhotoId);
}
