import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockHeaders = vi.fn();
vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

const mockSubmitReview = vi.fn();
vi.mock("@/lib/services/review", () => ({
  submitReview: (...args: unknown[]) => mockSubmitReview(...args),
}));

// Import after mocking
import { submitReviewAction } from "@/lib/actions/review";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockHeaders(ip = "192.168.1.1") {
  return {
    get: (name: string) => {
      if (name === "x-forwarded-for") return ip;
      if (name === "x-real-ip") return ip;
      return null;
    },
  };
}

function createReview(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    matchRating: "yes",
    comment: null,
    reviewerIdentifier: "hash",
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("submitReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(createMockHeaders());
  });

  it("returns success with review data on valid input", async () => {
    const review = createReview();
    mockSubmitReview.mockResolvedValue(review);

    const result = await submitReviewAction({
      eventId: crypto.randomUUID(),
      matchRating: "yes",
      comment: "Good report",
    });

    expect(result.success).toBe(true);
    expect(result.data?.review).toEqual(review);
  });

  it("returns error on invalid input (missing matchRating)", async () => {
    const result = await submitReviewAction({
      eventId: crypto.randomUUID(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error on invalid eventId", async () => {
    const result = await submitReviewAction({
      eventId: "not-a-uuid",
      matchRating: "yes",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when service throws rate limit error", async () => {
    mockSubmitReview.mockRejectedValue(
      new Error(
        "Ya dejaste una reseña para esta inspección. Podés dejar otra en 24 horas."
      )
    );

    const result = await submitReviewAction({
      eventId: crypto.randomUUID(),
      matchRating: "yes",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Ya dejaste una reseña");
  });

  it("returns error when service throws not found", async () => {
    mockSubmitReview.mockRejectedValue(
      new Error("La inspección no fue encontrada.")
    );

    const result = await submitReviewAction({
      eventId: crypto.randomUUID(),
      matchRating: "no",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("La inspección no fue encontrada.");
  });

  it("returns generic error for non-Error throws", async () => {
    mockSubmitReview.mockRejectedValue("something unexpected");

    const result = await submitReviewAction({
      eventId: crypto.randomUUID(),
      matchRating: "partially",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al enviar la reseña.");
  });

  it("passes correct arguments to service", async () => {
    const review = createReview();
    mockSubmitReview.mockResolvedValue(review);
    const eventId = crypto.randomUUID();

    await submitReviewAction({
      eventId,
      matchRating: "partially",
      comment: "Some comment",
    });

    expect(mockSubmitReview).toHaveBeenCalledWith(
      eventId,
      "partially",
      "Some comment",
      expect.any(String) // sha256 hash of IP
    );
  });

  it("does not require authentication", async () => {
    const review = createReview();
    mockSubmitReview.mockResolvedValue(review);

    // No auth mock needed — the action doesn't check auth
    const result = await submitReviewAction({
      eventId: crypto.randomUUID(),
      matchRating: "yes",
    });

    expect(result.success).toBe(true);
  });
});
