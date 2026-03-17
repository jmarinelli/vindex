import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv, AUTO_DEV_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns decoded data on success", async () => {
    const mockResponse = {
      make: "Nissan",
      model: "Sentra",
      year: 2019,
      trim: "SR",
      vin: "1G1YY22G965104015",
      vinValid: true,
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

  it("sends Authorization header with API key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ make: "Toyota" }),
    } as Response);

    await decodeVin("1G1YY22G965104015");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.auto.dev/vin/1G1YY22G965104015",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-api-key" },
      })
    );
  });

  it("returns null when API key is not set", async () => {
    delete process.env.AUTO_DEV_API_KEY;

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("returns null on API error (non-200)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("returns null on 404 (VIN not found)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toBeNull();
  });

  it("handles partial decode data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ make: "Toyota", model: "", trim: "" }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Toyota",
      model: null,
      year: null,
      trim: null,
    });
  });

  it("falls back to vehicle fields when root fields are missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        vehicle: { make: "Chevrolet", model: "Silverado", year: 2022 },
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Chevrolet",
      model: "Silverado",
      year: 2022,
      trim: null,
    });
  });

  it("prefers root fields over vehicle fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        make: "RootMake",
        model: "RootModel",
        year: 2024,
        vehicle: { make: "VehicleMake", model: "VehicleModel", year: 2020 },
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "RootMake",
      model: "RootModel",
      year: 2024,
      trim: null,
    });
  });

  it("uses type as make when make is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: "Truck",
        model: "Silverado",
        year: 2022,
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Truck",
      model: "Silverado",
      year: 2022,
      trim: null,
    });
  });

  it("prefers root make over type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        make: "Chevrolet",
        type: "Truck",
        model: "Silverado",
        year: 2022,
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Chevrolet",
      model: "Silverado",
      year: 2022,
      trim: null,
    });
  });

  it("uses first element when year is an array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        make: "Toyota",
        model: "Camry",
        year: [2023, 2024],
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Toyota",
      model: "Camry",
      year: 2023,
      trim: null,
    });
  });

  it("falls back to vehicle.model when root model is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        make: "Toyota",
        vehicle: { model: "Camry" },
      }),
    } as Response);

    const result = await decodeVin("1G1YY22G965104015");
    expect(result).toEqual({
      make: "Toyota",
      model: "Camry",
      year: null,
      trim: null,
    });
  });
});
