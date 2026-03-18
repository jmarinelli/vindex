"use server";

import { auth } from "@/lib/auth";
import {
  updateNodeBrandingSchema,
  updateNodeLogoSchema,
} from "@/lib/validators";
import * as nodeService from "@/lib/services/node";
import type { Node } from "@/db/schema";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getNodeBrandingAction(): Promise<ActionResult<Node>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  try {
    const node = await nodeService.getNodeById(session.user.nodeId);
    if (!node) {
      return { success: false, error: "Nodo no encontrado." };
    }
    return { success: true, data: node };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener datos del nodo.";
    return { success: false, error: message };
  }
}

export async function updateNodeBrandingAction(
  input: unknown
): Promise<ActionResult<Node>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = updateNodeBrandingSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const updated = await nodeService.updateNodeBranding(
      session.user.nodeId,
      parsed.data
    );
    return { success: true, data: updated };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el nodo.";
    return { success: false, error: message };
  }
}

export async function updateNodeLogoAction(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = updateNodeLogoSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    await nodeService.updateNodeLogo(session.user.nodeId, parsed.data.logoUrl);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el logo.";
    return { success: false, error: message };
  }
}
