/**
 * Renders the InspectionSignedEmail template to HTML and opens it in the browser.
 *
 * Usage: npx tsx scripts/preview-email.tsx
 */
import { render } from "@react-email/render";
import { InspectionSignedEmail } from "../src/lib/emails/inspection-signed";
import { writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

async function main() {
  const html = await render(
    InspectionSignedEmail({
      vehicleName: "Nissan Sentra 2019",
      plate: "AC123BD",
      vin: "3N1AB7AP5KY250312",
      inspectorName: "AutoCheck Buenos Aires",
      eventDate: "2026-03-13",
      findingsSummary: { good: 12, attention: 3, critical: 1 },
      reportUrl: "https://vindex.app/report/abc12345",
      reviewUrl: "https://vindex.app/review/sample-token-abc123",
    })
  );

  // Replace remote logo URL with local path for preview
  const localHtml = html.replace(
    "https://vindex.app/logo-email.png",
    "../public/logo-email.png"
  );

  const outPath = join(__dirname, "../tmp/email-preview.html");
  writeFileSync(outPath, localHtml, "utf-8");
  console.log(`Email preview saved to: ${outPath}`);

  // Open in default browser
  try {
    execSync(`open "${outPath}"`);
  } catch {
    console.log("Could not auto-open. Open the file manually in your browser.");
  }
}

main();
