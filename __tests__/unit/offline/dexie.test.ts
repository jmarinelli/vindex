import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DraftInspection, DraftFinding, DraftPhoto } from "@/types/inspection";

// ─── Hoisted mocks (available inside vi.mock factory) ────────────────────────

const {
  mockPut,
  mockGet,
  mockDelete,
  mockToArray,
  mockEquals,
  mockWhere,
  mockDeleteCollection,
} = vi.hoisted(() => {
  const mockDeleteCollection = vi.fn().mockResolvedValue(0);
  const mockToArray = vi.fn().mockResolvedValue([]);
  const mockEquals = vi.fn().mockReturnValue({ toArray: mockToArray, delete: mockDeleteCollection });
  const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
  return {
    mockPut: vi.fn().mockResolvedValue(undefined),
    mockGet: vi.fn(),
    mockDelete: vi.fn().mockResolvedValue(undefined),
    mockToArray,
    mockEquals,
    mockWhere,
    mockDeleteCollection,
  };
});

vi.mock("dexie", () => {
  return {
    default: class FakeDexie {
      drafts = { put: mockPut, get: mockGet, delete: mockDelete };
      findings = { put: mockPut, where: mockWhere, toArray: mockToArray };
      photos = { put: mockPut, where: mockWhere, delete: mockDelete, toArray: mockToArray };

      constructor() {}
      version() {
        const versionObj = { stores: () => versionObj, upgrade: () => versionObj };
        return versionObj;
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
  clearInspectionData,
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
    findingsSeeded: true,
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
    syncedAt: null,
    ...overrides,
  };
}

function makePhoto(overrides?: Partial<DraftPhoto>): DraftPhoto {
  return {
    id: "p-1",
    eventId: "evt-1",
    findingId: "f-1",
    photoType: "finding",
    url: null,
    caption: null,
    order: 0,
    uploaded: false,
    retries: 0,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire mockWhere chain after clearAllMocks
  mockWhere.mockReturnValue({ equals: mockEquals });
  mockEquals.mockReturnValue({ toArray: mockToArray, delete: mockDeleteCollection });
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

describe("clearInspectionData", () => {
  it("deletes draft, findings, and photos for eventId", async () => {
    await clearInspectionData("evt-1");

    expect(mockDelete).toHaveBeenCalledWith("evt-1");
    expect(mockWhere).toHaveBeenCalledWith("eventId");
    expect(mockDeleteCollection).toHaveBeenCalled();
  });
});
