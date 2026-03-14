import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  nodes,
  events,
  vehicles,
  inspectionDetails,
  inspectionFindings,
  eventPhotos,
} from "@/db/schema";
import type {
  Node,
  Event,
  Vehicle,
  InspectionDetail,
  InspectionFinding,
} from "@/db/schema";
import type { TemplateSnapshot } from "@/types/inspection";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NodeProfile {
  node: Node;
}

export interface NodeStats {
  inspectionCount: number;
  operatingSince: Date | null;
  avgPhotosPerReport: number;
  avgObservationsPerReport: number;
  avgSectionsPerReport: number;
}

export interface SignedReportItem {
  event: Event;
  vehicle: Vehicle;
  detail: InspectionDetail;
  findingCounts: {
    good: number;
    attention: number;
    critical: number;
  };
  photoCount: number;
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Get a node's profile by slug.
 * Returns null if the node is not found or not active.
 */
export async function getNodeProfile(slug: string): Promise<NodeProfile | null> {
  const [node] = await db
    .select()
    .from(nodes)
    .where(eq(nodes.slug, slug))
    .limit(1);

  if (!node || node.status !== "active") return null;

  return { node };
}

/**
 * Compute aggregated stats for a node based on its signed events.
 */
export async function getNodeStats(nodeId: string): Promise<NodeStats> {
  // Get all signed events for this node
  const signedEvents = await db
    .select()
    .from(events)
    .where(
      and(eq(events.nodeId, nodeId), eq(events.status, "signed"))
    );

  if (signedEvents.length === 0) {
    return {
      inspectionCount: 0,
      operatingSince: null,
      avgPhotosPerReport: 0,
      avgObservationsPerReport: 0,
      avgSectionsPerReport: 0,
    };
  }

  const inspectionCount = signedEvents.length;

  // Earliest signed_at
  const operatingSince = signedEvents.reduce<Date | null>((earliest, e) => {
    if (!e.signedAt) return earliest;
    const d = new Date(e.signedAt);
    return !earliest || d < earliest ? d : earliest;
  }, null);

  // Get all findings and photos for these events
  const eventIds = signedEvents.map((e) => e.id);

  const [allFindings, allPhotos, allDetails] = await Promise.all([
    db
      .select()
      .from(inspectionFindings)
      .where(
        eventIds.length === 1
          ? eq(inspectionFindings.eventId, eventIds[0])
          : sql`${inspectionFindings.eventId} IN (${sql.join(
              eventIds.map((id) => sql`${id}`),
              sql`, `
            )})`
      ),
    db
      .select()
      .from(eventPhotos)
      .where(
        eventIds.length === 1
          ? eq(eventPhotos.eventId, eventIds[0])
          : sql`${eventPhotos.eventId} IN (${sql.join(
              eventIds.map((id) => sql`${id}`),
              sql`, `
            )})`
      ),
    db
      .select()
      .from(inspectionDetails)
      .where(
        eventIds.length === 1
          ? eq(inspectionDetails.eventId, eventIds[0])
          : sql`${inspectionDetails.eventId} IN (${sql.join(
              eventIds.map((id) => sql`${id}`),
              sql`, `
            )})`
      ),
  ]);

  // Avg photos per report
  const photosByEvent = new Map<string, number>();
  for (const p of allPhotos) {
    photosByEvent.set(p.eventId, (photosByEvent.get(p.eventId) ?? 0) + 1);
  }
  const totalPhotos = allPhotos.length;
  const avgPhotosPerReport =
    Math.round((totalPhotos / inspectionCount) * 10) / 10;

  // Avg observations per report (non-empty observation text)
  const observationsByEvent = new Map<string, number>();
  for (const f of allFindings) {
    if (f.observation && f.observation.trim().length > 0) {
      observationsByEvent.set(
        f.eventId,
        (observationsByEvent.get(f.eventId) ?? 0) + 1
      );
    }
  }
  const totalObservations = Array.from(observationsByEvent.values()).reduce(
    (sum, c) => sum + c,
    0
  );
  const avgObservationsPerReport =
    Math.round((totalObservations / inspectionCount) * 10) / 10;

  // Avg sections per report (sections with at least one evaluated item)
  let totalSections = 0;
  for (const detail of allDetails) {
    const snapshot = detail.templateSnapshot as TemplateSnapshot;
    const eventFindings = allFindings.filter(
      (f) => f.eventId === detail.eventId
    );
    const findingMap = new Map<string, InspectionFinding[]>();
    for (const f of eventFindings) {
      const arr = findingMap.get(f.sectionId) ?? [];
      arr.push(f);
      findingMap.set(f.sectionId, arr);
    }
    for (const section of snapshot.sections) {
      const sectionFindings = findingMap.get(section.id) ?? [];
      const hasEvaluated = sectionFindings.some(
        (f) => f.status !== "not_evaluated" && f.status !== null
      );
      if (hasEvaluated) totalSections++;
    }
  }
  const avgSectionsPerReport =
    Math.round((totalSections / inspectionCount) * 10) / 10;

  return {
    inspectionCount,
    operatingSince,
    avgPhotosPerReport,
    avgObservationsPerReport,
    avgSectionsPerReport,
  };
}

/**
 * Get signed reports for a node, sorted by signed_at descending.
 * Supports pagination via offset and limit.
 */
export async function getSignedReports(
  nodeId: string,
  offset: number = 0,
  limit: number = 10
): Promise<{ reports: SignedReportItem[]; total: number }> {
  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(eq(events.nodeId, nodeId), eq(events.status, "signed"))
    );

  const total = countResult?.count ?? 0;

  if (total === 0) {
    return { reports: [], total: 0 };
  }

  // Get paginated signed events with vehicle and detail
  const results = await db
    .select({
      event: events,
      vehicle: vehicles,
      detail: inspectionDetails,
    })
    .from(events)
    .innerJoin(vehicles, eq(vehicles.id, events.vehicleId))
    .innerJoin(inspectionDetails, eq(inspectionDetails.eventId, events.id))
    .where(and(eq(events.nodeId, nodeId), eq(events.status, "signed")))
    .orderBy(desc(events.signedAt))
    .offset(offset)
    .limit(limit);

  if (results.length === 0) {
    return { reports: [], total };
  }

  // Get findings and photos for these events
  const eventIds = results.map((r) => r.event.id);

  const [allFindings, allPhotos] = await Promise.all([
    db
      .select()
      .from(inspectionFindings)
      .where(
        eventIds.length === 1
          ? eq(inspectionFindings.eventId, eventIds[0])
          : sql`${inspectionFindings.eventId} IN (${sql.join(
              eventIds.map((id) => sql`${id}`),
              sql`, `
            )})`
      ),
    db
      .select()
      .from(eventPhotos)
      .where(
        eventIds.length === 1
          ? eq(eventPhotos.eventId, eventIds[0])
          : sql`${eventPhotos.eventId} IN (${sql.join(
              eventIds.map((id) => sql`${id}`),
              sql`, `
            )})`
      ),
  ]);

  // Group by event
  const findingsByEvent = new Map<string, InspectionFinding[]>();
  for (const f of allFindings) {
    const arr = findingsByEvent.get(f.eventId) ?? [];
    arr.push(f);
    findingsByEvent.set(f.eventId, arr);
  }

  const photosByEvent = new Map<string, number>();
  for (const p of allPhotos) {
    photosByEvent.set(p.eventId, (photosByEvent.get(p.eventId) ?? 0) + 1);
  }

  const reports: SignedReportItem[] = results.map((r) => {
    const findings = findingsByEvent.get(r.event.id) ?? [];
    return {
      event: r.event,
      vehicle: r.vehicle,
      detail: r.detail,
      findingCounts: {
        good: findings.filter((f) => f.status === "good").length,
        attention: findings.filter((f) => f.status === "attention").length,
        critical: findings.filter((f) => f.status === "critical").length,
      },
      photoCount: photosByEvent.get(r.event.id) ?? 0,
    };
  });

  return { reports, total };
}
