import { z } from "zod";

// ─── Template Section & Item Schemas ────────────────────────────────────────

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const templateItemSchema = z.object({
  id: z.string().regex(uuidRegex, "ID de item inválido"),
  name: z.string().min(1, "El nombre del item no puede estar vacío").max(255),
  order: z.number().int().min(0),
  type: z.enum(["checklist_item", "free_text"]),
});

export const templateSectionSchema = z.object({
  id: z.string().regex(uuidRegex, "ID de sección inválido"),
  name: z
    .string()
    .min(1, "El nombre de la sección no puede estar vacío")
    .max(255),
  order: z.number().int().min(0),
  items: z.array(templateItemSchema),
});

export const updateTemplateSchema = z.object({
  templateId: z.string().uuid(),
  name: z
    .string()
    .min(1, "El nombre del template no puede estar vacío")
    .max(255),
  sections: z
    .array(templateSectionSchema)
    .min(1, "El template debe tener al menos una sección"),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type TemplateItem = z.infer<typeof templateItemSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
