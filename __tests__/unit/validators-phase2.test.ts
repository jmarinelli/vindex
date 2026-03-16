import { describe, it, expect } from "vitest";
import {
  lookupVehicleSchema,
  vehicleEntrySchema,
  createInspectionSchema,
  updateFindingSchema,
} from "@/lib/validators";

describe("lookupVehicleSchema", () => {
  it("accepts valid 17-char VIN", () => {
    const result = lookupVehicleSchema.safeParse({ vin: "1G1YY22G965104015" });
    expect(result.success).toBe(true);
  });

  it("rejects VIN too short", () => {
    const result = lookupVehicleSchema.safeParse({ vin: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects VIN too long", () => {
    const result = lookupVehicleSchema.safeParse({
      vin: "1G1YY22G965104015X",
    });
    expect(result.success).toBe(false);
  });

  it("rejects VIN with I, O, Q", () => {
    const result = lookupVehicleSchema.safeParse({
      vin: "1G1YY22GI65104015",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing VIN", () => {
    const result = lookupVehicleSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("vehicleEntrySchema", () => {
  const validEntry = {
    vin: "1G1YY22G965104015",
  };

  it("accepts valid VIN only", () => {
    const result = vehicleEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts full entry with optional fields", () => {
    const result = vehicleEntrySchema.safeParse({
      ...validEntry,
      make: "Nissan",
      model: "Sentra",
      year: 2019,
      trim: "SR",
      plate: "AC123BD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects VIN too short", () => {
    const result = vehicleEntrySchema.safeParse({ vin: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects VIN too long", () => {
    const result = vehicleEntrySchema.safeParse({
      vin: "1G1YY22G965104015X",
    });
    expect(result.success).toBe(false);
  });

  it("rejects VIN with invalid chars", () => {
    const result = vehicleEntrySchema.safeParse({
      vin: "1G1YY22GI65104015",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null optional fields", () => {
    const result = vehicleEntrySchema.safeParse({
      ...validEntry,
      make: null,
      model: null,
      year: null,
      trim: null,
      plate: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects plate over 20 chars", () => {
    const result = vehicleEntrySchema.safeParse({
      ...validEntry,
      plate: "A".repeat(21),
    });
    expect(result.success).toBe(false);
  });
});

describe("createInspectionSchema", () => {
  const validInput = {
    vehicleId: "550e8400-e29b-41d4-a716-446655440000",
    inspectionType: "pre_purchase",
    requestedBy: "buyer",
    odometerKm: 87500,
    eventDate: "2026-03-13",
  };

  it("accepts valid input", () => {
    const result = createInspectionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts all inspection types", () => {
    for (const type of ["pre_purchase", "intake", "periodic", "other"]) {
      const result = createInspectionSchema.safeParse({
        ...validInput,
        inspectionType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all requestedBy values", () => {
    for (const val of ["buyer", "seller", "agency", "other"]) {
      const result = createInspectionSchema.safeParse({
        ...validInput,
        requestedBy: val,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid inspection type", () => {
    const result = createInspectionSchema.safeParse({
      ...validInput,
      inspectionType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid requestedBy", () => {
    const result = createInspectionSchema.safeParse({
      ...validInput,
      requestedBy: "nobody",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero odometer", () => {
    const result = createInspectionSchema.safeParse({
      ...validInput,
      odometerKm: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative odometer", () => {
    const result = createInspectionSchema.safeParse({
      ...validInput,
      odometerKm: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing vehicleId", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { vehicleId: _vehicleId, ...rest } = validInput;
    const result = createInspectionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = createInspectionSchema.safeParse({
      ...validInput,
      eventDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for vehicleId", () => {
    const result = createInspectionSchema.safeParse({
      ...validInput,
      vehicleId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateFindingSchema", () => {
  const validFindingId = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts status update", () => {
    const result = updateFindingSchema.safeParse({
      findingId: validFindingId,
      status: "good",
    });
    expect(result.success).toBe(true);
  });

  it("accepts observation update", () => {
    const result = updateFindingSchema.safeParse({
      findingId: validFindingId,
      observation: "Rayón en puerta izquierda",
    });
    expect(result.success).toBe(true);
  });

  it("accepts both status and observation", () => {
    const result = updateFindingSchema.safeParse({
      findingId: validFindingId,
      status: "critical",
      observation: "Golpe severo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["good", "attention", "critical", "not_evaluated"]) {
      const result = updateFindingSchema.safeParse({
        findingId: validFindingId,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = updateFindingSchema.safeParse({
      findingId: validFindingId,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for findingId", () => {
    const result = updateFindingSchema.safeParse({
      findingId: "not-a-uuid",
      status: "good",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null observation", () => {
    const result = updateFindingSchema.safeParse({
      findingId: validFindingId,
      observation: null,
    });
    expect(result.success).toBe(true);
  });
});
