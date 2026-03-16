import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DraftPhoto } from "@/types/inspection";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockUploadToCloudinary = vi.fn();
vi.mock("@/lib/services/cloudinary", () => ({
  uploadToCloudinary: (...args: unknown[]) => mockUploadToCloudinary(...args),
}));

const mockSaveEventPhotoAction = vi.fn();
vi.mock("@/lib/actions/inspection", () => ({
  saveEventPhotoAction: (...args: unknown[]) => mockSaveEventPhotoAction(...args),
}));

const mockPhotosUpdate = vi.fn().mockResolvedValue(undefined);
const mockPhotosWhere = vi.fn();
const mockPhotosEquals = vi.fn();
const mockPhotosToArray = vi.fn();

vi.mock("@/offline/dexie", () => ({
  localDb: {
    photos: {
      update: (...args: unknown[]) => mockPhotosUpdate(...args),
      where: (...args: unknown[]) => mockPhotosWhere(...args),
    },
  },
}));

import { uploadWithRetry, processPhotoQueue } from "@/offline/photo-upload";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePhoto(overrides: Partial<DraftPhoto> = {}): DraftPhoto {
  return {
    id: "photo-1",
    eventId: "evt-1",
    findingId: "f-1",
    photoType: "finding",
    blob: new Blob(["test"], { type: "image/jpeg" }),
    url: null,
    caption: null,
    order: 0,
    uploaded: false,
    retries: 0,
    ...overrides,
  };
}

function wirePhotoQuery() {
  mockPhotosWhere.mockReturnValue({ equals: mockPhotosEquals });
  mockPhotosEquals.mockReturnValue({ toArray: mockPhotosToArray });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  wirePhotoQuery();
});

describe("uploadWithRetry", () => {
  it("returns URL on first successful attempt", async () => {
    mockUploadToCloudinary.mockResolvedValueOnce("https://cdn/photo.jpg");

    const url = await uploadWithRetry(makePhoto());

    expect(url).toBe("https://cdn/photo.jpg");
    expect(mockUploadToCloudinary).toHaveBeenCalledOnce();
  });

  it("retries on failure and eventually succeeds", async () => {
    mockUploadToCloudinary
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockResolvedValueOnce("https://cdn/photo.jpg");

    // maxRetries=2 so only 1 retry delay (2s)
    const url = await uploadWithRetry(makePhoto(), 2);

    expect(url).toBe("https://cdn/photo.jpg");
    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(2);
  }, 10000);

  it("throws after max retries and updates Dexie retries count", async () => {
    mockUploadToCloudinary.mockRejectedValueOnce(new Error("persistent failure"));

    const photo = makePhoto({ retries: 0 });
    await expect(uploadWithRetry(photo, 1)).rejects.toThrow("persistent failure");
    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(1);
    expect(mockPhotosUpdate).toHaveBeenCalledWith("photo-1", { retries: 1 });
  });

  it("respects custom maxRetries", async () => {
    mockUploadToCloudinary.mockRejectedValueOnce(new Error("fail"));

    await expect(uploadWithRetry(makePhoto(), 1)).rejects.toThrow("fail");
    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(1);
  });
});

describe("processPhotoQueue", () => {
  it("processes pending photos and calls saveEventPhotoAction on success", async () => {
    const photo = makePhoto();
    mockPhotosToArray.mockResolvedValueOnce([photo]);
    mockUploadToCloudinary.mockResolvedValueOnce("https://cdn/photo.jpg");
    mockSaveEventPhotoAction.mockResolvedValueOnce({ success: true });

    await processPhotoQueue("evt-1");

    expect(mockUploadToCloudinary).toHaveBeenCalledOnce();
    expect(mockSaveEventPhotoAction).toHaveBeenCalledWith({
      eventId: "evt-1",
      findingId: "f-1",
      photoType: "finding",
      url: "https://cdn/photo.jpg",
      caption: null,
      order: 0,
    });
    expect(mockPhotosUpdate).toHaveBeenCalledWith("photo-1", {
      uploaded: true,
      url: "https://cdn/photo.jpg",
    });
  });

  it("skips already-uploaded photos", async () => {
    const uploaded = makePhoto({ uploaded: true });
    const noBlobPhoto = makePhoto({ id: "photo-2", blob: undefined });
    mockPhotosToArray.mockResolvedValueOnce([uploaded, noBlobPhoto]);

    await processPhotoQueue("evt-1");

    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  it("continues processing after per-photo failure", async () => {
    const photo1 = makePhoto({ id: "p-1" });
    const photo2 = makePhoto({ id: "p-2", order: 1 });
    mockPhotosToArray.mockResolvedValueOnce([photo1, photo2]);

    // Photo1 fails on first try (maxRetries=3 with backoff), photo2 succeeds
    mockUploadToCloudinary
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("https://cdn/photo2.jpg");
    mockSaveEventPhotoAction.mockResolvedValueOnce({ success: true });

    await processPhotoQueue("evt-1");

    // 3 failed attempts for photo1 + 1 success for photo2
    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(4);
    expect(mockSaveEventPhotoAction).toHaveBeenCalledOnce();
  }, 20000);
});
