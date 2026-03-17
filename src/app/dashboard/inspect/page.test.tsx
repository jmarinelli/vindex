import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InspectPage from "./page";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/components/layout/shell-dashboard", () => ({
  ShellDashboard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockLookupVehicleAction = vi.fn();
const mockFindOrCreateVehicleAction = vi.fn();
const mockDecodeVinAction = vi.fn();
vi.mock("@/lib/actions/vehicle", () => ({
  lookupVehicleAction: (...args: unknown[]) =>
    mockLookupVehicleAction(...args),
  findOrCreateVehicleAction: (...args: unknown[]) =>
    mockFindOrCreateVehicleAction(...args),
  decodeVinAction: (...args: unknown[]) => mockDecodeVinAction(...args),
}));

vi.mock("@/lib/vin", () => ({
  sanitizeVin: (v: string) => v.toUpperCase().replace(/\s/g, ""),
  validateVin: (v: string) => {
    if (v.length !== 17) return { valid: false, error: "Longitud inválida" };
    if (/[IOQ]/i.test(v))
      return { valid: false, error: "Caracteres inválidos" };
    return { valid: true };
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Valid VIN that passes our mock validateVin (17 chars, no I/O/Q)
const VALID_VIN = "ABCDE12345678901X";

function mockExistingVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: "v1",
    vin: VALID_VIN,
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    trim: "SE",
    plate: "ABC123",
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InspectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders VIN input and disabled continue button", () => {
    render(<InspectPage />);
    expect(screen.getByLabelText("Número de VIN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });

  it("shows character counter", async () => {
    const user = userEvent.setup();
    render(<InspectPage />);

    expect(screen.getByText("0/17 caracteres")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Número de VIN"), "ABC");
    expect(screen.getByText("3/17 caracteres")).toBeInTheDocument();
  });

  it("shows loading state during lookup", async () => {
    const user = userEvent.setup();
    // Make lookup hang indefinitely so we can observe loading state
    mockLookupVehicleAction.mockReturnValue(new Promise(() => {}));

    render(<InspectPage />);
    await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

    expect(screen.getByText("Buscando VIN...")).toBeInTheDocument();
  });

  describe("Mode A — Existing vehicle (all fields populated)", () => {
    beforeEach(() => {
      mockLookupVehicleAction.mockResolvedValue({
        success: true,
        data: {
          vehicle: mockExistingVehicle(),
          inspectionCount: 3,
        },
      });
    });

    it("shows info banner with inspection count", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(
          screen.getByText("Vehículo registrado — 3 inspección(es).")
        ).toBeInTheDocument();
      });
    });

    it("renders populated fields as read-only", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        const makeInput = screen.getByDisplayValue("Toyota");
        expect(makeInput).toHaveAttribute("readOnly");
        expect(makeInput).toHaveClass("bg-gray-100");
      });

      expect(screen.getByDisplayValue("Corolla")).toHaveAttribute("readOnly");
      expect(screen.getByDisplayValue("2020")).toHaveAttribute("readOnly");
      expect(screen.getByDisplayValue("SE")).toHaveAttribute("readOnly");
    });

    it("enables continue button", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Continuar" })
        ).toBeEnabled();
      });
    });

    it("does not call decode API when vehicle exists in DB", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Toyota")).toBeInTheDocument();
      });

      expect(mockDecodeVinAction).not.toHaveBeenCalled();
    });
  });

  describe("Mode A — Existing vehicle (some fields null)", () => {
    beforeEach(() => {
      mockLookupVehicleAction.mockResolvedValue({
        success: true,
        data: {
          vehicle: mockExistingVehicle({ trim: null, year: null }),
          inspectionCount: 1,
        },
      });
    });

    it("shows populated fields as locked and null fields as editable", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Toyota")).toHaveAttribute("readOnly");
        expect(screen.getByDisplayValue("Corolla")).toHaveAttribute(
          "readOnly"
        );
      });

      // Null fields should be editable — find them by label
      const yearInput = screen.getByLabelText("Año");
      const trimInput = screen.getByLabelText("Versión");
      expect(yearInput).not.toHaveAttribute("readOnly");
      expect(trimInput).not.toHaveAttribute("readOnly");
    });
  });

  describe("Mode B — New vehicle, decode success", () => {
    beforeEach(() => {
      mockLookupVehicleAction.mockResolvedValue({
        success: true,
        data: null,
      });
      mockDecodeVinAction.mockResolvedValue({
        success: true,
        data: {
          make: "Nissan",
          model: "Sentra",
          year: 2019,
          trim: "SR",
        },
      });
    });

    it("shows no banner", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Nissan")).toBeInTheDocument();
      });

      expect(screen.queryByText(/Vehículo registrado/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudo decodificar/)
      ).not.toBeInTheDocument();
    });

    it("shows all fields editable and pre-filled", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        const makeInput = screen.getByDisplayValue("Nissan");
        expect(makeInput).not.toHaveAttribute("readOnly");
      });

      expect(screen.getByDisplayValue("Sentra")).not.toHaveAttribute(
        "readOnly"
      );
      expect(screen.getByDisplayValue("2019")).not.toHaveAttribute("readOnly");
      expect(screen.getByDisplayValue("SR")).not.toHaveAttribute("readOnly");
    });

    it("allows editing pre-filled fields", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Nissan")).toBeInTheDocument();
      });

      const makeInput = screen.getByDisplayValue("Nissan");
      await user.clear(makeInput);
      await user.type(makeInput, "Honda");

      expect(screen.getByDisplayValue("Honda")).toBeInTheDocument();
    });
  });

  describe("Mode C — New vehicle, decode failed", () => {
    beforeEach(() => {
      mockLookupVehicleAction.mockResolvedValue({
        success: true,
        data: null,
      });
      mockDecodeVinAction.mockResolvedValue({
        success: true,
        data: null,
      });
    });

    it("shows warning banner", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(
          screen.getByText(
            "No se pudo decodificar el VIN. Podés ingresar los datos manualmente."
          )
        ).toBeInTheDocument();
      });
    });

    it("shows all fields editable and empty", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByLabelText("Marca")).toBeInTheDocument();
      });

      const makeInput = screen.getByLabelText("Marca");
      const modelInput = screen.getByLabelText("Modelo");
      expect(makeInput).not.toHaveAttribute("readOnly");
      expect(modelInput).not.toHaveAttribute("readOnly");
      expect(makeInput).toHaveValue("");
      expect(modelInput).toHaveValue("");
    });

    it("disables continue button when plate is empty", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Continuar" })
        ).toBeDisabled();
      });
    });

    it("enables continue button after entering plate", async () => {
      const user = userEvent.setup();
      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByLabelText("Patente")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText("Patente"), "ABC123");

      expect(
        screen.getByRole("button", { name: "Continuar" })
      ).toBeEnabled();
    });
  });

  describe("VIN change resets mode", () => {
    it("clears fields when VIN changes", async () => {
      const user = userEvent.setup();
      mockLookupVehicleAction.mockResolvedValue({
        success: true,
        data: {
          vehicle: mockExistingVehicle(),
          inspectionCount: 2,
        },
      });

      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Toyota")).toBeInTheDocument();
      });

      // Change VIN — type a new character (which replaces it since we're clearing)
      const vinInput = screen.getByLabelText("Número de VIN");
      await user.clear(vinInput);
      await user.type(vinInput, "ABC");

      // Fields should be gone
      expect(screen.queryByDisplayValue("Toyota")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Vehículo registrado/)
      ).not.toBeInTheDocument();
    });
  });

  describe("Continue button", () => {
    it("calls findOrCreateVehicleAction and navigates on success", async () => {
      const user = userEvent.setup();
      mockLookupVehicleAction.mockResolvedValue({
        success: true,
        data: null,
      });
      mockDecodeVinAction.mockResolvedValue({
        success: true,
        data: {
          make: "Nissan",
          model: "Sentra",
          year: 2019,
          trim: null,
        },
      });
      mockFindOrCreateVehicleAction.mockResolvedValue({
        success: true,
        data: {
          vehicle: {
            id: "v1",
            vin: VALID_VIN,
            make: "Nissan",
            model: "Sentra",
            year: 2019,
            trim: null,
            plate: "ABC123",
          },
          isNew: true,
          inspectionCount: 0,
        },
      });

      render(<InspectPage />);
      await user.type(screen.getByLabelText("Número de VIN"), VALID_VIN);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Nissan")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText("Patente"), "ABC123");
      await user.click(screen.getByRole("button", { name: "Continuar" }));

      await waitFor(() => {
        expect(mockFindOrCreateVehicleAction).toHaveBeenCalledWith(
          expect.objectContaining({
            vin: VALID_VIN,
            make: "Nissan",
            model: "Sentra",
            year: 2019,
            trim: null,
          })
        );
        expect(mockPush).toHaveBeenCalledWith("/dashboard/inspect/metadata");
      });
    });
  });
});
