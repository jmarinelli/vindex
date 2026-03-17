import { Resend } from "resend";
import { InspectionSignedEmail } from "@/lib/emails/inspection-signed";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendInspectionSignedEmailParams {
  to: string;
  vehicleName: string;
  plate: string | null;
  vin: string;
  inspectorName: string;
  eventDate: string;
  findingsSummary: { good: number; attention: number; critical: number };
  reportUrl: string;
  reviewUrl: string;
}

/**
 * Send the post-signing notification email to the customer.
 * Best-effort — catches and logs errors, never throws.
 */
export async function sendInspectionSignedEmail(
  params: SendInspectionSignedEmailParams
): Promise<void> {
  try {
    await getResend().emails.send({
      from: process.env.FROM_EMAIL ?? "VinDex <noreply@vindex.app>",
      to: params.to,
      subject: `Inspección de ${params.vehicleName} firmada — ${params.inspectorName}`,
      react: InspectionSignedEmail(params),
    });
  } catch (error) {
    console.error("[email] Failed to send inspection signed email:", error);
  }
}
