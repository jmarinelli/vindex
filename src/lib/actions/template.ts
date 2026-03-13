"use server";

import { auth } from "@/lib/auth";
import { updateTemplateSchema } from "@/lib/validators";
import * as templateService from "@/lib/services/template";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function updateTemplateAction(
  input: unknown
): Promise<ActionResult<{ updatedAt: string }>> {
  // Auth check
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  // Validate input
  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  const { templateId, name, sections } = parsed.data;

  try {
    const result = await templateService.updateTemplate(
      templateId,
      session.user.nodeId,
      session.user.id,
      name,
      sections
    );

    return {
      success: true,
      data: { updatedAt: result.updatedAt.toISOString() },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar el template.";
    return { success: false, error: message };
  }
}
