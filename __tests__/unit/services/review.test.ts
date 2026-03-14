import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the database ────────────────────────────────────────────────────────

let queryResults: unknown[][] = [];
let insertReturns: unknown[][] = [];

vi.mock("@/db", () => ({
  db: new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "select") {
          return () => ({
            from: () => ({
              where: () => {
                const results = queryResults.shift() ?? [];
                return {
                  limit: () => results,
                  orderBy: () => {
                    // For getReviewsForEvent (no limit after orderBy)
                    return results;
                  },
                  then: (resolve: (v: unknown) => void) => resolve(results),
                  [Symbol.iterator]: function* () {
                    yield* results as Iterable<unknown>;
                  },
                };
              },
              innerJoin: () => ({
                where: () => ({
                  groupBy: () => {
                    const results = queryResults.shift() ?? [];
                    return results;
                  },
                }),
              }),
            }),
          });
        }
        if (prop === "insert") {
          return () => ({
            values: () => ({
              returning: () => insertReturns.shift() ?? [],
            }),
          });
        }
        return undefined;
      },
    }
  ),
}));

vi.mock("@/db/schema", () => ({
  events: {
    id: "id",
    nodeId: "node_id",
    status: "status",
  },
  reviews: {
    id: "id",
    eventId: "event_id",
    matchRating: "match_rating",
    comment: "comment",
    reviewerIdentifier: "reviewer_identifier",
    createdAt: "created_at",
  },
}));

import {
  submitReview,
  getReviewsForEvent,
  getReviewsForNode,
} from "@/lib/services/review";

// ─── Helpers ────────────────────────────────────────────────────────────────

function createEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    status: "signed",
    nodeId: crypto.randomUUID(),
    ...overrides,
  };
}

function createReview(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    matchRating: "yes",
    comment: null,
    reviewerIdentifier: "abc123",
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("submitReview", () => {
  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
    vi.clearAllMocks();
  });

  it("creates a review for a signed event", async () => {
    const event = createEvent();
    const review = createReview({ eventId: event.id });

    // 1. event lookup
    queryResults.push([event]);
    // 2. rate limit check (no existing review)
    queryResults.push([]);
    // 3. insert returns
    insertReturns.push([review]);

    const result = await submitReview(
      event.id,
      "yes",
      "Buen reporte",
      "hash123"
    );

    expect(result).toEqual(review);
  });

  it("throws when event does not exist", async () => {
    queryResults.push([]); // event not found

    await expect(
      submitReview(crypto.randomUUID(), "yes", undefined, "hash123")
    ).rejects.toThrow("La inspección no fue encontrada.");
  });

  it("throws when event is not signed (draft)", async () => {
    const event = createEvent({ status: "draft" });
    queryResults.push([event]);

    await expect(
      submitReview(event.id, "yes", undefined, "hash123")
    ).rejects.toThrow(
      "Solo se pueden dejar reseñas en inspecciones firmadas."
    );
  });

  it("throws when rate limited (duplicate within 24h)", async () => {
    const event = createEvent();
    const existingReview = createReview({ eventId: event.id });

    queryResults.push([event]); // event lookup
    queryResults.push([existingReview]); // existing review found

    await expect(
      submitReview(event.id, "yes", undefined, "hash123")
    ).rejects.toThrow(
      "Ya dejaste una reseña para esta inspección. Podés dejar otra en 24 horas."
    );
  });

  it("stores null for empty comment", async () => {
    const event = createEvent();
    const review = createReview({ eventId: event.id, comment: null });

    queryResults.push([event]);
    queryResults.push([]);
    insertReturns.push([review]);

    const result = await submitReview(event.id, "yes", "", "hash123");
    expect(result.comment).toBeNull();
  });

  it("stores trimmed comment", async () => {
    const event = createEvent();
    const review = createReview({
      eventId: event.id,
      comment: "Great report",
    });

    queryResults.push([event]);
    queryResults.push([]);
    insertReturns.push([review]);

    const result = await submitReview(
      event.id,
      "partially",
      "  Great report  ",
      "hash123"
    );
    expect(result).toEqual(review);
  });
});

describe("getReviewsForEvent", () => {
  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
  });

  it("returns reviews sorted by created_at desc with aggregation", async () => {
    const reviews = [
      createReview({ matchRating: "yes" }),
      createReview({ matchRating: "no" }),
      createReview({ matchRating: "yes" }),
    ];
    queryResults.push(reviews);

    const result = await getReviewsForEvent("event-1");

    expect(result.reviews).toEqual(reviews);
    expect(result.aggregation).toEqual({
      total: 3,
      yesCount: 2,
      partiallyCount: 0,
      noCount: 1,
    });
  });

  it("returns empty list and zero counts for event with no reviews", async () => {
    queryResults.push([]);

    const result = await getReviewsForEvent("event-1");

    expect(result.reviews).toEqual([]);
    expect(result.aggregation).toEqual({
      total: 0,
      yesCount: 0,
      partiallyCount: 0,
      noCount: 0,
    });
  });
});

describe("getReviewsForNode", () => {
  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
  });

  it("aggregates across all signed events for node", async () => {
    queryResults.push([
      { matchRating: "yes", count: 10 },
      { matchRating: "partially", count: 3 },
      { matchRating: "no", count: 2 },
    ]);

    const result = await getReviewsForNode("node-1");

    expect(result).toEqual({
      total: 15,
      yesCount: 10,
      partiallyCount: 3,
      noCount: 2,
      matchRate: 67,
    });
  });

  it("returns zero counts for node with no reviews", async () => {
    queryResults.push([]);

    const result = await getReviewsForNode("node-1");

    expect(result).toEqual({
      total: 0,
      yesCount: 0,
      partiallyCount: 0,
      noCount: 0,
      matchRate: 0,
    });
  });

  it("calculates 100% match rate when all reviews are yes", async () => {
    queryResults.push([{ matchRating: "yes", count: 5 }]);

    const result = await getReviewsForNode("node-1");

    expect(result.matchRate).toBe(100);
  });

  it("calculates 0% match rate when no reviews are yes", async () => {
    queryResults.push([
      { matchRating: "partially", count: 3 },
      { matchRating: "no", count: 2 },
    ]);

    const result = await getReviewsForNode("node-1");

    expect(result.matchRate).toBe(0);
  });
});
