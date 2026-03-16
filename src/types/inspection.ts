import type { TemplateSection } from "@/lib/validators";

// ─── Template Snapshot ──────────────────────────────────────────────────────

export interface TemplateSnapshot {
  templateId: string;
  templateName: string;
  sections: TemplateSection[];
}

// ─── Draft types (used by Dexie and UI) ─────────────────────────────────────

export type FindingStatus = "good" | "attention" | "critical" | "not_evaluated" | "not_applicable";

export interface DraftFinding {
  id: string;
  eventId: string;
  sectionId: string;
  itemId: string;
  status: FindingStatus;
  observation: string | null;
  syncedAt: string | null;
}

export type PhotoType = "finding" | "vehicle";

export interface DraftPhoto {
  id: string;
  eventId: string;
  findingId: string | null;
  photoType: PhotoType;
  blob?: Blob;
  url: string | null;
  caption: string | null;
  order: number;
  uploaded: boolean;
  retries: number;
  /** Server-side event_photos.id — set after successful upload+save */
  serverPhotoId?: string;
  /** Soft-delete marker — photo pending server deletion via sync worker */
  deletedAt?: string | null;
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
  findingsSeeded: boolean;
  lastSectionIndex: number;
  updatedAt: string;
  syncedAt: string | null;
}
