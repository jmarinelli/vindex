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

// ─── Vehicle Schemas ────────────────────────────────────────────────────────

export const vehicleEntrySchema = z.object({
  vin: z
    .string()
    .length(17, "El VIN debe tener 17 caracteres.")
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, "El VIN contiene caracteres inválidos."),
  make: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  trim: z.string().max(100).optional().nullable(),
  plate: z.string().max(20).optional().nullable(),
});

// ─── Inspection Metadata Schemas ────────────────────────────────────────────

export const inspectionTypeValues = [
  "pre_purchase",
  "intake",
  "periodic",
  "other",
] as const;

export const requestedByValues = [
  "buyer",
  "seller",
  "agency",
  "other",
] as const;

export const createInspectionSchema = z.object({
  vehicleId: z.string().uuid("ID de vehículo inválido."),
  inspectionType: z.enum(inspectionTypeValues, {
    error: "Tipo de inspección inválido.",
  }),
  requestedBy: z.enum(requestedByValues, {
    error: "Valor de 'solicitada por' inválido.",
  }),
  odometerKm: z
    .number()
    .int("El kilometraje debe ser un número entero.")
    .min(1, "Ingresá un kilometraje válido."),
  eventDate: z.string().min(1, "La fecha es requerida."),
});

// ─── Photo Schemas ─────────────────────────────────────────────────────────

export const photoTypeValues = ["finding", "vehicle"] as const;

export const uploadPhotoSchema = z.object({
  eventId: z.string().uuid("ID de evento inválido."),
  findingId: z.string().uuid("ID de hallazgo inválido.").optional().nullable(),
  photoType: z.enum(photoTypeValues, {
    error: "Tipo de foto inválido.",
  }),
  url: z.string().url("URL de foto inválida."),
  caption: z.string().max(500).optional().nullable(),
});

// ─── Finding Schemas ────────────────────────────────────────────────────────

export const findingStatusValues = [
  "good",
  "attention",
  "critical",
  "not_evaluated",
] as const;

export const updateFindingSchema = z.object({
  findingId: z.string().uuid("ID de hallazgo inválido."),
  status: z
    .enum(findingStatusValues, {
      error: "Estado de hallazgo inválido.",
    })
    .optional(),
  observation: z.string().optional().nullable(),
});

// ─── Signing Schemas ───────────────────────────────────────────────────────

export const signInspectionSchema = z.object({
  eventId: z.string().uuid("ID de inspección inválido."),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type TemplateItem = z.infer<typeof templateItemSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type VehicleEntryInput = z.infer<typeof vehicleEntrySchema>;
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type UpdateFindingInput = z.infer<typeof updateFindingSchema>;
export type SignInspectionInput = z.infer<typeof signInspectionSchema>;
export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;
