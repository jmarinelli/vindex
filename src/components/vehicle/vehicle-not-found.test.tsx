import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VehicleNotFound } from "./vehicle-not-found";

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

describe("VehicleNotFound", () => {
  it("renders not-found title", () => {
    render(<VehicleNotFound />);
    expect(
      screen.getByText("Vehículo no encontrado")
    ).toBeInTheDocument();
  });

  it("renders description message", () => {
    render(<VehicleNotFound />);
    expect(
      screen.getByText("No se encontró un vehículo con el VIN proporcionado.")
    ).toBeInTheDocument();
  });

  it("renders link to home", () => {
    render(<VehicleNotFound />);
    const link = screen.getByText("Ir al inicio →");
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("has data-testid attribute", () => {
    render(<VehicleNotFound />);
    expect(screen.getByTestId("vehicle-not-found")).toBeInTheDocument();
  });
});
