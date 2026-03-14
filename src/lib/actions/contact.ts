"use server";

import { contactFormSchema } from "@/lib/validators";

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Submit a contact form lead from the landing page.
 * No auth required — public action.
 * In MVP, logs the lead. A transactional email service can be added later.
 */
export async function submitContactFormAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    // MVP: log the lead to console. Replace with email service or DB storage later.
    console.log("[Contact Lead]", {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      message: parsed.data.message,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch {
    return { success: false, error: "Error al enviar el mensaje. Intentá de nuevo." };
  }
}
