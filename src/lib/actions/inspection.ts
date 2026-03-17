"use server";

import { auth } from "@/lib/auth";
import {
  createInspectionSchema,
  updateFindingSchema,
  signInspectionSchema,
  createCorrectionSchema,
  uploadPhotoSchema,
  deleteEventPhotoSchema,
  updateCustomerEmailSchema,
} from "@/lib/validators";
import * as inspectionService from "@/lib/services/inspection";
import { db } from "@/db";
import { nodes, inspectionDetails, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createInspectionAction(
  input: unknown
): Promise<ActionResult<{ eventId: string; slug: string }>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = createInspectionSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const draft = await inspectionService.createInspection({
      ...parsed.data,
      nodeId: session.user.nodeId,
      userId: session.user.id,
    });

    return {
      success: true,
      data: {
        eventId: draft.event.id,
        slug: draft.event.slug,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear la verificación.";
    return { success: false, error: message };
  }
}

export async function updateFindingAction(
  input: unknown
): Promise<ActionResult<{ findingId: string }>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = updateFindingSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const finding = await inspectionService.updateFinding({
      ...parsed.data,
      nodeId: session.user.nodeId,
      userId: session.user.id,
    });

    return {
      success: true,
      data: { findingId: finding.id },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el hallazgo.";
    return { success: false, error: message };
  }
}

export async function getDraftAction(
  eventId: string
): Promise<ActionResult<inspectionService.InspectionDraft>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  try {
    const draft = await inspectionService.getDraft(eventId, session.user.nodeId);
    if (!draft) {
      return { success: false, error: "Borrador no encontrado." };
    }
    return { success: true, data: draft };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener el borrador.";
    return { success: false, error: message };
  }
}

export async function signInspectionAction(
  input: unknown
): Promise<ActionResult<{ event: inspectionService.SignedEventResult }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Debés iniciar sesión para firmar." };
  }

  const parsed = signInspectionSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const event = await inspectionService.signInspection(
      parsed.data.eventId,
      session.user.id
    );

    return {
      success: true,
      data: { event: { id: event.id, slug: event.slug, signedAt: event.signedAt } },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al firmar la verificación.";
    return { success: false, error: message };
  }
}

export async function getInspectionsAction(
  params?: { search?: string; status?: "draft" | "signed" | "all" }
): Promise<ActionResult<inspectionService.InspectionListItem[]>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  try {
    const items = await inspectionService.getInspectionsForNode({
      nodeId: session.user.nodeId,
      search: params?.search,
      status: params?.status,
    });
    return { success: true, data: items };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener las verificaciones.";
    return { success: false, error: message };
  }
}

export async function getInspectionForReviewAction(
  eventId: string
): Promise<ActionResult<inspectionService.InspectionReviewData>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  try {
    const data = await inspectionService.getInspectionForReview(
      eventId,
      session.user.nodeId
    );
    if (!data) {
      return { success: false, error: "Verificación no encontrada." };
    }
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener la verificación.";
    return { success: false, error: message };
  }
}

export async function getSignedInspectionAction(
  eventId: string
): Promise<ActionResult<inspectionService.SignedInspectionData>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  try {
    const data = await inspectionService.getSignedInspection(
      eventId,
      session.user.nodeId
    );
    if (!data) {
      return { success: false, error: "Verificación firmada no encontrada." };
    }
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener la verificación.";
    return { success: false, error: message };
  }
}

export async function getNodeSlugAction(): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const [node] = await db
    .select({ slug: nodes.slug })
    .from(nodes)
    .where(eq(nodes.id, session.user.nodeId))
    .limit(1);

  if (!node) {
    return { success: false, error: "Nodo no encontrado." };
  }

  return { success: true, data: node.slug };
}

export async function createCorrectionAction(
  input: unknown
): Promise<ActionResult<{ event: { id: string; slug: string } }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Debés iniciar sesión para crear una corrección.",
    };
  }

  const parsed = createCorrectionSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const event = await inspectionService.createCorrection(
      parsed.data.eventId,
      session.user.id
    );

    return {
      success: true,
      data: { event: { id: event.id, slug: event.slug } },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear la corrección.";
    return { success: false, error: message };
  }
}

export async function saveEventPhotoAction(
  input: unknown
): Promise<ActionResult<{ eventPhoto: { id: string } }>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = uploadPhotoSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const photo = await inspectionService.saveEventPhoto({
      ...parsed.data,
      findingId: parsed.data.findingId ?? null,
      caption: parsed.data.caption ?? null,
      nodeId: session.user.nodeId,
    });

    return {
      success: true,
      data: { eventPhoto: { id: photo.id } },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar la foto.";
    return { success: false, error: message };
  }
}

export async function deleteEventPhotoAction(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = deleteEventPhotoSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    await inspectionService.deleteEventPhoto({
      ...parsed.data,
      nodeId: session.user.nodeId,
    });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar la foto.";
    return { success: false, error: message };
  }
}

/**
 * Update customer email on a draft inspection.
 * Only works on draft events (immutability guard).
 */
export async function updateCustomerEmailAction(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = updateCustomerEmailSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    // Verify event belongs to user's node and is still draft
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, parsed.data.eventId),
          eq(events.nodeId, session.user.nodeId)
        )
      )
      .limit(1);

    if (!event) {
      return { success: false, error: "Verificación no encontrada." };
    }

    if (event.status === "signed") {
      return { success: false, error: "No se puede modificar una verificación firmada." };
    }

    // Update customer email on inspection detail
    const emailValue = parsed.data.customerEmail?.trim() || null;
    await db
      .update(inspectionDetails)
      .set({ customerEmail: emailValue })
      .where(eq(inspectionDetails.eventId, parsed.data.eventId));

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el email.";
    return { success: false, error: message };
  }
}
