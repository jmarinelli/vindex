import { randomBytes } from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  reviewTokens,
  reviews,
  events,
  vehicles,
  nodes,
  inspectionDetails,
  inspectionFindings,
  users,
} from "@/db/schema";
import type { ReviewToken, Review } from "@/db/schema";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TokenValidationResult {
  status: "valid" | "invalid" | "expired" | "used";
  reviewToken?: ReviewToken;
  existingReview?: Review;
  context?: TokenContext;
}

export interface TokenContext {
  vehicleName: string;
  plate: string;
  vin: string;
  inspectorName: string;
  eventDate: string;
  reportSlug: string;
  findingsSummary: {
    good: number;
    attention: number;
    critical: number;
  };
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Generate a single-use review token for an event.
 * Token is 48-char base64url, expires in 90 days.
 */
export async function generateToken(
  eventId: string,
  customerEmail: string
): Promise<ReviewToken> {
  const token = randomBytes(36).toString("base64url").slice(0, 48);
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const [reviewToken] = await db
    .insert(reviewTokens)
    .values({
      eventId,
      token,
      customerEmail,
      expiresAt,
    })
    .returning();

  return reviewToken;
}

/**
 * Validate a review token and return context for the review page.
 */
export async function validateToken(
  token: string
): Promise<TokenValidationResult> {
  // Look up token
  const [reviewToken] = await db
    .select()
    .from(reviewTokens)
    .where(eq(reviewTokens.token, token))
    .limit(1);

  if (!reviewToken) {
    return { status: "invalid" };
  }

  // Check if already used
  if (reviewToken.usedAt) {
    // Fetch the existing review
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.reviewTokenId, reviewToken.id))
      .limit(1);

    const context = await buildContext(reviewToken.eventId);

    return {
      status: "used",
      reviewToken,
      existingReview: existingReview ?? undefined,
      context: context ?? undefined,
    };
  }

  // Check expiry
  if (new Date() > reviewToken.expiresAt) {
    const context = await buildContext(reviewToken.eventId);
    return {
      status: "expired",
      reviewToken,
      context: context ?? undefined,
    };
  }

  // Valid — build context
  const context = await buildContext(reviewToken.eventId);
  if (!context) {
    return { status: "invalid" };
  }

  return { status: "valid", reviewToken, context };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function buildContext(eventId: string): Promise<TokenContext | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return null;

  const [vehicle, node, findings] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, event.vehicleId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(nodes)
      .where(eq(nodes.id, event.nodeId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(inspectionFindings)
      .where(eq(inspectionFindings.eventId, eventId)),
  ]);

  if (!vehicle || !node) return null;

  const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(" ");

  const good = findings.filter((f) => f.status === "good").length;
  const attention = findings.filter((f) => f.status === "attention").length;
  const critical = findings.filter((f) => f.status === "critical").length;

  return {
    vehicleName,
    plate: vehicle.plate,
    vin: vehicle.vin,
    inspectorName: node.displayName,
    eventDate: event.eventDate,
    reportSlug: event.slug,
    findingsSummary: { good, attention, critical },
  };
}
