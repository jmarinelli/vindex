import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock env vars ──────────────────────────────────────────────────────────

vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "test-cloud");
vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET", "test-preset");

// ─── Tests ──────────────────────────────────────────────────────────────────

// Re-import after env vars are set
const { uploadToCloudinary } = await import("@/lib/services/cloudinary");

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadToCloudinary", () => {
  const defaultParams = {
    blob: new Blob(["test-image"], { type: "image/jpeg" }),
    eventId: "evt-123",
    photoType: "finding" as const,
    photoId: "photo-abc",
  };

  it("sends correct FormData fields and returns secure_url", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ secure_url: "https://res.cloudinary.com/test/image.jpg" }),
    });

    const url = await uploadToCloudinary(defaultParams);

    expect(url).toBe("https://res.cloudinary.com/test/image.jpg");
    expect(mockFetch).toHaveBeenCalledOnce();

    const [fetchUrl, fetchOpts] = mockFetch.mock.calls[0];
    expect(fetchUrl).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/upload");
    expect(fetchOpts.method).toBe("POST");

    const body = fetchOpts.body as FormData;
    expect(body.get("upload_preset")).toBe("test-preset");
    expect(body.get("folder")).toBe("vindex/events/evt-123");
    expect(body.get("public_id")).toBe("finding-photo-abc");
    expect(body.get("file")).toBeInstanceOf(Blob);
  });

  it("uses correct public_id for vehicle photos", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ secure_url: "https://res.cloudinary.com/test/vehicle.jpg" }),
    });

    await uploadToCloudinary({ ...defaultParams, photoType: "vehicle", photoId: "photo-xyz" });

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("public_id")).toBe("vehicle-photo-xyz");
  });

  it("throws on non-ok response (400)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    await expect(uploadToCloudinary(defaultParams)).rejects.toThrow(
      "Cloudinary upload failed: 400"
    );
  });

  it("throws on non-ok response (500)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(uploadToCloudinary(defaultParams)).rejects.toThrow(
      "Cloudinary upload failed: 500"
    );
  });
});
