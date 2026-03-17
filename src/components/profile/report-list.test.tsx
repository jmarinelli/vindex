import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportList } from "./report-list";
import type { SignedReportItem } from "@/lib/services/node";

function makeReport(overrides?: Partial<SignedReportItem>): SignedReportItem {
  return {
    event: {
      id: "ev-1",
      vehicleId: "v-1",
      nodeId: "n-1",
      signedByUserId: "u-1",
      eventType: "inspection",
      odometerKm: 87500,
      eventDate: "2026-03-13",
      status: "signed",
      signedAt: new Date("2026-03-13"),
      slug: "abc123",
      correctionOfId: null,
      createdAt: new Date("2026-03-13"),
      updatedAt: new Date("2026-03-13"),
    },
    vehicle: {
      id: "v-1",
      vin: "3N1AB7AP5KY250312",
      plate: "ABC123",
      make: "Nissan",
      model: "Sentra",
      year: 2019,
      trim: null,
      createdByNodeId: "n-1",
      createdAt: new Date("2026-03-13"),
    },
    detail: {
      id: "d-1",
      eventId: "ev-1",
      templateSnapshot: {},
      inspectionType: "pre_purchase",
      requestedBy: "buyer",
      customerEmail: null,
    },
    findingCounts: {
      good: 12,
      attention: 3,
      critical: 1,
    },
    photoCount: 6,
    ...overrides,
  };
}

describe("ReportList", () => {
  it("renders section title with count", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(
      screen.getByText("Verificaciones firmadas (1)")
    ).toBeInTheDocument();
  });

  it("renders empty state when zero reports", () => {
    render(<ReportList initialReports={[]} total={0} nodeId="n-1" />);
    expect(
      screen.getByText(
        "Este verificador aún no tiene verificaciones firmadas."
      )
    ).toBeInTheDocument();
  });

  it("renders vehicle name in report item", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
  });

  it("renders inspection type", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("Pre-compra")).toBeInTheDocument();
  });

  it("shows 'Vehículo sin datos' when no vehicle data", () => {
    const report = makeReport({
      vehicle: {
        ...makeReport().vehicle,
        make: null,
        model: null,
        year: null,
      },
    });
    render(
      <ReportList initialReports={[report]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("Vehículo sin datos")).toBeInTheDocument();
  });

  it("shows 'Ver más' button when more reports exist", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={15} nodeId="n-1" />
    );
    expect(
      screen.getByRole("button", { name: "Cargar más verificaciones" })
    ).toBeInTheDocument();
  });

  it("hides 'Ver más' button when all reports loaded", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(
      screen.queryByRole("button", { name: "Cargar más verificaciones" })
    ).not.toBeInTheDocument();
  });

  it("does not render VIN, odometer, findings, photos, or report link", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.queryByText(/VIN:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/87.*500 km/)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓12/)).not.toBeInTheDocument();
    expect(screen.queryByText(/fotos/)).not.toBeInTheDocument();
    expect(screen.queryByText("Ver reporte →")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
