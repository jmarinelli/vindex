import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  inspectionDetails,
  inspectionFindings,
  inspectionTemplates,
  nodeMembers,
} from "@/db/schema";
import type {
  Event,
  InspectionDetail,
  InspectionFinding,
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
  // Get the finding and its event
  const [finding] = await db
    .select()
    .from(inspectionFindings)
    .where(eq(inspectionFindings.id, params.findingId))
    .limit(1);

  if (!finding) {
    throw new Error("Hallazgo no encontrado.");
  }

  // Get the event to check status and authorization
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, finding.eventId))
    .limit(1);

  if (!event) {
    throw new Error("Evento no encontrado.");
  }

  if (event.status === "signed") {
    throw new Error("No se puede modificar una inspección firmada.");
  }

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
