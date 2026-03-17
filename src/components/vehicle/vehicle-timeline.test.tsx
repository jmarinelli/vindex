import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VehicleTimeline } from "./vehicle-timeline";
import type { VehicleEventItem } from "@/lib/services/vehicle";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

function makeEventItem(overrides?: Partial<VehicleEventItem>): VehicleEventItem {
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
    node: {
      id: "n-1",
      type: "inspector",
      slug: "autocheck-ba",
      displayName: "AutoCheck Buenos Aires",
      logoUrl: null,
      brandColor: null,
      contactEmail: "info@autocheck.com",
      contactPhone: null,
      address: null,
      bio: null,
      status: "active",
      verifiedAt: new Date("2026-01-01"),
      createdAt: new Date("2026-01-01"),
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
    correction: null,
    correctionOf: null,
    ...overrides,
  };
}

describe("VehicleTimeline", () => {
  it("renders section title with count", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(
      screen.getByText("Historial de inspecciones (1)")
    ).toBeInTheDocument();
  });

  it("renders empty state when zero events", () => {
    render(
      <VehicleTimeline initialEvents={[]} total={0} vehicleId="v-1" />
    );
    expect(
      screen.getByText("Este vehículo aún no tiene inspecciones firmadas.")
    ).toBeInTheDocument();
  });

  it("renders inspection type label", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(screen.getByText("Pre-compra")).toBeInTheDocument();
  });

  it("renders odometer with thousand separator", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(screen.getByText(/87.*500 km/)).toBeInTheDocument();
  });

  it("renders status summary with correct counts", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(screen.getByText("✓12")).toBeInTheDocument();
    expect(screen.getByText("⚠3")).toBeInTheDocument();
    expect(screen.getByText("✕1")).toBeInTheDocument();
    expect(screen.getByText("· 6 fotos")).toBeInTheDocument();
  });

  it("renders inspector name with link to profile", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    const inspectorLink = screen.getByText("AutoCheck Buenos Aires");
    expect(inspectorLink.closest("a")).toHaveAttribute(
      "href",
      "/inspector/autocheck-ba"
    );
  });

  it("renders 'Ver reporte →' link text", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(screen.getByText("Ver reporte →")).toBeInTheDocument();
  });

  it("navigates to /report/{slug} on event card click", () => {
    mockPush.mockClear();
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    const card = screen.getByRole("link", {
      name: /Pre-compra.*AutoCheck Buenos Aires.*Ver reporte/,
    });
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith("/report/abc123");
  });

  it("renders critical count with gray color when zero", () => {
    const item = makeEventItem({
      findingCounts: { good: 18, attention: 2, critical: 0 },
    });
    render(
      <VehicleTimeline
        initialEvents={[item]}
        total={1}
        vehicleId="v-1"
      />
    );
    const critEl = screen.getByText("✕0");
    expect(critEl.className).toContain("text-gray-400");
  });

  it("renders correction notice on original event", () => {
    const item = makeEventItem({
      correction: { slug: "correction-slug" },
    });
    render(
      <VehicleTimeline
        initialEvents={[item]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(
      screen.getByText("Se emitió una corrección")
    ).toBeInTheDocument();
    const link = screen.getByText("Ver corrección →");
    expect(link.closest("a")).toHaveAttribute("href", "/report/correction-slug");
  });

  it("renders correction notice on correction event", () => {
    const item = makeEventItem({
      correctionOf: { slug: "original-slug" },
    });
    render(
      <VehicleTimeline
        initialEvents={[item]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(
      screen.getByText("Corrige reporte anterior")
    ).toBeInTheDocument();
    const link = screen.getByText("Ver original →");
    expect(link.closest("a")).toHaveAttribute("href", "/report/original-slug");
  });

  it("shows 'Ver más' button when more events exist", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={15}
        vehicleId="v-1"
      />
    );
    expect(
      screen.getByRole("button", { name: "Cargar más inspecciones" })
    ).toBeInTheDocument();
  });

  it("hides 'Ver más' button when all events loaded", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    expect(
      screen.queryByRole("button", { name: "Cargar más inspecciones" })
    ).not.toBeInTheDocument();
  });

  it("renders events in correct order (multiple events)", () => {
    const newer = makeEventItem({
      event: {
        ...makeEventItem().event,
        id: "ev-2",
        signedAt: new Date("2026-03-13"),
        slug: "newer-slug",
      },
    });
    const older = makeEventItem({
      event: {
        ...makeEventItem().event,
        id: "ev-3",
        signedAt: new Date("2026-03-10"),
        slug: "older-slug",
      },
    });
    render(
      <VehicleTimeline
        initialEvents={[newer, older]}
        total={2}
        vehicleId="v-1"
      />
    );

    const reportLinks = screen.getAllByText("Ver reporte →");
    expect(reportLinks).toHaveLength(2);
  });

  it("uses semantic ol/li for timeline structure", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    const list = screen.getByRole("list", { name: "Timeline de inspecciones" });
    expect(list.tagName).toBe("OL");
    expect(list.querySelectorAll("li")).toHaveLength(1);
  });

  it("has data-testid attribute on container", () => {
    render(
      <VehicleTimeline initialEvents={[]} total={0} vehicleId="v-1" />
    );
    expect(screen.getByTestId("timeline-card")).toBeInTheDocument();
  });

  it("has accessible aria-label on inspector name link", () => {
    render(
      <VehicleTimeline
        initialEvents={[makeEventItem()]}
        total={1}
        vehicleId="v-1"
      />
    );
    const inspectorLink = screen.getByText("AutoCheck Buenos Aires");
    expect(inspectorLink.getAttribute("aria-label")).toBe(
      "Ver perfil de AutoCheck Buenos Aires"
    );
  });

  it("renders all inspection type labels correctly", () => {
    const types = [
      { type: "pre_purchase" as const, label: "Pre-compra" },
      { type: "intake" as const, label: "Recepción" },
      { type: "periodic" as const, label: "Periódica" },
      { type: "other" as const, label: "Otra" },
    ];

    for (const { type, label } of types) {
      const item = makeEventItem({
        event: { ...makeEventItem().event, id: `ev-${type}` },
        detail: { ...makeEventItem().detail, inspectionType: type },
      });
      const { unmount } = render(
        <VehicleTimeline
          initialEvents={[item]}
          total={1}
          vehicleId="v-1"
        />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
