import { eq, and, sql, or } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  inspectionDetails,
  inspectionFindings,
  inspectionTemplates,
  eventPhotos,
  nodeMembers,
  vehicles,
  users,
  nodes,
} from "@/db/schema";
import type {
  Event,
  InspectionDetail,
  InspectionFinding,
  EventPhoto,
  Vehicle,
  Node,
} from "@/db/schema";
import { generateSlug } from "@/lib/slug";
import type { TemplateSection } from "@/lib/validators";
import type { TemplateSnapshot, FindingStatus } from "@/types/inspection";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateInspectionParams {
  vehicleId: string;
  nodeId: string;
  userId: string;
  inspectionType: "pre_purchase" | "intake" | "periodic" | "other";
  requestedBy: "buyer" | "seller" | "agency" | "other";
  odometerKm: number;
  eventDate: string;
}

export interface InspectionDraft {
  event: Event;
  detail: InspectionDetail;
  findings: InspectionFinding[];
  templateSnapshot: TemplateSnapshot;
}

export interface SignedEventResult {
  id: string;
  slug: string;
  signedAt: Date | null;
}

export interface InspectionReviewData {
  event: Event;
  detail: InspectionDetail;
  findings: InspectionFinding[];
  photos: EventPhoto[];
  vehicle: Vehicle;
  templateSnapshot: TemplateSnapshot;
}

export interface SignedInspectionData {
  event: Event;
  vehicle: Vehicle;
  signerName: string;
  findings: InspectionFinding[];
  templateSnapshot: TemplateSnapshot;
}

export interface PublicReportData {
  event: Event;
  vehicle: Vehicle;
  node: Node;
  detail: InspectionDetail;
  signerName: string;
  findings: InspectionFinding[];
  photos: EventPhoto[];
  templateSnapshot: TemplateSnapshot;
  correction: { slug: string } | null;
  correctionOf: { slug: string } | null;
}

export interface InspectionListItem {
  event: Event;
  vehicle: Vehicle;
  detail: InspectionDetail;
  findingCounts: {
    total: number;
    evaluated: number;
    good: number;
    attention: number;
    critical: number;
  };
  photoCount: number;
  observationCount: number;
}

export interface GetInspectionsParams {
  nodeId: string;
  search?: string;
  status?: "draft" | "signed" | "all";
}

// ─── Immutability Guard ─────────────────────────────────────────────────────

/**
 * Assert that the event is still mutable (status = 'draft').
 * Throws if the event is signed or not found.
 * Used by all mutation functions to enforce post-signing immutability.
 */
export async function assertEventIsMutable(eventId: string): Promise<Event> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new Error("Evento no encontrado.");
  }

  if (event.status === "signed") {
    throw new Error("No se puede modificar una inspección firmada.");
  }

  return event;
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Create a new inspection: event + detail + findings for all template items.
 * Snapshots the current template.
 */
export async function createInspection(
  params: CreateInspectionParams
): Promise<InspectionDraft> {
  // Verify user is node member
  const [membership] = await db
    .select()
    .from(nodeMembers)
    .where(
      and(
        eq(nodeMembers.nodeId, params.nodeId),
        eq(nodeMembers.userId, params.userId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new Error("No tenés permiso para crear inspecciones en este nodo.");
  }

  // Get the node's template
  const [template] = await db
    .select()
    .from(inspectionTemplates)
    .where(eq(inspectionTemplates.nodeId, params.nodeId))
    .limit(1);

  if (!template) {
    throw new Error("No hay un template configurado para este nodo.");
  }

  const sections = (template.sections as { sections: TemplateSection[] })
    .sections;

  const templateSnapshot: TemplateSnapshot = {
    templateId: template.id,
    templateName: template.name,
    sections,
  };

  // Generate unique slug
  const slug = generateSlug(8);

  // Create event
  const [event] = await db
    .insert(events)
    .values({
      vehicleId: params.vehicleId,
      nodeId: params.nodeId,
      eventType: "inspection",
      odometerKm: params.odometerKm,
      eventDate: params.eventDate,
      status: "draft",
      slug,
    })
    .returning();

  // Create inspection detail
  const [detail] = await db
    .insert(inspectionDetails)
    .values({
      eventId: event.id,
      templateSnapshot,
      inspectionType: params.inspectionType,
      requestedBy: params.requestedBy,
    })
    .returning();

  // Create findings for every item in the template
  const findingValues: Array<{
    eventId: string;
    sectionId: string;
    itemId: string;
    status: "not_evaluated";
  }> = [];

  for (const section of sections) {
    for (const item of section.items) {
      findingValues.push({
        eventId: event.id,
        sectionId: section.id,
        itemId: item.id,
        status: "not_evaluated",
      });
    }
  }

  let findings: InspectionFinding[] = [];
  if (findingValues.length > 0) {
    findings = await db
      .insert(inspectionFindings)
      .values(findingValues)
      .returning();
  }

  return { event, detail, findings, templateSnapshot };
}

/**
 * Get a draft inspection by event ID.
 * Returns null if not found.
 */
export async function getDraft(
  eventId: string,
  nodeId: string
): Promise<InspectionDraft | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.nodeId, nodeId)))
    .limit(1);

  if (!event || event.status !== "draft") return null;

  const [detail] = await db
    .select()
    .from(inspectionDetails)
    .where(eq(inspectionDetails.eventId, eventId))
    .limit(1);

  if (!detail) return null;

  const findings = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.eventId, eventId));

  const templateSnapshot = detail.templateSnapshot as TemplateSnapshot;

  return { event, detail, findings, templateSnapshot };
}

/**
 * Update a single finding's status and/or observation.
 * Rejects updates on signed events.
 */
export async function updateFinding(params: {
  findingId: string;
  nodeId: string;
  userId: string;
  status?: FindingStatus;
  observation?: string | null;
}): Promise<InspectionFinding> {
  // Get the finding
  const [finding] = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.id, params.findingId))
    .limit(1);

  if (!finding) {
    throw new Error("Hallazgo no encontrado.");
  }

  // Immutability guard + existence check
  const event = await assertEventIsMutable(finding.eventId);

  if (event.nodeId !== params.nodeId) {
    throw new Error("No tenés permiso para modificar este hallazgo.");
  }

  // Build update set
  const updates: Record<string, unknown> = {};
  if (params.status !== undefined) updates.status = params.status;
  if (params.observation !== undefined) updates.observation = params.observation;

  if (Object.keys(updates).length === 0) {
    return finding;
  }

  const [updated] = await db
    .update(inspectionFindings)
    .set(updates)
    .where(eq(inspectionFindings.id, params.findingId))
    .returning();

  return updated;
}

/**
 * Sign an inspection: validate completeness, set signed_at + signed_by_user_id + status.
 * This is irreversible — once signed, the event and all related data become immutable.
 */
export async function signInspection(
  eventId: string,
  userId: string
): Promise<Event> {
  // 1. Fetch event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new Error("La inspección no fue encontrada.");
  }

  if (event.status === "signed") {
    throw new Error("Esta inspección ya fue firmada.");
  }

  if (event.eventType !== "inspection") {
    throw new Error("Solo se pueden firmar inspecciones.");
  }

  // 2. Authorization — user must be active node member
  const [membership] = await db
    .select()
    .from(nodeMembers)
    .where(
      and(
        eq(nodeMembers.nodeId, event.nodeId),
        eq(nodeMembers.userId, userId),
        eq(nodeMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) {
    throw new Error("No tenés permisos para firmar esta inspección.");
  }

  // 3. Get inspection detail (template snapshot)
  const [detail] = await db
    .select()
    .from(inspectionDetails)
    .where(eq(inspectionDetails.eventId, eventId))
    .limit(1);

  if (!detail) {
    throw new Error("La inspección no tiene detalle asociado.");
  }

  // 4. Completeness validation — all checklist_item findings must be evaluated
  const templateSnapshot = detail.templateSnapshot as TemplateSnapshot;
  const findings = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.eventId, eventId));

  // Build a map for quick finding lookup
  const findingMap = new Map<string, InspectionFinding>();
  for (const f of findings) {
    findingMap.set(`${f.sectionId}:${f.itemId}`, f);
  }

  for (const section of templateSnapshot.sections) {
    for (const item of section.items) {
      if (item.type !== "checklist_item") continue;

      const finding = findingMap.get(`${section.id}:${item.id}`);
      if (!finding || finding.status === "not_evaluated") {
        throw new Error(
          "Hay items sin evaluar. Completá todos los items de checklist antes de firmar."
        );
      }
    }
  }

  // 5. Atomic signing with row lock to prevent concurrent signing
  const [signed] = await db
    .update(events)
    .set({
      status: "signed",
      signedAt: sql`now()`,
      signedByUserId: userId,
      updatedAt: sql`now()`,
    })
    .where(and(eq(events.id, eventId), eq(events.status, "draft")))
    .returning();

  if (!signed) {
    throw new Error("Esta inspección ya fue firmada.");
  }

  return signed;
}

/**
 * Get full inspection data for the review summary page (Step 4A).
 * Includes vehicle info and photos. Works for draft events only.
 */
export async function getInspectionForReview(
  eventId: string,
  nodeId: string
): Promise<InspectionReviewData | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.nodeId, nodeId)))
    .limit(1);

  if (!event) return null;

  const [detail] = await db
    .select()
    .from(inspectionDetails)
    .where(eq(inspectionDetails.eventId, eventId))
    .limit(1);

  if (!detail) return null;

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, event.vehicleId))
    .limit(1);

  if (!vehicle) return null;

  const findings = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.eventId, eventId));

  const photos = await db
    .select()
    .from(eventPhotos)
    .where(eq(eventPhotos.eventId, eventId));

  const templateSnapshot = detail.templateSnapshot as TemplateSnapshot;

  return { event, detail, findings, photos, vehicle, templateSnapshot };
}

/**
 * Get signed inspection data for the confirmation page (Step 4B).
 * Returns null if event is not signed or not found.
 */
export async function getSignedInspection(
  eventId: string,
  nodeId: string
): Promise<SignedInspectionData | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.nodeId, nodeId)))
    .limit(1);

  if (!event || event.status !== "signed") return null;

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, event.vehicleId))
    .limit(1);

  if (!vehicle) return null;

  // Get signer name
  let signerName = "Inspector";
  if (event.signedByUserId) {
    const [signer] = await db
      .select()
      .from(users)
      .where(eq(users.id, event.signedByUserId))
      .limit(1);
    if (signer) signerName = signer.displayName;
  }

  const [detail] = await db
    .select()
    .from(inspectionDetails)
    .where(eq(inspectionDetails.eventId, eventId))
    .limit(1);

  if (!detail) return null;

  const findings = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.eventId, eventId));

  const templateSnapshot = detail.templateSnapshot as TemplateSnapshot;

  return { event, vehicle, signerName, findings, templateSnapshot };
}

/**
 * Get full public report data by slug.
 * Returns null if event is not found, not signed, or slug doesn't match.
 * No auth required — public page.
 */
export async function getPublicReport(
  slug: string
): Promise<PublicReportData | null> {
  // 1. Find event by slug
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event) return null;

  // Only show signed events publicly
  if (event.status !== "signed") return null;

  // 2. Fetch all related data in parallel
  const [vehicleResult, nodeResult, detailResult, findingsResult, photosResult] =
    await Promise.all([
      db.select().from(vehicles).where(eq(vehicles.id, event.vehicleId)).limit(1),
      db.select().from(nodes).where(eq(nodes.id, event.nodeId)).limit(1),
      db.select().from(inspectionDetails).where(eq(inspectionDetails.eventId, event.id)).limit(1),
      db.select().from(inspectionFindings).where(eq(inspectionFindings.eventId, event.id)),
      db.select().from(eventPhotos).where(eq(eventPhotos.eventId, event.id)),
    ]);

  const vehicle = vehicleResult[0];
  const node = nodeResult[0];
  const detail = detailResult[0];

  if (!vehicle || !node || !detail) return null;

  // 3. Get signer name
  let signerName = "Inspector";
  if (event.signedByUserId) {
    const [signer] = await db
      .select()
      .from(users)
      .where(eq(users.id, event.signedByUserId))
      .limit(1);
    if (signer) signerName = signer.displayName;
  }

  // 4. Check for corrections (both directions)
  let correction: { slug: string } | null = null;
  let correctionOf: { slug: string } | null = null;

  // Check if another event corrects this one
  const [correctionEvent] = await db
    .select({ slug: events.slug })
    .from(events)
    .where(
      and(
        eq(events.correctionOfId, event.id),
        eq(events.status, "signed")
      )
    )
    .limit(1);

  if (correctionEvent) {
    correction = { slug: correctionEvent.slug };
  }

  // Check if this event is a correction of another
  if (event.correctionOfId) {
    const [originalEvent] = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.id, event.correctionOfId))
      .limit(1);

    if (originalEvent) {
      correctionOf = { slug: originalEvent.slug };
    }
  }

  const templateSnapshot = detail.templateSnapshot as TemplateSnapshot;

  return {
    event,
    vehicle,
    node,
    detail,
    signerName,
    findings: findingsResult,
    photos: photosResult,
    templateSnapshot,
    correction,
    correctionOf,
  };
}

/**
 * Create a correction draft linked to a signed original event.
 * Copies template snapshot, findings (status + observation), and metadata.
 * Does NOT copy photos.
 */
export async function createCorrection(
  originalEventId: string,
  userId: string
): Promise<Event> {
  // 1. Fetch original event
  const [originalEvent] = await db
    .select()
    .from(events)
    .where(eq(events.id, originalEventId))
    .limit(1);

  if (!originalEvent) {
    throw new Error("La inspección no fue encontrada.");
  }

  if (originalEvent.status !== "signed") {
    throw new Error("Solo se pueden corregir inspecciones firmadas.");
  }

  if (originalEvent.eventType !== "inspection") {
    throw new Error("Solo se pueden corregir inspecciones.");
  }

  // 2. Authorization — user must be active node member
  const [membership] = await db
    .select()
    .from(nodeMembers)
    .where(
      and(
        eq(nodeMembers.nodeId, originalEvent.nodeId),
        eq(nodeMembers.userId, userId),
        eq(nodeMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) {
    throw new Error("No tenés permisos para corregir esta inspección.");
  }

  // 3. Fetch original detail and findings
  const [originalDetail] = await db
    .select()
    .from(inspectionDetails)
    .where(eq(inspectionDetails.eventId, originalEventId))
    .limit(1);

  if (!originalDetail) {
    throw new Error("La inspección no tiene detalle asociado.");
  }

  const originalFindings = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.eventId, originalEventId));

  // 4. Generate unique slug
  const slug = generateSlug(8);

  // 5. Create correction event, detail, and findings
  const [correctionEvent] = await db
    .insert(events)
    .values({
      vehicleId: originalEvent.vehicleId,
      nodeId: originalEvent.nodeId,
      eventType: "inspection",
      odometerKm: originalEvent.odometerKm,
      eventDate: originalEvent.eventDate,
      status: "draft",
      slug,
      correctionOfId: originalEventId,
    })
    .returning();

  await db.insert(inspectionDetails).values({
    eventId: correctionEvent.id,
    templateSnapshot: originalDetail.templateSnapshot,
    inspectionType: originalDetail.inspectionType,
    requestedBy: originalDetail.requestedBy,
  });

  if (originalFindings.length > 0) {
    await db.insert(inspectionFindings).values(
      originalFindings.map((f) => ({
        eventId: correctionEvent.id,
        sectionId: f.sectionId,
        itemId: f.itemId,
        status: f.status,
        observation: f.observation,
      }))
    );
  }

  return correctionEvent;
}

/**
 * Get all inspections for a node, with optional search and status filter.
 * Returns inspection list items sorted: drafts first (by updated_at desc),
 * then signed (by signed_at desc).
 */
export async function getInspectionsForNode(
  params: GetInspectionsParams
): Promise<InspectionListItem[]> {
  // 1. Build where conditions
  const conditions = [eq(events.nodeId, params.nodeId)];

  if (params.status && params.status !== "all") {
    conditions.push(eq(events.status, params.status));
  }

  // 2. Fetch events with vehicles and details
  const results = await db
    .select({
      event: events,
      vehicle: vehicles,
      detail: inspectionDetails,
    })
    .from(events)
    .innerJoin(vehicles, eq(vehicles.id, events.vehicleId))
    .innerJoin(inspectionDetails, eq(inspectionDetails.eventId, events.id))
    .where(and(...conditions));

  // 3. Apply search filter in-memory (VIN, make, model, plate)
  let filtered = results;
  if (params.search && params.search.trim()) {
    const term = params.search.trim().toLowerCase();
    filtered = results.filter((r) => {
      const vin = r.vehicle.vin?.toLowerCase() ?? "";
      const make = r.vehicle.make?.toLowerCase() ?? "";
      const model = r.vehicle.model?.toLowerCase() ?? "";
      const plate = r.vehicle.plate?.toLowerCase() ?? "";
      return (
        vin.includes(term) ||
        make.includes(term) ||
        model.includes(term) ||
        plate.includes(term)
      );
    });
  }

  // 4. Get findings and photos for all events
  const eventIds = filtered.map((r) => r.event.id);

  if (eventIds.length === 0) return [];

  const [allFindings, allPhotos] = await Promise.all([
    db
      .select()
      .from(inspectionFindings)
      .where(
        eventIds.length === 1
          ? eq(inspectionFindings.eventId, eventIds[0])
          : or(...eventIds.map((id) => eq(inspectionFindings.eventId, id)))
      ),
    db
      .select()
      .from(eventPhotos)
      .where(
        eventIds.length === 1
          ? eq(eventPhotos.eventId, eventIds[0])
          : or(...eventIds.map((id) => eq(eventPhotos.eventId, id)))
      ),
  ]);

  // Group findings and photos by event
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

  // 5. Build list items
  const items: InspectionListItem[] = filtered.map((r) => {
    const findings = findingsByEvent.get(r.event.id) ?? [];
    const total = findings.length;
    const evaluated = findings.filter(
      (f) => f.status !== "not_evaluated"
    ).length;
    const good = findings.filter((f) => f.status === "good").length;
    const attention = findings.filter((f) => f.status === "attention").length;
    const critical = findings.filter((f) => f.status === "critical").length;
    const observationCount = findings.filter(
      (f) => f.observation && f.observation.trim().length > 0
    ).length;

    return {
      event: r.event,
      vehicle: r.vehicle,
      detail: r.detail,
      findingCounts: { total, evaluated, good, attention, critical },
      photoCount: photosByEvent.get(r.event.id) ?? 0,
      observationCount,
    };
  });

  // 6. Sort: drafts first by updated_at desc, then signed by signed_at desc
  items.sort((a, b) => {
    if (a.event.status === "draft" && b.event.status !== "draft") return -1;
    if (a.event.status !== "draft" && b.event.status === "draft") return 1;

    if (a.event.status === "draft" && b.event.status === "draft") {
      return (
        new Date(b.event.updatedAt).getTime() -
        new Date(a.event.updatedAt).getTime()
      );
    }

    // Both signed
    const aTime = a.event.signedAt
      ? new Date(a.event.signedAt).getTime()
      : 0;
    const bTime = b.event.signedAt
      ? new Date(b.event.signedAt).getTime()
      : 0;
    return bTime - aTime;
  });

  return items;
}
