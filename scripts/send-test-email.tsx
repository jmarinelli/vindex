/**
 * Sends a test email using the InspectionSignedEmail template via Resend.
 *
 * Usage: npx tsx scripts/send-test-email.tsx <recipient-email>
 *
 * Requires RESEND_API_KEY and FROM_EMAIL in .env
 */
import "dotenv/config";
import { Resend } from "resend";
import { InspectionSignedEmail } from "../src/lib/emails/inspection-signed";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npx tsx scripts/send-test-email.tsx <recipient-email>");
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY in .env");
  process.exit(1);
}

console.log(process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

const props = {
  vehicleName: "Nissan Sentra 2019",
  plate: "AC123BD",
  vin: "3N1AB7AP5KY250312",
  inspectorName: "AutoCheck Buenos Aires",
  eventDate: "2026-03-13",
  findingsSummary: { good: 12, attention: 3, critical: 1 },
  reportUrl: "https://vindex.app/report/abc12345",
  reviewUrl: "https://vindex.app/review/sample-token-abc123",
};

async function main() {
  console.log(`Sending test email to ${to}...`);

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "VinDex <noreply@vindex.app>",
    to,
    subject: `Inspección de ${props.vehicleName} firmada — ${props.inspectorName}`,
    react: InspectionSignedEmail(props),
  });

  if (error) {
    console.error("Failed:", error);
    process.exit(1);
  }

  console.log("Sent! Email ID:", data?.id);
}

main();
