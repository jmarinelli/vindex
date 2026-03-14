import { describe, it, expect } from "vitest";
import { submitReviewSchema } from "@/lib/validators";

describe("submitReviewSchema", () => {
  const validInput = {
    eventId: crypto.randomUUID(),
    matchRating: "yes",
  };

  it("accepts valid input with matchRating only", () => {
    const result = submitReviewSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with comment", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "Muy buena inspección.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all matchRating values", () => {
    for (const value of ["yes", "partially", "no"]) {
      const result = submitReviewSchema.safeParse({
        ...validInput,
        matchRating: value,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts empty string comment", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined comment (optional)", () => {
    const result = submitReviewSchema.safeParse({
      eventId: validInput.eventId,
      matchRating: "yes",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing matchRating", () => {
    const result = submitReviewSchema.safeParse({
      eventId: validInput.eventId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid matchRating value", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      matchRating: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing eventId", () => {
    const result = submitReviewSchema.safeParse({
      matchRating: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for eventId", () => {
    const result = submitReviewSchema.safeParse({
      eventId: "not-a-uuid",
      matchRating: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment exceeding 500 characters", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts comment of exactly 500 characters", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      comment: "x".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("strips extra fields", () => {
    const result = submitReviewSchema.safeParse({
      ...validInput,
      extraField: "should be stripped",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("extraField" in result.data).toBe(false);
    }
  });
});
