"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";
import { submitReviewSchema } from "@/lib/validators";
import * as reviewService from "@/lib/services/review";
import type { Review } from "@/db/schema";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Submit a review for a signed inspection event.
 * No auth required — public action. Rate limited by IP.
 */
export async function submitReviewAction(
  input: unknown
): Promise<ActionResult<{ review: Review }>> {
  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  // Generate reviewer identifier from IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";
  const reviewerIdentifier = createHash("sha256").update(ip).digest("hex");

  try {
    const review = await reviewService.submitReview(
      parsed.data.eventId,
      parsed.data.matchRating,
      parsed.data.comment || undefined,
      reviewerIdentifier
    );

    return { success: true, data: { review } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al enviar la reseña.";
    return { success: false, error: message };
  }
}
