import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { inspectionTemplates, nodeMembers } from "@/db/schema";
import type { TemplateSection } from "@/lib/validators";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TemplateData {
  id: string;
  nodeId: string;
  name: string;
  sections: TemplateSection[];
  updatedAt: Date;
}

// ─── Starter Template ────────────────────────────────────────────────────────

function buildStarterSections() {
  return {
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Sección de ejemplo 1",
        order: 1,
        items: [
          { id: crypto.randomUUID(), name: "Punto de verificación (checklist)", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Observación en texto libre", order: 2, type: "free_text" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Sección de ejemplo 2",
        order: 2,
        items: [
          { id: crypto.randomUUID(), name: "Otro punto de verificación", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Otra observación en texto libre", order: 2, type: "free_text" },
        ],
      },
    ],
  };
}

/**
 * Create a starter inspection template for a newly created node.
 */
export async function createStarterTemplate(nodeId: string): Promise<void> {
  await db.insert(inspectionTemplates).values({
    nodeId,
    name: "Inspección Pre-Compra Completa",
    sections: buildStarterSections(),
  });
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Get the inspection template for a given node.
 * Returns null if no template exists.
 */
export async function getTemplate(nodeId: string): Promise<TemplateData | null> {
  const [template] = await db
    .select()
    .from(inspectionTemplates)
    .where(eq(inspectionTemplates.nodeId, nodeId))
    .limit(1);

  if (!template) return null;

  const sections = (template.sections as { sections: TemplateSection[] })
    .sections;

  return {
    id: template.id,
    nodeId: template.nodeId,
    name: template.name,
    sections,
    updatedAt: template.updatedAt,
  };
}

/**
 * Update a template's name and sections.
 * Verifies the user is a member of the template's node.
 * Throws on authorization or validation failures.
 */
export async function updateTemplate(
  templateId: string,
  nodeId: string,
  userId: string,
  name: string,
  sections: TemplateSection[]
): Promise<{ updatedAt: Date }> {
  // Verify user is node member
  const [membership] = await db
    .select()
    .from(nodeMembers)
    .where(
      and(eq(nodeMembers.nodeId, nodeId), eq(nodeMembers.userId, userId))
    )
    .limit(1);

  if (!membership) {
    throw new Error("No tenés permiso para editar este template.");
  }

  // Verify template belongs to node
  const [template] = await db
    .select({ id: inspectionTemplates.id })
    .from(inspectionTemplates)
    .where(
      and(
        eq(inspectionTemplates.id, templateId),
        eq(inspectionTemplates.nodeId, nodeId)
      )
    )
    .limit(1);

  if (!template) {
    throw new Error("Template no encontrado.");
  }

  // Full replacement of sections JSON
  const now = new Date();
  await db
    .update(inspectionTemplates)
    .set({
      name,
      sections: { sections },
      updatedAt: now,
    })
    .where(eq(inspectionTemplates.id, templateId));

  return { updatedAt: now };
}
