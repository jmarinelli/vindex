import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { DraftInspection } from "@/types/inspection";

// ─── Mock dexie module ──────────────────────────────────────────────────────

const mockSaveDraft = vi.fn().mockResolvedValue(undefined);
const mockGetDraft = vi.fn().mockResolvedValue(undefined);

vi.mock("@/offline/dexie", () => ({
  saveDraft: (...args: unknown[]) => mockSaveDraft(...args),
  getDraft: (...args: unknown[]) => mockGetDraft(...args),
  saveFinding: vi.fn().mockResolvedValue(undefined),
  getPhotosByEvent: vi.fn().mockResolvedValue([]),
  localDb: { photos: { update: vi.fn().mockResolvedValue(undefined) } },
}));

vi.mock("@/offline/photo-upload", () => ({
  uploadAndSavePhoto: vi.fn().mockResolvedValue(true),
}));

import { useOfflineStatus, useDraft } from "@/offline/hooks";

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
    findingsSeeded: true,
    lastSectionIndex: 0,
    updatedAt: "2026-01-01T00:00:00.000Z",
    syncedAt: null,
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
