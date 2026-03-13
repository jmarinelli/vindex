import { describe, it, expect } from "vitest";
import {
  templateItemSchema,
  templateSectionSchema,
  updateTemplateSchema,
} from "@/lib/validators";
import {
  createTemplateItem,
  createTemplateSection,
  createUpdateTemplateInput,
} from "../helpers/factories";

// ─── templateItemSchema ───────────────────────────────────────────────────────

describe("templateItemSchema", () => {
  it("accepts a valid checklist_item", () => {
    const item = createTemplateItem({ type: "checklist_item" });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it("accepts a valid free_text item", () => {
    const item = createTemplateItem({ type: "free_text" });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it("rejects an item with empty name", () => {
    const item = createTemplateItem({ name: "" });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it("rejects an item with name exceeding 255 chars", () => {
    const item = createTemplateItem({ name: "x".repeat(256) });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it("accepts an item with name of exactly 255 chars", () => {
    const item = createTemplateItem({ name: "x".repeat(255) });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it("rejects an item with invalid type", () => {
    const item = { ...createTemplateItem(), type: "invalid" };
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it("rejects an item with malformed UUID", () => {
    const item = createTemplateItem({ id: "not-a-uuid" });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it("rejects an item with negative order", () => {
    const item = createTemplateItem({ order: -1 });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it("rejects an item with decimal order", () => {
    const item = createTemplateItem({ order: 1.5 });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it("accepts order of 0", () => {
    const item = createTemplateItem({ order: 0 });
    const result = templateItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = templateItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── templateSectionSchema ────────────────────────────────────────────────────

describe("templateSectionSchema", () => {
  it("accepts a valid section with items", () => {
    const section = createTemplateSection();
    const result = templateSectionSchema.safeParse(section);
    expect(result.success).toBe(true);
  });

  it("accepts a section with empty items array", () => {
    const section = createTemplateSection({ items: [] });
    const result = templateSectionSchema.safeParse(section);
    expect(result.success).toBe(true);
  });

  it("rejects a section with empty name", () => {
    const section = createTemplateSection({ name: "" });
    const result = templateSectionSchema.safeParse(section);
    expect(result.success).toBe(false);
  });

  it("rejects a section with name exceeding 255 chars", () => {
    const section = createTemplateSection({ name: "x".repeat(256) });
    const result = templateSectionSchema.safeParse(section);
    expect(result.success).toBe(false);
  });

  it("rejects a section with malformed UUID", () => {
    const section = createTemplateSection({ id: "bad-id" });
    const result = templateSectionSchema.safeParse(section);
    expect(result.success).toBe(false);
  });

  it("rejects a section with invalid items", () => {
    const section = {
      ...createTemplateSection({ items: [] }),
      items: [{ id: "bad", name: "", order: -1, type: "wrong" }],
    };
    const result = templateSectionSchema.safeParse(section);
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = templateSectionSchema.safeParse({ id: crypto.randomUUID() });
    expect(result.success).toBe(false);
  });
});

// ─── updateTemplateSchema ─────────────────────────────────────────────────────

describe("updateTemplateSchema", () => {
  it("accepts a valid update input", () => {
    const input = createUpdateTemplateInput();
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects empty template name", () => {
    const input = createUpdateTemplateInput({ name: "" });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects template name exceeding 255 chars", () => {
    const input = createUpdateTemplateInput({ name: "x".repeat(256) });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty sections array", () => {
    const input = createUpdateTemplateInput({ sections: [] });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid templateId (not a UUID)", () => {
    const input = createUpdateTemplateInput({ templateId: "not-uuid" });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects when sections contain invalid items", () => {
    const badSection = {
      ...createTemplateSection(),
      items: [{ id: "x", name: "", order: 0, type: "bad" }],
    };
    const input = createUpdateTemplateInput({
      sections: [badSection as any],
    });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects completely empty input", () => {
    const result = updateTemplateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts multiple sections with multiple items", () => {
    const sections = Array.from({ length: 5 }, (_, i) =>
      createTemplateSection({ order: i, itemCount: 4 })
    );
    const input = createUpdateTemplateInput({ sections });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("provides meaningful error message for empty name", () => {
    const input = createUpdateTemplateInput({ name: "" });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("nombre"))).toBe(true);
    }
  });

  it("provides meaningful error message for empty sections", () => {
    const input = createUpdateTemplateInput({ sections: [] });
    const result = updateTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("sección"))).toBe(true);
    }
  });
});
