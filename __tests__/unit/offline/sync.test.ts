import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ──────────────────────────────────────────────────────

const mockGetUnsyncedFindings = vi.fn().mockResolvedValue([]);
const mockGetUnsyncedPhotos = vi.fn().mockResolvedValue([]);
const mockGetPendingPhotoDeletions = vi.fn().mockResolvedValue([]);
const mockUpdateFindingAction = vi.fn();
const mockDeleteEventPhotoAction = vi.fn();
const mockUploadAndSavePhoto = vi.fn();
const mockFindingsUpdate = vi.fn().mockResolvedValue(undefined);
const mockPhotosDelete = vi.fn().mockResolvedValue(undefined);

vi.mock("@/offline/dexie", () => ({
  getUnsyncedFindings: (...args: unknown[]) => mockGetUnsyncedFindings(...args),
  getUnsyncedPhotos: (...args: unknown[]) => mockGetUnsyncedPhotos(...args),
  getPendingPhotoDeletions: (...args: unknown[]) => mockGetPendingPhotoDeletions(...args),
  localDb: {
    findings: { update: (...args: unknown[]) => mockFindingsUpdate(...args) },
    photos: { delete: (...args: unknown[]) => mockPhotosDelete(...args) },
  },
}));

vi.mock("@/lib/actions/inspection", () => ({
  updateFindingAction: (...args: unknown[]) => mockUpdateFindingAction(...args),
  deleteEventPhotoAction: (...args: unknown[]) => mockDeleteEventPhotoAction(...args),
}));

vi.mock("@/offline/photo-upload", () => ({
  uploadAndSavePhoto: (...args: unknown[]) => mockUploadAndSavePhoto(...args),
}));

import { processSyncQueue } from "@/offline/sync";

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processSyncQueue", () => {
  it("does nothing when no unsynced items", async () => {
    const result = await processSyncQueue();
    expect(result).toEqual({ syncedFindings: 0, syncedPhotos: 0, failed: 0 });
    expect(mockUpdateFindingAction).not.toHaveBeenCalled();
    expect(mockUploadAndSavePhoto).not.toHaveBeenCalled();
  });

  it("syncs unsynced findings and marks as synced", async () => {
    mockGetUnsyncedFindings.mockResolvedValueOnce([
      { id: "f-1", eventId: "evt-1", sectionId: "s-1", itemId: "i-1", status: "good", observation: null, syncedAt: null },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: true });

    const result = await processSyncQueue();

    expect(mockUpdateFindingAction).toHaveBeenCalledWith({
      findingId: "f-1",
      status: "good",
      observation: null,
    });
    expect(mockFindingsUpdate).toHaveBeenCalledWith("f-1", { syncedAt: expect.any(String) });
    expect(result.syncedFindings).toBe(1);
  });

  it("counts failed findings", async () => {
    mockGetUnsyncedFindings.mockResolvedValueOnce([
      { id: "f-1", eventId: "evt-1", sectionId: "s-1", itemId: "i-1", status: "good", observation: null, syncedAt: null },
    ]);
    mockUpdateFindingAction.mockRejectedValueOnce(new Error("Network error"));

    const result = await processSyncQueue();

    expect(result.failed).toBe(1);
    expect(result.syncedFindings).toBe(0);
  });

  it("syncs unuploaded photos", async () => {
    mockGetUnsyncedPhotos.mockResolvedValueOnce([
      { id: "p-1", eventId: "evt-1", findingId: "f-1", photoType: "finding", uploaded: false, retries: 0 },
    ]);
    mockUploadAndSavePhoto.mockResolvedValueOnce(true);

    const result = await processSyncQueue();

    expect(mockUploadAndSavePhoto).toHaveBeenCalled();
    expect(result.syncedPhotos).toBe(1);
  });

  it("counts failed photo uploads", async () => {
    mockGetUnsyncedPhotos.mockResolvedValueOnce([
      { id: "p-1", eventId: "evt-1", findingId: "f-1", photoType: "finding", uploaded: false, retries: 0 },
    ]);
    mockUploadAndSavePhoto.mockResolvedValueOnce(false);

    const result = await processSyncQueue();

    expect(result.failed).toBe(1);
    expect(result.syncedPhotos).toBe(0);
  });

  it("processes both findings and photos in one call", async () => {
    mockGetUnsyncedFindings.mockResolvedValueOnce([
      { id: "f-1", eventId: "evt-1", sectionId: "s-1", itemId: "i-1", status: "critical", observation: "Scratch", syncedAt: null },
    ]);
    mockGetUnsyncedPhotos.mockResolvedValueOnce([
      { id: "p-1", eventId: "evt-1", findingId: "f-1", photoType: "finding", uploaded: false, retries: 0 },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: true });
    mockUploadAndSavePhoto.mockResolvedValueOnce(true);

    const result = await processSyncQueue();

    expect(result).toEqual({ syncedFindings: 1, syncedPhotos: 1, failed: 0 });
  });

  it("continues after a finding error to process remaining items", async () => {
    mockGetUnsyncedFindings.mockResolvedValueOnce([
      { id: "f-1", eventId: "evt-1", sectionId: "s-1", itemId: "i-1", status: "good", observation: null, syncedAt: null },
      { id: "f-2", eventId: "evt-1", sectionId: "s-1", itemId: "i-2", status: "attention", observation: null, syncedAt: null },
    ]);
    mockUpdateFindingAction
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ success: true });

    const result = await processSyncQueue();

    expect(mockUpdateFindingAction).toHaveBeenCalledTimes(2);
    expect(result.syncedFindings).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("processes pending photo deletions and removes from Dexie", async () => {
    mockGetPendingPhotoDeletions.mockResolvedValueOnce([
      { id: "p-1", serverPhotoId: "sp-1", deletedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    mockDeleteEventPhotoAction.mockResolvedValueOnce({ success: true });

    const result = await processSyncQueue();

    expect(mockDeleteEventPhotoAction).toHaveBeenCalledWith({ photoId: "sp-1" });
    expect(mockPhotosDelete).toHaveBeenCalledWith("p-1");
    expect(result.failed).toBe(0);
  });

  it("removes locally even on server rejection (already deleted)", async () => {
    mockGetPendingPhotoDeletions.mockResolvedValueOnce([
      { id: "p-1", serverPhotoId: "sp-1", deletedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    mockDeleteEventPhotoAction.mockResolvedValueOnce({ success: false, error: "Not found" });

    await processSyncQueue();

    expect(mockPhotosDelete).toHaveBeenCalledWith("p-1");
  });

  it("counts failed photo deletions on network error", async () => {
    mockGetPendingPhotoDeletions.mockResolvedValueOnce([
      { id: "p-1", serverPhotoId: "sp-1", deletedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    mockDeleteEventPhotoAction.mockRejectedValueOnce(new Error("Network error"));

    const result = await processSyncQueue();

    expect(result.failed).toBe(1);
    expect(mockPhotosDelete).not.toHaveBeenCalled();
  });
});
