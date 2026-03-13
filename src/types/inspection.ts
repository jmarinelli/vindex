import type { TemplateSection } from "@/lib/validators";

// ─── Template Snapshot ──────────────────────────────────────────────────────

export interface TemplateSnapshot {
  templateId: string;
  templateName: string;
  sections: TemplateSection[];
}

// ─── Draft types (used by Dexie and UI) ─────────────────────────────────────

export type FindingStatus = "good" | "attention" | "critical" | "not_evaluated";

export interface DraftFinding {
  id: string;
  eventId: string;
  sectionId: string;
  itemId: string;
  status: FindingStatus;
  observation: string | null;
}

export interface DraftPhoto {
  id: string;
  eventId: string;
  findingId: string | null;
  blob?: Blob;
  url: string | null;
  caption: string | null;
  order: number;
  uploaded: boolean;
}

export interface DraftInspection {
  id: string; // event ID
  vehicleId: string;
  nodeId: string;
  vehicleName: string; // "{Make} {Model} {Year}"
  inspectionType: string;
  requestedBy: string;
  odometerKm: number;
  eventDate: string;
  slug: string;
  templateSnapshot: TemplateSnapshot;
  findings: DraftFinding[];
  photos: DraftPhoto[];
  lastSectionIndex: number;
  updatedAt: string;
  syncedAt: string | null;
}
