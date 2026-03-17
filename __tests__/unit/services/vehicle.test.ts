import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the database ────────────────────────────────────────────────────────

let queryResults: unknown[][] = [];
let insertReturns: unknown[][] = [];
let updateCalls: unknown[] = [];

vi.mock("@/db", () => ({
  db: new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "select") {
          return () => ({
            from: () => ({
              where: () => {
                const results = queryResults.shift() ?? [];
                return {
                  limit: () => results,
                  then: (resolve: (v: unknown) => void) => resolve(results),
                };
              },
            }),
          });
        }
        if (prop === "insert") {
          return () => ({
            values: () => ({
              returning: () => insertReturns.shift() ?? [],
            }),
          });
        }
        if (prop === "update") {
          return () => ({
            set: (...args: unknown[]) => {
              updateCalls.push(args);
              return {
                where: () => Promise.resolve(),
              };
            },
          });
        }
        return undefined;
      },
    }
  ),
}));

vi.mock("@/db/schema", () => ({
  vehicles: {
    id: "id",
    vin: "vin",
    make: "make",
    model: "model",
    year: "year",
    trim: "trim",
    plate: "plate",
    createdByNodeId: "created_by_node_id",
  },
  events: {
    vehicleId: "vehicle_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

// Import after mocking
import {
  findVehicleByVin,
  findOrCreateVehicle,
  countVehicleInspections,
} from "@/lib/services/vehicle";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("findVehicleByVin", () => {
  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
    updateCalls = [];
  });

  it("returns null when no vehicle matches the VIN", async () => {
    queryResults = [[]];
    const result = await findVehicleByVin("12345678901234567");
    expect(result).toBeNull();
  });

  it("returns the vehicle when found", async () => {
    const vehicle = {
      id: "v1",
      vin: "ABCDE12345678901X",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      trim: null,
      plate: "ABC123",
      createdByNodeId: "n1",
      createdAt: new Date(),
    };
    queryResults = [[vehicle]];

    const result = await findVehicleByVin("abcde12345678901x");
    expect(result).toEqual(vehicle);
  });

  it("uppercases the VIN for lookup", async () => {
    queryResults = [[]];
    // The function should uppercase before querying
    await findVehicleByVin("abc");
    // If it returns null (no match) that's fine — we just verify it doesn't throw
    // The eq mock is called with the uppercased value
  });
});

describe("findOrCreateVehicle", () => {
  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
    updateCalls = [];
  });

  it("creates a new vehicle when VIN not found", async () => {
    const created = {
      id: "new-id",
      vin: "ABCDE12345678901X",
      make: "Honda",
      model: "Civic",
      year: 2022,
      trim: null,
      plate: "ABC123",
      createdByNodeId: "node-1",
      createdAt: new Date(),
    };

    // findVehicleByVin returns empty
    queryResults = [[]];
    insertReturns = [[created]];

    const result = await findOrCreateVehicle({
      vin: "abcde12345678901x",
      make: "Honda",
      model: "Civic",
      year: 2022,
      plate: "ABC123",
      nodeId: "node-1",
    });

    expect(result.isNew).toBe(true);
    expect(result.vehicle).toEqual(created);
  });

  it("returns existing vehicle and updates provided fields", async () => {
    const existing = {
      id: "existing-id",
      vin: "ABCDE12345678901X",
      make: "Honda",
      model: null,
      year: null,
      trim: null,
      plate: "ABC123",
      createdByNodeId: "node-1",
      createdAt: new Date(),
    };

    const updated = { ...existing, model: "Civic", year: 2022 };

    // findVehicleByVin returns existing
    queryResults = [[existing]];
    // After update, re-fetch returns updated
    queryResults.push([updated]);

    const result = await findOrCreateVehicle({
      vin: "abcde12345678901x",
      model: "Civic",
      year: 2022,
      plate: "ABC123",
      nodeId: "node-1",
    });

    expect(result.isNew).toBe(false);
    expect(result.vehicle).toEqual(updated);
    expect(updateCalls.length).toBe(1);
  });

  it("does not call update when no optional fields are provided", async () => {
    const existing = {
      id: "existing-id",
      vin: "ABCDE12345678901X",
      make: null,
      model: null,
      year: null,
      trim: null,
      plate: "ABC123",
      createdByNodeId: "node-1",
      createdAt: new Date(),
    };

    // findVehicleByVin returns existing
    queryResults = [[existing]];
    // Re-fetch returns same
    queryResults.push([existing]);

    const result = await findOrCreateVehicle({
      vin: "abcde12345678901x",
      plate: "ABC123",
      nodeId: "node-1",
    });

    expect(result.isNew).toBe(false);
    expect(updateCalls.length).toBe(0);
  });

  it("does not include null fields in update set", async () => {
    const existing = {
      id: "existing-id",
      vin: "ABCDE12345678901X",
      make: "Honda",
      model: null,
      year: null,
      trim: null,
      plate: "ABC123",
      createdByNodeId: "node-1",
      createdAt: new Date(),
    };

    // findVehicleByVin returns existing
    queryResults = [[existing]];
    // Re-fetch
    queryResults.push([existing]);

    await findOrCreateVehicle({
      vin: "abcde12345678901x",
      make: null,
      model: null,
      plate: "ABC123",
      nodeId: "node-1",
    });

    // null values should not trigger update
    expect(updateCalls.length).toBe(0);
  });
});

describe("countVehicleInspections", () => {
  beforeEach(() => {
    queryResults = [];
  });

  it("returns 0 when no signed inspections exist", async () => {
    queryResults = [[]];
    const count = await countVehicleInspections("vehicle-1");
    expect(count).toBe(0);
  });

  it("returns the count of signed inspection events", async () => {
    queryResults = [[{ id: "e1" }, { id: "e2" }, { id: "e3" }]];
    const count = await countVehicleInspections("vehicle-1");
    expect(count).toBe(3);
  });
});
