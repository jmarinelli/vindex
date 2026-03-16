import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  vehicles,
  events,
  nodes,
  inspectionDetails,
  inspectionFindings,
  eventPhotos,
} from "@/db/schema";
import type {
  Vehicle,
  Event,
  Node,
  InspectionDetail,
  InspectionFinding,
} from "@/db/schema";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VehicleEventItem {
  event: Event;
  node: Node;
  detail: InspectionDetail;
  findingCounts: {
    good: number;
    attention: number;
    critical: number;
  };
  photoCount: number;
  correction: { slug: string } | null;
  correctionOf: { slug: string } | null;
}

export interface VehiclePageData {
  vehicle: Vehicle;
}

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
 * Count the number of signed inspections for a vehicle.
 */
export async function countVehicleInspections(vehicleId: string): Promise<number> {
  const result = await db
    .select()
    .from(events)
    .where(
      and(eq(events.vehicleId, vehicleId), eq(events.status, "signed"))
    );
  return result.length;
}

/**
 * Get a vehicle's page data by VIN.
 * Returns null if no vehicle with that VIN exists.
 */
export async function getVehiclePage(vin: string): Promise<VehiclePageData | null> {
  const vehicle = await findVehicleByVin(vin);
  if (!vehicle) return null;
  return { vehicle };
}

/**
 * Get signed events for a vehicle, sorted by signed_at descending (newest first).
 * Includes node info, finding counts, photo counts, and correction relationships.
 * Supports pagination via offset and limit.
 */
export async function getVehicleEvents(
  vehicleId: string,
  offset: number = 0,
  limit: number = 10
): Promise<{ events: VehicleEventItem[]; total: number }> {
  // Get total count of signed events
  const [countResult] = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(eq(events.vehicleId, vehicleId), eq(events.status, "signed"))
    );

  const total = countResult?.count ?? 0;

  if (total === 0) {
    return { events: [], total: 0 };
  }

  // Get paginated signed events with node and detail
  const results = await db
    .select({
      event: events,
      node: nodes,
      detail: inspectionDetails,
    })
    .from(events)
    .innerJoin(nodes, eq(nodes.id, events.nodeId))
    .innerJoin(inspectionDetails, eq(inspectionDetails.eventId, events.id))
    .where(and(eq(events.vehicleId, vehicleId), eq(events.status, "signed")))
    .orderBy(desc(events.signedAt))
    .offset(offset)
    .limit(limit);

  if (results.length === 0) {
    return { events: [], total };
  }

  // Get findings and photos for these events
  const eventIds = results.map((r) => r.event.id);

  const inClause =
    eventIds.length === 1
      ? eq(inspectionFindings.eventId, eventIds[0])
      : sql`${inspectionFindings.eventId} IN (${sql.join(
          eventIds.map((id) => sql`${id}`),
          sql`, `
        )})`;

  const photoInClause =
    eventIds.length === 1
      ? eq(eventPhotos.eventId, eventIds[0])
      : sql`${eventPhotos.eventId} IN (${sql.join(
          eventIds.map((id) => sql`${id}`),
          sql`, `
        )})`;

  const [allFindings, allPhotos] = await Promise.all([
    db.select().from(inspectionFindings).where(inClause),
    db.select().from(eventPhotos).where(photoInClause),
  ]);

  // Group findings by event
  const findingsByEvent = new Map<string, InspectionFinding[]>();
  for (const f of allFindings) {
    const arr = findingsByEvent.get(f.eventId) ?? [];
    arr.push(f);
    findingsByEvent.set(f.eventId, arr);
  }

  // Group photo counts by event
  const photosByEvent = new Map<string, number>();
  for (const p of allPhotos) {
    photosByEvent.set(p.eventId, (photosByEvent.get(p.eventId) ?? 0) + 1);
  }

  // Check correction relationships for all events
  // 1. Find corrections pointing to any of our events (has_correction)
  const correctionOfClause =
    eventIds.length === 1
      ? eq(events.correctionOfId, eventIds[0])
      : sql`${events.correctionOfId} IN (${sql.join(
          eventIds.map((id) => sql`${id}`),
          sql`, `
        )})`;

  const corrections = await db
    .select({ id: events.id, slug: events.slug, correctionOfId: events.correctionOfId })
    .from(events)
    .where(and(correctionOfClause, eq(events.status, "signed")));

  // Map: originalEventId -> correction slug
  const correctionMap = new Map<string, string>();
  for (const c of corrections) {
    if (c.correctionOfId) {
      correctionMap.set(c.correctionOfId, c.slug);
    }
  }

  // 2. For events that are corrections, find their originals
  const correctionOfIds = results
    .filter((r) => r.event.correctionOfId)
    .map((r) => r.event.correctionOfId!);

  const originalMap = new Map<string, string>();
  if (correctionOfIds.length > 0) {
    const originalClause =
      correctionOfIds.length === 1
        ? eq(events.id, correctionOfIds[0])
        : sql`${events.id} IN (${sql.join(
            correctionOfIds.map((id) => sql`${id}`),
            sql`, `
          )})`;

    const originals = await db
      .select({ id: events.id, slug: events.slug })
      .from(events)
      .where(originalClause);

    for (const o of originals) {
      originalMap.set(o.id, o.slug);
    }
  }

  const vehicleEvents: VehicleEventItem[] = results.map((r) => {
    const findings = findingsByEvent.get(r.event.id) ?? [];
    const correctionSlug = correctionMap.get(r.event.id);
    const originalSlug = r.event.correctionOfId
      ? originalMap.get(r.event.correctionOfId) ?? null
      : null;

    return {
      event: r.event,
      node: r.node,
      detail: r.detail,
      findingCounts: {
        good: findings.filter((f) => f.status === "good").length,
        attention: findings.filter((f) => f.status === "attention").length,
        critical: findings.filter((f) => f.status === "critical").length,
      },
      photoCount: photosByEvent.get(r.event.id) ?? 0,
      correction: correctionSlug ? { slug: correctionSlug } : null,
      correctionOf: originalSlug ? { slug: originalSlug } : null,
    };
  });

  return { events: vehicleEvents, total };
}
