import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { reviews, events, reviewTokens } from "@/db/schema";
import type { Review } from "@/db/schema";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReviewAggregation {
  total: number;
  yesCount: number;
  partiallyCount: number;
  noCount: number;
}

export interface EventReviewsData {
  reviews: Review[];
  aggregation: ReviewAggregation;
}

export interface NodeReviewStats extends ReviewAggregation {
  matchRate: number; // percentage 0-100
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Submit a review for a signed inspection event.
 * Enforces:
 * - Event must exist and be signed
 * - Rate limit: 1 review per event per reviewer_identifier per 24h
 */
export async function submitReview(
  eventId: string,
  matchRating: "yes" | "partially" | "no",
  comment: string | undefined,
  reviewerIdentifier: string
): Promise<Review> {
  // 1. Validate event exists and is signed
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new Error("La inspección no fue encontrada.");
  }

  if (event.status !== "signed") {
    throw new Error(
      "Solo se pueden dejar reseñas en inspecciones firmadas."
    );
  }

  // 2. Rate limit check: 1 per event per identifier per 24h
  const [existing] = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.eventId, eventId),
        eq(reviews.reviewerIdentifier, reviewerIdentifier),
        sql`${reviews.createdAt} > now() - interval '24 hours'`
      )
    )
    .limit(1);

  if (existing) {
    throw new Error(
      "Ya dejaste una reseña para esta inspección. Podés dejar otra en 24 horas."
    );
  }

  // 3. Insert review
  const [review] = await db
    .insert(reviews)
    .values({
      eventId,
      matchRating,
      comment: comment && comment.trim() ? comment.trim() : null,
      reviewerIdentifier,
    })
    .returning();

  return review;
}

/**
 * Submit a review using a single-use token.
 * In one transaction: insert review + mark token as used.
 * Throws for invalid/expired/used tokens.
 */
export async function submitTokenReview(
  token: string,
  matchRating: "yes" | "partially" | "no",
  comment?: string
): Promise<Review> {
  return await db.transaction(async (tx) => {
    // Lock the token row
    const [reviewToken] = await tx
      .select()
      .from(reviewTokens)
      .where(eq(reviewTokens.token, token))
      .for("update")
      .limit(1);

    if (!reviewToken) {
      throw new Error("Token de reseña inválido.");
    }

    if (reviewToken.usedAt) {
      throw new Error("Ya dejaste una reseña con este enlace.");
    }

    if (new Date() > reviewToken.expiresAt) {
      throw new Error("Este enlace de reseña expiró.");
    }

    // Insert review
    const [review] = await tx
      .insert(reviews)
      .values({
        eventId: reviewToken.eventId,
        reviewTokenId: reviewToken.id,
        matchRating,
        comment: comment && comment.trim() ? comment.trim() : null,
      })
      .returning();

    // Mark token as used
    await tx
      .update(reviewTokens)
      .set({ usedAt: sql`now()` })
      .where(eq(reviewTokens.id, reviewToken.id));

    return review;
  });
}

/**
 * Get the single review for an event (for report page display).
 * Returns null if no review exists.
 */
export async function getReviewForEvent(
  eventId: string
): Promise<Review | null> {
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.eventId, eventId))
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  return review ?? null;
}

/**
 * Get all reviews for a specific event, sorted newest first.
 * Returns reviews and aggregated counts.
 */
export async function getReviewsForEvent(
  eventId: string
): Promise<EventReviewsData> {
  const eventReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.eventId, eventId))
    .orderBy(desc(reviews.createdAt));

  const aggregation = computeAggregation(eventReviews);

  return { reviews: eventReviews, aggregation };
}

/**
 * Get aggregated review stats across all signed events for a node.
 */
export async function getReviewsForNode(
  nodeId: string
): Promise<NodeReviewStats> {
  const result = await db
    .select({
      matchRating: reviews.matchRating,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .innerJoin(events, eq(reviews.eventId, events.id))
    .where(and(eq(events.nodeId, nodeId), eq(events.status, "signed")))
    .groupBy(reviews.matchRating);

  let yesCount = 0;
  let partiallyCount = 0;
  let noCount = 0;

  for (const row of result) {
    if (row.matchRating === "yes") yesCount = row.count;
    else if (row.matchRating === "partially") partiallyCount = row.count;
    else if (row.matchRating === "no") noCount = row.count;
  }

  const total = yesCount + partiallyCount + noCount;
  const matchRate = total > 0 ? Math.round((yesCount / total) * 100) : 0;

  return { total, yesCount, partiallyCount, noCount, matchRate };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeAggregation(reviewList: Review[]): ReviewAggregation {
  let yesCount = 0;
  let partiallyCount = 0;
  let noCount = 0;

  for (const r of reviewList) {
    if (r.matchRating === "yes") yesCount++;
    else if (r.matchRating === "partially") partiallyCount++;
    else if (r.matchRating === "no") noCount++;
  }

  return { total: reviewList.length, yesCount, partiallyCount, noCount };
}
