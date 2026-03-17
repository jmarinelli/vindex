import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InspectionCard } from "./inspection-card";
import type { InspectionListItem } from "@/lib/services/inspection";

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

function makeItem(overrides?: Partial<InspectionListItem>): InspectionListItem {
  return {
    event: {
      id: "ev-1",
      vehicleId: "v-1",
      nodeId: "n-1",
      signedByUserId: null,
      eventType: "inspection",
      odometerKm: 87500,
      eventDate: "2026-03-12",
      status: "draft",
      signedAt: null,
      slug: "abc123",
      correctionOfId: null,
      createdAt: new Date("2026-03-12"),
      updatedAt: new Date("2026-03-12"),
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
      createdAt: new Date("2026-03-12"),
    },
    detail: {
      id: "d-1",
      eventId: "ev-1",
      templateSnapshot: {},
      inspectionType: "pre_purchase",
      requestedBy: "buyer",
    },
    findingCounts: {
      total: 23,
      evaluated: 18,
      good: 14,
      attention: 3,
      critical: 1,
    },
    photoCount: 4,
    observationCount: 12,
    ...overrides,
  };
}

describe("InspectionCard", () => {
  it("renders vehicle name", () => {
    render(<InspectionCard item={makeItem()} />);
    expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
  });

  it("renders VIN", () => {
    render(<InspectionCard item={makeItem()} />);
    expect(screen.getByText("VIN: 3N1AB7AP5KY250312")).toBeInTheDocument();
  });

  it("renders odometer with formatting", () => {
    render(<InspectionCard item={makeItem()} />);
    // The formatted odometer should contain 87.500 or 87,500 depending on locale
    const text = screen.getByText(/87.*500 km/);
    expect(text).toBeInTheDocument();
  });

  it("renders inspection type and requested by labels in Spanish", () => {
    render(<InspectionCard item={makeItem()} />);
    expect(screen.getByText(/Pre-compra/)).toBeInTheDocument();
    expect(screen.getByText(/Comprador/)).toBeInTheDocument();
  });

  it("shows BORRADOR badge for draft", () => {
    render(<InspectionCard item={makeItem()} />);
    expect(screen.getByText("BORRADOR")).toBeInTheDocument();
  });

  it("shows FIRMADO badge for signed", () => {
    const signed = makeItem({
      event: {
        ...makeItem().event,
        status: "signed",
        signedAt: new Date("2026-03-12"),
      },
    });
    render(<InspectionCard item={signed} />);
    expect(screen.getByText("FIRMADO")).toBeInTheDocument();
  });

  it("shows progress footer for draft", () => {
    render(<InspectionCard item={makeItem()} />);
    expect(screen.getByText(/18\/23 items/)).toBeInTheDocument();
    expect(screen.getByText(/4 fotos/)).toBeInTheDocument();
    expect(screen.getByText(/12 obs/)).toBeInTheDocument();
  });

  it("shows status summary footer for signed", () => {
    const signed = makeItem({
      event: {
        ...makeItem().event,
        status: "signed",
        signedAt: new Date("2026-03-12"),
      },
    });
    render(<InspectionCard item={signed} />);
    expect(screen.getByText(/14 Bien/)).toBeInTheDocument();
    expect(screen.getByText(/3 Att/)).toBeInTheDocument();
    expect(screen.getByText(/1 Crit/)).toBeInTheDocument();
  });

  it("links to /dashboard/inspect/{id} for draft", () => {
    render(<InspectionCard item={makeItem()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/inspect/ev-1");
  });

  it("links to /report/{slug} for signed", () => {
    const signed = makeItem({
      event: {
        ...makeItem().event,
        status: "signed",
        signedAt: new Date("2026-03-12"),
      },
    });
    render(<InspectionCard item={signed} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/report/abc123");
  });

  it("renders 'Vehículo sin datos' when no vehicle data", () => {
    const noData = makeItem({
      vehicle: {
        ...makeItem().vehicle,
        make: null,
        model: null,
        year: null,
      },
    });
    render(<InspectionCard item={noData} />);
    expect(screen.getByText("Vehículo sin datos")).toBeInTheDocument();
  });

  it("has accessible aria-label on the card", () => {
    render(<InspectionCard item={makeItem()} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("aria-label")).toContain("Nissan Sentra 2019");
    expect(link.getAttribute("aria-label")).toContain("Borrador");
  });

  it("has accessible aria-label on the status badge", () => {
    render(<InspectionCard item={makeItem()} />);
    const badge = screen.getByText("BORRADOR");
    expect(badge.getAttribute("aria-label")).toBe("Estado: Borrador");
  });
});
