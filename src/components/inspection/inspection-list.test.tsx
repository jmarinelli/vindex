import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InspectionList } from "./inspection-list";
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

function makeItem(
  overrides?: Partial<InspectionListItem> & {
    eventOverrides?: Partial<InspectionListItem["event"]>;
    vehicleOverrides?: Partial<InspectionListItem["vehicle"]>;
  }
): InspectionListItem {
  const { eventOverrides, vehicleOverrides, ...rest } = overrides ?? {};
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
      ...eventOverrides,
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
      ...vehicleOverrides,
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
    ...rest,
  };
}

const draftItem = makeItem();
const signedItem = makeItem({
  eventOverrides: {
    id: "ev-2",
    status: "signed",
    signedAt: new Date("2026-03-10"),
    slug: "def456",
  },
  vehicleOverrides: {
    id: "v-2",
    vin: "JTDKN3DU5A0123456",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
  },
});

describe("InspectionList", () => {
  describe("Empty state", () => {
    it("shows empty state when no inspections", () => {
      render(<InspectionList inspections={[]} />);
      expect(screen.getByText("No tenés inspecciones")).toBeInTheDocument();
      expect(
        screen.getByText("Creá tu primera inspección para empezar.")
      ).toBeInTheDocument();
    });

    it("hides search/filter when no inspections", () => {
      render(<InspectionList inspections={[]} />);
      expect(
        screen.queryByLabelText("Buscar inspecciones")
      ).not.toBeInTheDocument();
    });
  });

  describe("With inspections", () => {
    it("renders inspection cards", () => {
      render(<InspectionList inspections={[draftItem, signedItem]} />);
      expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
      expect(screen.getByText("Toyota Corolla 2020")).toBeInTheDocument();
    });

    it("shows correct count in header", () => {
      render(<InspectionList inspections={[draftItem, signedItem]} />);
      expect(screen.getByText("Mis Inspecciones (2)")).toBeInTheDocument();
    });

    it("renders search input", () => {
      render(<InspectionList inspections={[draftItem]} />);
      expect(screen.getByLabelText("Buscar inspecciones")).toBeInTheDocument();
    });

    it("renders filter pills", () => {
      render(<InspectionList inspections={[draftItem]} />);
      expect(screen.getByText("Todos")).toBeInTheDocument();
      expect(screen.getByText("Borrador")).toBeInTheDocument();
      expect(screen.getByText("Firmados")).toBeInTheDocument();
    });
  });

  describe("Search", () => {
    it("filters by VIN", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem, signedItem]} />);

      const input = screen.getByLabelText("Buscar inspecciones");
      await user.type(input, "3N1AB");

      expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
      expect(
        screen.queryByText("Toyota Corolla 2020")
      ).not.toBeInTheDocument();
      expect(screen.getByText("Mis Inspecciones (1)")).toBeInTheDocument();
    });

    it("filters by make", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem, signedItem]} />);

      const input = screen.getByLabelText("Buscar inspecciones");
      await user.type(input, "toyota");

      expect(screen.getByText("Toyota Corolla 2020")).toBeInTheDocument();
      expect(
        screen.queryByText("Nissan Sentra 2019")
      ).not.toBeInTheDocument();
    });

    it("shows clear button when search has text", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem]} />);

      const input = screen.getByLabelText("Buscar inspecciones");
      await user.type(input, "test");

      expect(screen.getByLabelText("Limpiar búsqueda")).toBeInTheDocument();
    });

    it("clears search when clear button is clicked", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem, signedItem]} />);

      const input = screen.getByLabelText("Buscar inspecciones");
      await user.type(input, "xyz-no-match");

      expect(screen.getByText("Mis Inspecciones (0)")).toBeInTheDocument();

      await user.click(screen.getByLabelText("Limpiar búsqueda"));

      expect(screen.getByText("Mis Inspecciones (2)")).toBeInTheDocument();
    });
  });

  describe("Status filter", () => {
    it("'Todos' is active by default", () => {
      render(<InspectionList inspections={[draftItem, signedItem]} />);
      const todosBtn = screen.getByText("Todos");
      expect(todosBtn.getAttribute("aria-checked")).toBe("true");
    });

    it("filters by Borrador", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem, signedItem]} />);

      await user.click(screen.getByText("Borrador"));

      expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
      expect(
        screen.queryByText("Toyota Corolla 2020")
      ).not.toBeInTheDocument();
      expect(screen.getByText("Mis Inspecciones (1)")).toBeInTheDocument();
    });

    it("filters by Firmados", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem, signedItem]} />);

      await user.click(screen.getByText("Firmados"));

      expect(screen.getByText("Toyota Corolla 2020")).toBeInTheDocument();
      expect(
        screen.queryByText("Nissan Sentra 2019")
      ).not.toBeInTheDocument();
    });

    it("shows all when Todos is clicked after filtering", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem, signedItem]} />);

      await user.click(screen.getByText("Borrador"));
      expect(screen.getByText("Mis Inspecciones (1)")).toBeInTheDocument();

      await user.click(screen.getByText("Todos"));
      expect(screen.getByText("Mis Inspecciones (2)")).toBeInTheDocument();
    });
  });

  describe("Filtered no results", () => {
    it("shows no results message when search matches nothing", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem]} />);

      const input = screen.getByLabelText("Buscar inspecciones");
      await user.type(input, "zzz-no-match");

      expect(
        screen.getByText(
          "No se encontraron inspecciones con estos filtros."
        )
      ).toBeInTheDocument();
    });

    it("shows 'Limpiar filtros' link that resets filters", async () => {
      const user = userEvent.setup();
      render(<InspectionList inspections={[draftItem]} />);

      const input = screen.getByLabelText("Buscar inspecciones");
      await user.type(input, "zzz-no-match");

      await user.click(screen.getByText("Limpiar filtros"));

      expect(screen.getByText("Nissan Sentra 2019")).toBeInTheDocument();
      expect(screen.getByText("Mis Inspecciones (1)")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("filter pills have radiogroup role", () => {
      render(<InspectionList inspections={[draftItem]} />);
      expect(
        screen.getByRole("radiogroup", { name: "Filtrar por estado" })
      ).toBeInTheDocument();
    });

    it("filter pills have radio role and aria-checked", () => {
      render(<InspectionList inspections={[draftItem]} />);
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);
      expect(radios[0]).toHaveAttribute("aria-checked", "true"); // Todos
      expect(radios[1]).toHaveAttribute("aria-checked", "false"); // Borrador
    });

    it("empty state has status role", () => {
      render(<InspectionList inspections={[]} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});
