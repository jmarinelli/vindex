import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DraftInspection, DraftFinding, DraftPhoto } from "@/types/inspection";
import type { SyncQueueItem } from "@/offline/dexie";

// ─── Hoisted mocks (available inside vi.mock factory) ────────────────────────

const {
  mockPut,
  mockGet,
  mockAdd,
  mockDelete,
  mockToArray,
  mockEquals,
  mockWhere,
} = vi.hoisted(() => {
  const mockToArray = vi.fn().mockResolvedValue([]);
  const mockEquals = vi.fn().mockReturnValue({ toArray: mockToArray });
  const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
  return {
    mockPut: vi.fn().mockResolvedValue(undefined),
    mockGet: vi.fn(),
    mockAdd: vi.fn().mockResolvedValue(undefined),
    mockDelete: vi.fn().mockResolvedValue(undefined),
    mockToArray,
    mockEquals,
    mockWhere,
  };
});

vi.mock("dexie", () => {
  return {
    default: class FakeDexie {
      drafts = { put: mockPut, get: mockGet };
      findings = { put: mockPut, where: mockWhere };
      photos = { put: mockPut, where: mockWhere };
      syncQueue = { add: mockAdd, toArray: mockToArray, delete: mockDelete };

      constructor() {}
      version() {
        return { stores: () => {} };
      }
    },
  };
});

import {
  saveDraft,
  getDraft,
  saveFinding,
  getFindingsByEvent,
  savePhoto,
  getPhotosByEvent,
  enqueueSyncItem,
  dequeueSyncItems,
  removeSyncItem,
} from "@/offline/dexie";

// ─── Test data factories ─────────────────────────────────────────────────────

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
    updatedAt: new Date().toISOString(),
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

function makePhoto(overrides?: Partial<DraftPhoto>): DraftPhoto {
  return {
    id: "p-1",
    eventId: "evt-1",
    findingId: "f-1",
    url: null,
    caption: null,
    order: 0,
    uploaded: false,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire mockWhere chain after clearAllMocks
  mockWhere.mockReturnValue({ equals: mockEquals });
  mockEquals.mockReturnValue({ toArray: mockToArray });
});

describe("saveDraft", () => {
  it("puts draft into localDb.drafts", async () => {
    const draft = makeDraft();
    await saveDraft(draft);
    expect(mockPut).toHaveBeenCalledWith(draft);
  });
});

describe("getDraft", () => {
  it("returns draft when found", async () => {
    const draft = makeDraft();
    mockGet.mockResolvedValueOnce(draft);
    const result = await getDraft("evt-1");
    expect(mockGet).toHaveBeenCalledWith("evt-1");
    expect(result).toEqual(draft);
  });

  it("returns undefined when not found", async () => {
    mockGet.mockResolvedValueOnce(undefined);
    const result = await getDraft("nonexistent");
    expect(result).toBeUndefined();
  });
});

describe("saveFinding", () => {
  it("puts finding into localDb.findings", async () => {
    const finding = makeFinding();
    await saveFinding(finding);
    expect(mockPut).toHaveBeenCalledWith(finding);
  });
});

describe("getFindingsByEvent", () => {
  it("queries findings by eventId", async () => {
    const findings = [makeFinding(), makeFinding({ id: "f-2" })];
    mockToArray.mockResolvedValueOnce(findings);

    const result = await getFindingsByEvent("evt-1");

    expect(mockWhere).toHaveBeenCalledWith("eventId");
    expect(mockEquals).toHaveBeenCalledWith("evt-1");
    expect(result).toEqual(findings);
  });

  it("returns empty array when no findings", async () => {
    mockToArray.mockResolvedValueOnce([]);
    const result = await getFindingsByEvent("evt-999");
    expect(result).toEqual([]);
  });
});

describe("savePhoto", () => {
  it("puts photo into localDb.photos", async () => {
    const photo = makePhoto();
    await savePhoto(photo);
    expect(mockPut).toHaveBeenCalledWith(photo);
  });
});

describe("getPhotosByEvent", () => {
  it("queries photos by eventId", async () => {
    const photos = [makePhoto()];
    mockToArray.mockResolvedValueOnce(photos);

    const result = await getPhotosByEvent("evt-1");

    expect(mockWhere).toHaveBeenCalledWith("eventId");
    expect(mockEquals).toHaveBeenCalledWith("evt-1");
    expect(result).toEqual(photos);
  });
});

describe("enqueueSyncItem", () => {
  it("adds item to syncQueue", async () => {
    const item = {
      type: "finding" as const,
      payload: { findingId: "f-1", status: "good" },
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    await enqueueSyncItem(item);
    expect(mockAdd).toHaveBeenCalledWith(item);
  });
});

describe("dequeueSyncItems", () => {
  it("returns all items from syncQueue", async () => {
    const items: SyncQueueItem[] = [
      { id: 1, type: "finding", payload: {}, createdAt: "2026-01-01", retries: 0 },
      { id: 2, type: "photo", payload: {}, createdAt: "2026-01-01", retries: 1 },
    ];
    mockToArray.mockResolvedValueOnce(items);

    const result = await dequeueSyncItems();
    expect(result).toEqual(items);
  });
});

describe("removeSyncItem", () => {
  it("deletes item by id", async () => {
    await removeSyncItem(42);
    expect(mockDelete).toHaveBeenCalledWith(42);
  });
});
