import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSession } from "../../helpers/factories";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockFindOrCreateVehicle = vi.fn();
const mockCountVehicleInspections = vi.fn();
vi.mock("@/lib/services/vehicle", () => ({
  findOrCreateVehicle: (...args: unknown[]) =>
    mockFindOrCreateVehicle(...args),
  countVehicleInspections: (...args: unknown[]) =>
    mockCountVehicleInspections(...args),
}));

// Import after mocking
import { findOrCreateVehicleAction } from "@/lib/actions/vehicle";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    vin: "ABCDE12345678901X",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("findOrCreateVehicleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when user has no nodeId", async () => {
    mockAuth.mockResolvedValue(createMockSession({ nodeId: null }));

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when user has no id", async () => {
    mockAuth.mockResolvedValue({ user: { id: null, nodeId: "n1" } });

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns validation error for invalid VIN (too short)", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await findOrCreateVehicleAction(
      validInput({ vin: "SHORT" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for missing VIN", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await findOrCreateVehicleAction({ make: "Toyota" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for VIN with invalid characters", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await findOrCreateVehicleAction(
      validInput({ vin: "ABCDE1234567890IO" }) // I and O are invalid in VINs
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns success with vehicle data for new vehicle", async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValue(session);

    const vehicle = {
      id: "v1",
      vin: "ABCDE12345678901X",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      trim: null,
      plate: null,
    };
    mockFindOrCreateVehicle.mockResolvedValue({ vehicle, isNew: true });

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({
      success: true,
      data: {
        vehicle: {
          id: "v1",
          vin: "ABCDE12345678901X",
          make: "Toyota",
          model: "Corolla",
          year: 2020,
          trim: null,
          plate: null,
        },
        isNew: true,
        inspectionCount: 0,
      },
    });
    // Should NOT call countVehicleInspections for new vehicles
    expect(mockCountVehicleInspections).not.toHaveBeenCalled();
  });

  it("returns success with inspection count for existing vehicle", async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValue(session);

    const vehicle = {
      id: "v1",
      vin: "ABCDE12345678901X",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      trim: null,
      plate: null,
    };
    mockFindOrCreateVehicle.mockResolvedValue({ vehicle, isNew: false });
    mockCountVehicleInspections.mockResolvedValue(3);

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({
      success: true,
      data: {
        vehicle: {
          id: "v1",
          vin: "ABCDE12345678901X",
          make: "Toyota",
          model: "Corolla",
          year: 2020,
          trim: null,
          plate: null,
        },
        isNew: false,
        inspectionCount: 3,
      },
    });
    expect(mockCountVehicleInspections).toHaveBeenCalledWith("v1");
  });

  it("passes nodeId from session to service", async () => {
    const session = createMockSession({ nodeId: "my-node" });
    mockAuth.mockResolvedValue(session);

    const vehicle = {
      id: "v1",
      vin: "ABCDE12345678901X",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      trim: null,
      plate: null,
    };
    mockFindOrCreateVehicle.mockResolvedValue({ vehicle, isNew: true });

    await findOrCreateVehicleAction(validInput());

    expect(mockFindOrCreateVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ nodeId: "my-node" })
    );
  });

  it("returns error when service throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockFindOrCreateVehicle.mockRejectedValue(new Error("DB error"));

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({ success: false, error: "DB error" });
  });

  it("returns generic error for non-Error throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockFindOrCreateVehicle.mockRejectedValue("some string");

    const result = await findOrCreateVehicleAction(validInput());

    expect(result).toEqual({
      success: false,
      error: "Error al procesar el vehículo.",
    });
  });
});
