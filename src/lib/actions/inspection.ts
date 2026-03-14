"use server";

import { auth } from "@/lib/auth";
import {
  createInspectionSchema,
  updateFindingSchema,
  signInspectionSchema,
} from "@/lib/validators";
import * as inspectionService from "@/lib/services/inspection";

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
      err instanceof Error ? err.message : "Error al crear la inspección.";
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
      err instanceof Error ? err.message : "Error al firmar la inspección.";
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
      return { success: false, error: "Inspección no encontrada." };
    }
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener la inspección.";
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
      return { success: false, error: "Inspección firmada no encontrada." };
    }
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener la inspección.";
    return { success: false, error: message };
  }
}
