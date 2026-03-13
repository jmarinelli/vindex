import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ──────────────────────────────────────────────────────

const mockDequeueSyncItems = vi.fn().mockResolvedValue([]);
const mockRemoveSyncItem = vi.fn().mockResolvedValue(undefined);
const mockUpdateFindingAction = vi.fn();

vi.mock("@/offline/dexie", () => ({
  dequeueSyncItems: (...args: unknown[]) => mockDequeueSyncItems(...args),
  removeSyncItem: (...args: unknown[]) => mockRemoveSyncItem(...args),
}));

vi.mock("@/lib/actions/inspection", () => ({
  updateFindingAction: (...args: unknown[]) => mockUpdateFindingAction(...args),
}));

import { processQueue } from "@/offline/sync";

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processQueue", () => {
  it("does nothing when queue is empty", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([]);
    await processQueue();
    expect(mockUpdateFindingAction).not.toHaveBeenCalled();
    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });

  it("processes finding items and removes on success", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: 1,
        type: "finding",
        payload: { findingId: "f-1", status: "good" },
        createdAt: "2026-01-01",
        retries: 0,
      },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: true });

    await processQueue();

    expect(mockUpdateFindingAction).toHaveBeenCalledWith({
      findingId: "f-1",
      status: "good",
    });
    expect(mockRemoveSyncItem).toHaveBeenCalledWith(1);
  });

  it("does not remove item when action returns failure and retries < 3", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: 2,
        type: "finding",
        payload: { findingId: "f-2", status: "attention" },
        createdAt: "2026-01-01",
        retries: 1,
      },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: false, error: "Server error" });

    await processQueue();

    expect(mockUpdateFindingAction).toHaveBeenCalled();
    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });

  it("discards item after 3 retries even on failure", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: 3,
        type: "finding",
        payload: { findingId: "f-3", status: "critical" },
        createdAt: "2026-01-01",
        retries: 3,
      },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: false });

    await processQueue();

    expect(mockRemoveSyncItem).toHaveBeenCalledWith(3);
  });

  it("skips photo items (handled separately)", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: 4,
        type: "photo",
        payload: { photoId: "p-1" },
        createdAt: "2026-01-01",
        retries: 0,
      },
    ]);

    await processQueue();

    expect(mockUpdateFindingAction).not.toHaveBeenCalled();
    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });

  it("continues processing remaining items after an error", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: 5,
        type: "finding",
        payload: { findingId: "f-5" },
        createdAt: "2026-01-01",
        retries: 0,
      },
      {
        id: 6,
        type: "finding",
        payload: { findingId: "f-6" },
        createdAt: "2026-01-01",
        retries: 0,
      },
    ]);
    mockUpdateFindingAction
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ success: true });

    await processQueue();

    // First item threw, second should still be processed
    expect(mockUpdateFindingAction).toHaveBeenCalledTimes(2);
    expect(mockRemoveSyncItem).toHaveBeenCalledWith(6);
    expect(mockRemoveSyncItem).toHaveBeenCalledTimes(1);
  });

  it("does not remove item when id is undefined", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: undefined,
        type: "finding",
        payload: { findingId: "f-7" },
        createdAt: "2026-01-01",
        retries: 0,
      },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: true });

    await processQueue();

    expect(mockUpdateFindingAction).toHaveBeenCalled();
    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });

  it("does not remove item with undefined id even after 3 retries", async () => {
    mockDequeueSyncItems.mockResolvedValueOnce([
      {
        id: undefined,
        type: "finding",
        payload: { findingId: "f-8" },
        createdAt: "2026-01-01",
        retries: 3,
      },
    ]);
    mockUpdateFindingAction.mockResolvedValueOnce({ success: false });

    await processQueue();

    expect(mockRemoveSyncItem).not.toHaveBeenCalled();
  });
});
