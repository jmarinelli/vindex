import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("generates a slug of default length (8)", () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(8);
  });

  it("generates a slug of custom length", () => {
    const slug = generateSlug(12);
    expect(slug).toHaveLength(12);
  });

  it("generates URL-safe characters only", () => {
    const slug = generateSlug(100);
    expect(slug).toMatch(/^[a-z0-9]+$/);
  });

  it("generates unique slugs", () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});
