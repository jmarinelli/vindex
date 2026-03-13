import Dexie, { type EntityTable } from "dexie";
import type { DraftFinding, DraftInspection, DraftPhoto } from "@/types/inspection";

// ─── Dexie Database Definition ──────────────────────────────────────────────

export interface SyncQueueItem {
  id?: number;
  type: "finding" | "photo";
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

class VindexDB extends Dexie {
  drafts!: EntityTable<DraftInspection, "id">;
  findings!: EntityTable<DraftFinding, "id">;
  photos!: EntityTable<DraftPhoto, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("vindex");

    this.version(1).stores({
      drafts: "id, nodeId, updatedAt",
      findings: "id, eventId, [eventId+sectionId]",
      photos: "id, eventId, findingId",
      syncQueue: "++id, type, createdAt",
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
  return localDb.photos.where("eventId").equals(eventId).toArray();
}

export async function enqueueSyncItem(item: Omit<SyncQueueItem, "id">): Promise<void> {
  await localDb.syncQueue.add(item);
}

export async function dequeueSyncItems(): Promise<SyncQueueItem[]> {
  return localDb.syncQueue.toArray();
}

export async function removeSyncItem(id: number): Promise<void> {
  await localDb.syncQueue.delete(id);
}
