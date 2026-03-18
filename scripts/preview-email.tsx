/**
 * Renders the InspectionSignedEmail template to HTML and serves it on a local server.
 *
 * Usage: npx tsx scripts/preview-email.tsx
 */
import { render } from "@react-email/render";
import { InspectionSignedEmail } from "../src/lib/emails/inspection-signed";
import { createServer } from "http";
import { execSync } from "child_process";

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

  const port = 3088;
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Email preview at: ${url}`);
    console.log("Press Ctrl+C to stop.");
    try {
      execSync(`open "${url}"`);
    } catch {
      // ignore
    }
  });
}

main();
