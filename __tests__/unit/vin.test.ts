import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateVin, sanitizeVin, decodeVin } from "@/lib/vin";

describe("sanitizeVin", () => {
  it("uppercases input", () => {
    expect(sanitizeVin("abc")).toBe("ABC");
  });

  it("strips spaces", () => {
    expect(sanitizeVin("AB C D")).toBe("ABCD");
  });

  it("handles empty string", () => {
    expect(sanitizeVin("")).toBe("");
  });
});

describe("validateVin", () => {
  const VALID_VIN = "11111111111111111"; // check digit = 1
  const KNOWN_VALID_VIN = "1G1YY22G865104015"; // computed valid check digit = 8

  it("rejects empty string", () => {
    const result = validateVin("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("17 caracteres");
  });

  it("rejects too short VIN", () => {
    const result = validateVin("1234567890");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("17 caracteres");
  });

  it("rejects too long VIN", () => {
    const result = validateVin("123456789012345678");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("17 caracteres");
  });

  it("rejects VIN with I", () => {
    const result = validateVin("1G1YY22GI65104015");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("I, O o Q");
  });

  it("rejects VIN with O", () => {
    const result = validateVin("1G1YY22GO65104015");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("I, O o Q");
  });

  it("rejects VIN with Q", () => {
    const result = validateVin("1G1YY22GQ65104015");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("I, O o Q");
  });

  it("rejects VIN with non-alphanumeric chars", () => {
    const result = validateVin("1G1YY22G!65104015");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("letras y números");
  });

  it("rejects VIN with invalid check digit", () => {
    // Change position 9 to an invalid check digit
    const result = validateVin("1G1YY22G065104015");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("dígito verificador");
  });

  it("accepts a valid VIN", () => {
    const result = validateVin(KNOWN_VALID_VIN);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts VIN with all 1s (check digit 1)", () => {
    const result = validateVin(VALID_VIN);
    expect(result.valid).toBe(true);
  });

  it("accepts non-North-American VIN without check digit validation (Argentina)", () => {
    // 8A = Argentina; position 9 is not a check digit in this region
    const result = validateVin("8AGBN68W0KR112794");
    expect(result.valid).toBe(true);
  });

  it("accepts European VIN without check digit validation", () => {
    // W = Germany; position 9 is a manufacturer descriptor
    const result = validateVin("WVWZZZ3CZWE123456");
    expect(result.valid).toBe(true);
  });

  it("still rejects North American VIN with invalid check digit", () => {
    // Starts with 1 (USA) — check digit must be validated
    const result = validateVin("1G1YY22G065104015");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("dígito verificador");
  });

  it("still rejects Chinese VIN with invalid check digit", () => {
    // Starts with L (China) — check digit must be validated
    const result = validateVin("LSGJA52U0AH012345");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("dígito verificador");
  });
});

describe("decodeVin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns decoded data on success", async () => {
    const mockResponse = {
      Results: [
        {
          Make: "Nissan",
          Model: "Sentra",
          ModelYear: "2019",
          Trim: "SR",
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Nissan",
      model: "Sentra",
      year: 2019,
      trim: "SR",
    });
  });

  it("returns null on API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("returns null when no results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ Results: [] }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("handles partial decode data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Results: [{ Make: "Toyota", Model: "", ModelYear: "", Trim: "" }],
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Toyota",
      model: null,
      year: null,
      trim: null,
    });
  });
});
