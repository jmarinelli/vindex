import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportList } from "./report-list";
import type { SignedReportItem } from "@/lib/services/node";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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
      screen.getByText("Inspecciones firmadas (1)")
    ).toBeInTheDocument();
  });

  it("renders empty state when zero reports", () => {
    render(<ReportList initialReports={[]} total={0} nodeId="n-1" />);
    expect(
      screen.getByText(
        "Este inspector aún no tiene inspecciones firmadas."
      )
    ).toBeInTheDocument();
  });

  it("renders vehicle name in report item", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
  });

  it("renders VIN", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("VIN: 3N1AB7AP5KY250312")).toBeInTheDocument();
  });

  it("renders odometer and type", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText(/87.*500 km · Pre-compra/)).toBeInTheDocument();
  });

  it("renders status summary with correct counts", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("✓12")).toBeInTheDocument();
    expect(screen.getByText("⚠3")).toBeInTheDocument();
    expect(screen.getByText("✕1")).toBeInTheDocument();
    expect(screen.getByText("· 6 fotos")).toBeInTheDocument();
  });

  it("renders report link text", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(screen.getByText("Ver reporte →")).toBeInTheDocument();
  });

  it("links to /report/{slug}", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/report/abc123");
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
      screen.getByRole("button", { name: "Cargar más inspecciones" })
    ).toBeInTheDocument();
  });

  it("hides 'Ver más' button when all reports loaded", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    expect(
      screen.queryByRole("button", { name: "Cargar más inspecciones" })
    ).not.toBeInTheDocument();
  });

  it("renders critical count with gray color when zero", () => {
    const report = makeReport({
      findingCounts: { good: 18, attention: 2, critical: 0 },
    });
    render(
      <ReportList initialReports={[report]} total={1} nodeId="n-1" />
    );
    const critEl = screen.getByText("✕0");
    expect(critEl.className).toContain("text-gray-400");
  });

  it("has accessible aria-label on report items", () => {
    render(
      <ReportList initialReports={[makeReport()]} total={1} nodeId="n-1" />
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("aria-label")).toContain("Nissan Sentra 2019");
    expect(link.getAttribute("aria-label")).toContain("Ver reporte");
  });
});
