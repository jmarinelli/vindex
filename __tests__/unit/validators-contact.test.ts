import { describe, it, expect } from "vitest";
import { contactFormSchema } from "@/lib/validators";

describe("contactFormSchema", () => {
  const validData = {
    name: "Juan Pérez",
    email: "juan@test.com",
    phone: "+54 11 1234-5678",
    message: "Tengo un taller de inspecciones vehiculares.",
  };

  it("accepts valid contact form data", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts data without phone (optional)", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts data with phone omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { phone: _phone, ...noPhone } = validData;
    const result = contactFormSchema.safeParse(noPhone);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      name: "J",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("al menos 2 caracteres");
    }
  });

  it("rejects empty name", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("email válido");
    }
  });

  it("rejects empty email", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message shorter than 10 chars", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      message: "Corto",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("al menos 10 caracteres");
    }
  });

  it("rejects message longer than 500 chars", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      message: "x".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("500 caracteres");
    }
  });

  it("accepts message exactly 10 chars", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      message: "x".repeat(10),
    });
    expect(result.success).toBe(true);
  });

  it("accepts message exactly 500 chars", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      message: "x".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      message: "",
    });
    expect(result.success).toBe(false);
  });
});
