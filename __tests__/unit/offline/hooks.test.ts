import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { DraftInspection, DraftFinding } from "@/types/inspection";

// ─── Mock dexie module ──────────────────────────────────────────────────────

const mockSaveDraft = vi.fn().mockResolvedValue(undefined);
const mockGetDraft = vi.fn().mockResolvedValue(undefined);
const mockSaveFinding = vi.fn().mockResolvedValue(undefined);
const mockEnqueueSyncItem = vi.fn().mockResolvedValue(undefined);

vi.mock("@/offline/dexie", () => ({
  saveDraft: (...args: unknown[]) => mockSaveDraft(...args),
  getDraft: (...args: unknown[]) => mockGetDraft(...args),
  saveFinding: (...args: unknown[]) => mockSaveFinding(...args),
  enqueueSyncItem: (...args: unknown[]) => mockEnqueueSyncItem(...args),
  getPhotosByEvent: vi.fn().mockResolvedValue([]),
  localDb: { photos: { update: vi.fn().mockResolvedValue(undefined) } },
}));

vi.mock("@/offline/photo-upload", () => ({
  processPhotoQueue: vi.fn().mockResolvedValue(undefined),
  uploadAndSavePhoto: vi.fn().mockResolvedValue(true),
}));

import { useOfflineStatus, useDraft, useAutoSave } from "@/offline/hooks";

// ─── Factories ───────────────────────────────────────────────────────────────

function makeDraft(overrides?: Partial<DraftInspection>): DraftInspection {
  return {
    id: "evt-1",
    vehicleId: "v-1",
    nodeId: "n-1",
    vehicleName: "Toyota Corolla 2020",
    inspectionType: "pre_purchase",
    requestedBy: "John",
    odometerKm: 50000,
    eventDate: "2026-01-01",
    slug: "toyota-corolla-2020",
    templateSnapshot: { templateId: "t-1", templateName: "Standard", sections: [] },
    findings: [],
    photos: [],
    lastSectionIndex: 0,
    updatedAt: "2026-01-01T00:00:00.000Z",
    syncedAt: null,
    ...overrides,
  };
}

function makeFinding(overrides?: Partial<DraftFinding>): DraftFinding {
  return {
    id: "f-1",
    eventId: "evt-1",
    sectionId: "s-1",
    itemId: "i-1",
    status: "good",
    observation: null,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── useOfflineStatus ────────────────────────────────────────────────────────

describe("useOfflineStatus", () => {
  it("returns true when navigator is online", () => {
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current).toBe(true);
  });

  it("updates to false on offline event", () => {
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("updates to true on online event", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("removes event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOfflineStatus());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    removeSpy.mockRestore();
  });
});

// ─── useDraft ────────────────────────────────────────────────────────────────

describe("useDraft", () => {
  it("loads draft from dexie on mount", async () => {
    const draft = makeDraft();
    mockGetDraft.mockResolvedValueOnce(draft);

    const { result } = renderHook(() => useDraft("evt-1"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.draft).toEqual(draft);
    expect(mockGetDraft).toHaveBeenCalledWith("evt-1");
  });

  it("sets draft to null when not found", async () => {
    mockGetDraft.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDraft("evt-999"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.draft).toBeNull();
  });

  it("stops loading immediately when eventId is null", async () => {
    const { result } = renderHook(() => useDraft(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.draft).toBeNull();
    expect(mockGetDraft).not.toHaveBeenCalled();
  });

  it("updateDraft merges updates and saves", async () => {
    const draft = makeDraft();
    mockGetDraft.mockResolvedValueOnce(draft);

    const { result } = renderHook(() => useDraft("evt-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateDraft({ odometerKm: 60000 });
    });

    expect(result.current.draft?.odometerKm).toBe(60000);
    expect(mockSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ odometerKm: 60000 })
    );
  });

  it("updateDraft does nothing when draft is null", async () => {
    mockGetDraft.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDraft("evt-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateDraft({ odometerKm: 60000 });
    });

    expect(mockSaveDraft).not.toHaveBeenCalled();
  });
});

// ─── useAutoSave ─────────────────────────────────────────────────────────────

describe("useAutoSave", () => {
  it("returns saved as initial syncStatus", () => {
    const draft = makeDraft();
    const { result } = renderHook(() => useAutoSave(draft, true));
    expect(result.current.syncStatus).toBe("saved");
  });

  it("sets status to offline when not online", async () => {
    const draft = makeDraft();
    const { result, rerender } = renderHook(
      ({ isOnline }) => useAutoSave(draft, isOnline),
      { initialProps: { isOnline: true } }
    );

    rerender({ isOnline: false });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe("offline");
    });
  });

  describe("saveFindingStatus", () => {
    it("saves finding and enqueues sync when online", async () => {
      const draft = makeDraft();
      const finding = makeFinding({ status: "critical" });

      const { result } = renderHook(() => useAutoSave(draft, true));

      await act(async () => {
        await result.current.saveFindingStatus(finding);
      });

      expect(mockSaveFinding).toHaveBeenCalledWith(finding);
      expect(mockEnqueueSyncItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "finding",
          payload: { findingId: "f-1", status: "critical" },
          retries: 0,
        })
      );
      expect(result.current.syncStatus).toBe("synced");
    });

    it("transitions back to saved after 2s timeout", async () => {
      vi.useFakeTimers();
      const draft = makeDraft();
      const finding = makeFinding();

      const { result } = renderHook(() => useAutoSave(draft, true));

      await act(async () => {
        await result.current.saveFindingStatus(finding);
      });

      expect(result.current.syncStatus).toBe("synced");

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.syncStatus).toBe("saved");
      vi.useRealTimers();
    });

    it("sets status to offline when not online", async () => {
      const draft = makeDraft();
      const finding = makeFinding();

      const { result } = renderHook(() => useAutoSave(draft, false));

      await act(async () => {
        await result.current.saveFindingStatus(finding);
      });

      expect(mockSaveFinding).toHaveBeenCalledWith(finding);
      expect(mockEnqueueSyncItem).not.toHaveBeenCalled();
      expect(result.current.syncStatus).toBe("offline");
    });
  });

  describe("saveObservation", () => {
    it("saves finding and enqueues sync with observation payload", async () => {
      const draft = makeDraft();
      const finding = makeFinding({ observation: "Scratch on panel" });

      const { result } = renderHook(() => useAutoSave(draft, true));

      await act(async () => {
        await result.current.saveObservation(finding);
      });

      expect(mockSaveFinding).toHaveBeenCalledWith(finding);
      expect(mockEnqueueSyncItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "finding",
          payload: { findingId: "f-1", observation: "Scratch on panel" },
        })
      );
    });

    it("sets status to offline when not online", async () => {
      const draft = makeDraft();
      const finding = makeFinding({ observation: "Scratch" });

      const { result } = renderHook(() => useAutoSave(draft, false));

      await act(async () => {
        await result.current.saveObservation(finding);
      });

      expect(mockEnqueueSyncItem).not.toHaveBeenCalled();
      expect(result.current.syncStatus).toBe("offline");
    });

    it("transitions back to saved after 2s timeout", async () => {
      vi.useFakeTimers();
      const draft = makeDraft();
      const finding = makeFinding({ observation: "Note" });

      const { result } = renderHook(() => useAutoSave(draft, true));

      await act(async () => {
        await result.current.saveObservation(finding);
      });

      expect(result.current.syncStatus).toBe("synced");

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.syncStatus).toBe("saved");
      vi.useRealTimers();
    });
  });

  it("clears timer on unmount", async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const draft = makeDraft();
    const finding = makeFinding();

    const { result, unmount } = renderHook(() => useAutoSave(draft, true));

    await act(async () => {
      await result.current.saveFindingStatus(finding);
    });

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    vi.useRealTimers();
  });
});
