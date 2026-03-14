import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DraftPhoto } from "@/types/inspection";

// ─── Mock dexie module ──────────────────────────────────────────────────────

const mockSavePhoto = vi.fn().mockResolvedValue(undefined);
const mockGetPhotosByEvent = vi.fn().mockResolvedValue([]);

vi.mock("@/offline/dexie", () => ({
  savePhoto: (...args: unknown[]) => mockSavePhoto(...args),
  getPhotosByEvent: (...args: unknown[]) => mockGetPhotosByEvent(...args),
}));

// ─── Mock crypto.randomUUID ──────────────────────────────────────────────────

vi.stubGlobal("crypto", {
  randomUUID: vi.fn().mockReturnValue("mock-uuid-1234"),
});

import { compressImage, capturePhoto } from "@/offline/photo-queue";

// ─── Canvas / Image mocking helpers ──────────────────────────────────────────

function setupImageMock(width = 800, height = 600) {
  // Use a class so `new Image()` works as a constructor
  class FakeImage {
    width = width;
    height = height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }

    set src(val: string) {
      this._src = val;
      // Trigger onload on next microtask
      Promise.resolve().then(() => this.onload?.());
    }
  }

  vi.stubGlobal("Image", FakeImage);
}

function setupImageMockError() {
  class FakeImageError {
    width = 0;
    height = 0;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }

    set src(val: string) {
      this._src = val;
      Promise.resolve().then(() => this.onerror?.());
    }
  }

  vi.stubGlobal("Image", FakeImageError);
}

function setupCanvasMock(returnBlob: Blob | null = new Blob(["fake"], { type: "image/jpeg" })) {
  const drawImageMock = vi.fn();
  const toBlobMock = vi.fn().mockImplementation((cb: (blob: Blob | null) => void) => {
    cb(returnBlob);
  });
  const getContextMock = vi.fn().mockReturnValue({ drawImage: drawImageMock });

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: getContextMock,
        toBlob: toBlobMock,
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  });

  return { drawImageMock, toBlobMock, getContextMock };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn().mockReturnValue("blob:fake-url"),
    revokeObjectURL: vi.fn(),
  });
});

describe("compressImage", () => {
  it("compresses an image file to a JPEG blob", async () => {
    setupImageMock(800, 600);
    const expectedBlob = new Blob(["compressed"], { type: "image/jpeg" });
    setupCanvasMock(expectedBlob);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImage(file);

    expect(result).toBe(expectedBlob);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("scales down images wider than maxWidth", async () => {
    setupImageMock(3840, 2160);
    const { drawImageMock } = setupCanvasMock();

    const file = new File(["test"], "big.jpg", { type: "image/jpeg" });
    await compressImage(file, 1920, 0.7);

    expect(drawImageMock).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1920,
      1080
    );
  });

  it("keeps original dimensions when within maxWidth", async () => {
    setupImageMock(1000, 500);
    const { drawImageMock } = setupCanvasMock();

    const file = new File(["test"], "small.jpg", { type: "image/jpeg" });
    await compressImage(file, 1920);

    expect(drawImageMock).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1000,
      500
    );
  });

  it("rejects when canvas context is not available", async () => {
    setupImageMock(800, 600);
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(null),
          toBlob: vi.fn(),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    await expect(compressImage(file)).rejects.toThrow("Canvas not supported");
  });

  it("rejects when toBlob returns null", async () => {
    setupImageMock(800, 600);
    setupCanvasMock(null);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    await expect(compressImage(file)).rejects.toThrow("Compression failed");
  });

  it("rejects when image fails to load", async () => {
    setupImageMockError();

    const file = new File(["test"], "broken.jpg", { type: "image/jpeg" });
    await expect(compressImage(file)).rejects.toThrow("Failed to load image");
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe("capturePhoto", () => {
  beforeEach(() => {
    setupImageMock(800, 600);
    setupCanvasMock();
  });

  it("compresses file, saves to dexie, and returns DraftPhoto", async () => {
    mockGetPhotosByEvent.mockResolvedValueOnce([]);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const result = await capturePhoto({
      file,
      eventId: "evt-1",
      findingId: "f-1",
      photoType: "finding",
    });

    expect(result.id).toBe("mock-uuid-1234");
    expect(result.eventId).toBe("evt-1");
    expect(result.findingId).toBe("f-1");
    expect(result.order).toBe(0);
    expect(result.uploaded).toBe(false);
    expect(result.url).toBeNull();
    expect(result.caption).toBeNull();
    expect(result.blob).toBeInstanceOf(Blob);
    expect(mockSavePhoto).toHaveBeenCalledWith(result);
  });

  it("sets order based on existing photos for the same finding", async () => {
    const existingPhotos: DraftPhoto[] = [
      { id: "p-1", eventId: "evt-1", findingId: "f-1", photoType: "finding", url: null, caption: null, order: 0, uploaded: false },
      { id: "p-2", eventId: "evt-1", findingId: "f-1", photoType: "finding", url: null, caption: null, order: 1, uploaded: false },
    ];
    mockGetPhotosByEvent.mockResolvedValueOnce(existingPhotos);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const result = await capturePhoto({
      file,
      eventId: "evt-1",
      findingId: "f-1",
      photoType: "finding",
    });

    expect(result.order).toBe(2);
  });

  it("counts only event-level photos when findingId is null", async () => {
    const existingPhotos: DraftPhoto[] = [
      { id: "p-1", eventId: "evt-1", findingId: null, photoType: "vehicle", url: null, caption: null, order: 0, uploaded: false },
      { id: "p-2", eventId: "evt-1", findingId: "f-1", photoType: "finding", url: null, caption: null, order: 0, uploaded: false },
    ];
    mockGetPhotosByEvent.mockResolvedValueOnce(existingPhotos);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const result = await capturePhoto({
      file,
      eventId: "evt-1",
      findingId: null,
      photoType: "vehicle",
    });

    expect(result.order).toBe(1);
    expect(result.findingId).toBeNull();
  });
});
