import { ImageResponse } from "@vercel/og";
import { getPublicReport } from "@/lib/services/inspection";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const report = await getPublicReport(slug);

  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  const { vehicle, node, findings, event } = report;

  const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(" ");

  const good = findings.filter((f) => f.status === "good").length;
  const attention = findings.filter((f) => f.status === "attention").length;
  const critical = findings.filter((f) => f.status === "critical").length;

  const signedDate = event.signedAt
    ? new Date(event.signedAt).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Top: Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0EA5E9",
              padding: "4px 12px",
              borderRadius: "4px",
              transform: "skewX(-8deg)",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "1.5px",
                transform: "skewX(8deg)",
              }}
            >
              VIN
            </span>
          </div>
          <span
            style={{
              color: "#1E293B",
              fontSize: "28px",
              fontWeight: 500,
            }}
          >
            dex
          </span>
        </div>

        {/* Center: Vehicle info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#F0FDF4",
                border: "2px solid #16A34A",
                borderRadius: "8px",
                padding: "6px 14px",
              }}
            >
              <span style={{ fontSize: "18px", color: "#16A34A", fontWeight: 700 }}>
                ✓ Inspección Verificada
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.1,
            }}
          >
            {vehicleName || "Vehículo"}
          </div>

          <div
            style={{
              fontSize: "22px",
              color: "#6B7280",
              fontFamily: "monospace",
            }}
          >
            VIN: {vehicle.vin}
          </div>

          {/* Status counts */}
          <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
            {good > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "#16A34A",
                  }}
                />
                <span style={{ fontSize: "22px", color: "#374151", fontWeight: 600 }}>
                  {good} Bien
                </span>
              </div>
            )}
            {attention > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "#D97706",
                  }}
                />
                <span style={{ fontSize: "22px", color: "#374151", fontWeight: 600 }}>
                  {attention} Atención
                </span>
              </div>
            )}
            {critical > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "#DC2626",
                  }}
                />
                <span style={{ fontSize: "22px", color: "#374151", fontWeight: 600 }}>
                  {critical} Crítico
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Inspector + date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #E5E7EB",
            paddingTop: "20px",
          }}
        >
          <span style={{ fontSize: "20px", color: "#6B7280" }}>
            Verificada por {node.displayName}
          </span>
          <span style={{ fontSize: "18px", color: "#9CA3AF" }}>
            {signedDate}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
