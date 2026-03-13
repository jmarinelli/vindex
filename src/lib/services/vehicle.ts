import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import type { Vehicle } from "@/db/schema";

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Find a vehicle by VIN. Returns the vehicle if found, null otherwise.
 */
export async function findVehicleByVin(vin: string): Promise<Vehicle | null> {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.vin, vin.toUpperCase()))
    .limit(1);

  return vehicle ?? null;
}

/**
 * Find or create a vehicle by VIN.
 * If found, updates optional fields (make, model, year, trim, plate) if provided.
 * If not found, creates a new vehicle record.
 */
export async function findOrCreateVehicle(params: {
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  trim?: string | null;
  plate?: string | null;
  nodeId: string;
}): Promise<{ vehicle: Vehicle; isNew: boolean }> {
  const vin = params.vin.toUpperCase();

  const existing = await findVehicleByVin(vin);

  if (existing) {
    // Update optional fields if provided
    const updates: Record<string, unknown> = {};
    if (params.make !== undefined && params.make !== null)
      updates.make = params.make;
    if (params.model !== undefined && params.model !== null)
      updates.model = params.model;
    if (params.year !== undefined && params.year !== null)
      updates.year = params.year;
    if (params.trim !== undefined && params.trim !== null)
      updates.trim = params.trim;
    if (params.plate !== undefined && params.plate !== null)
      updates.plate = params.plate;

    if (Object.keys(updates).length > 0) {
      await db.update(vehicles).set(updates).where(eq(vehicles.id, existing.id));
    }

    // Re-fetch to get updated data
    const [updated] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, existing.id))
      .limit(1);

    return { vehicle: updated, isNew: false };
  }

  // Create new vehicle
  const [created] = await db
    .insert(vehicles)
    .values({
      vin,
      make: params.make ?? null,
      model: params.model ?? null,
      year: params.year ?? null,
      trim: params.trim ?? null,
      plate: params.plate ?? null,
      createdByNodeId: params.nodeId,
    })
    .returning();

  return { vehicle: created, isNew: true };
}

/**
 * Count the number of events (inspections) for a vehicle.
 */
export async function countVehicleInspections(vehicleId: string): Promise<number> {
  const { events } = await import("@/db/schema");
  const result = await db
    .select()
    .from(events)
    .where(eq(events.vehicleId, vehicleId));
  return result.length;
}
