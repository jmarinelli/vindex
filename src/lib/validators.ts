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
  url: z.string().url("URL de foto inválida.").max(500),
  caption: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0, "Orden inválido."),
});

export const deleteEventPhotoSchema = z.object({
  photoId: z.string().uuid("ID de foto inválido."),
});

// ─── Finding Schemas ────────────────────────────────────────────────────────

export const findingStatusValues = [
  "good",
  "attention",
  "critical",
  "not_evaluated",
  "not_applicable",
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

// ─── Review Schemas ───────────────────────────────────────────────────────

export const matchRatingValues = ["yes", "partially", "no"] as const;

export const submitReviewSchema = z.object({
  eventId: z.string().uuid("ID de inspección inválido."),
  matchRating: z.enum(matchRatingValues, {
    error: "Seleccioná una opción válida.",
  }),
  comment: z
    .string()
    .max(500, "El comentario no puede superar los 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

// ─── Correction Schemas ─────────────────────────────────────────────────────

export const createCorrectionSchema = z.object({
  eventId: z.string().uuid("ID de inspección inválido."),
});

// ─── Admin Node Schemas ─────────────────────────────────────────────────────

export const createNodeSchema = z.object({
  displayName: z
    .string()
    .min(1, "El nombre es obligatorio.")
    .max(255, "El nombre no puede superar los 255 caracteres."),
  type: z.enum(["inspector"]).default("inspector"),
  contactEmail: z
    .string()
    .min(1, "El email es obligatorio.")
    .email("Ingresá un email válido."),
  contactPhone: z.string().max(50, "El teléfono no puede superar los 50 caracteres.").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ingresá un color hexadecimal válido (ej: #3B82F6).")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateNodeSchema = z.object({
  nodeId: z.string().uuid("ID de nodo inválido."),
  displayName: z
    .string()
    .min(1, "El nombre es obligatorio.")
    .max(255, "El nombre no puede superar los 255 caracteres.")
    .optional(),
  contactEmail: z.string().email("Ingresá un email válido.").optional(),
  contactPhone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ingresá un color hexadecimal válido (ej: #3B82F6).")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "suspended"]).optional(),
});

// ─── Admin User Schemas ─────────────────────────────────────────────────────

export const createUserSchema = z.object({
  displayName: z
    .string()
    .min(1, "El nombre es obligatorio.")
    .max(255, "El nombre no puede superar los 255 caracteres."),
  email: z
    .string()
    .min(1, "El email es obligatorio.")
    .email("Ingresá un email válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(["user", "platform_admin"], {
    error: "El rol es obligatorio.",
  }),
  nodeId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido."),
  displayName: z
    .string()
    .min(1, "El nombre es obligatorio.")
    .max(255)
    .optional(),
  email: z.string().email("Ingresá un email válido.").optional(),
  role: z.enum(["user", "platform_admin"]).optional(),
  nodeId: z.string().uuid().optional().nullable(),
});

// ─── Contact Form Schemas ────────────────────────────────────────────────────

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100),
  email: z.string().email("Ingresá un email válido."),
  phone: z.string().max(30).optional().or(z.literal("")),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(500, "El mensaje no puede superar los 500 caracteres."),
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
export type DeleteEventPhotoInput = z.infer<typeof deleteEventPhotoSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
