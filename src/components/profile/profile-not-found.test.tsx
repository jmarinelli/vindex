import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileNotFound } from "./profile-not-found";

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

describe("ProfileNotFound", () => {
  it("renders not-found title", () => {
    render(<ProfileNotFound />);
    expect(
      screen.getByText("Inspector no encontrado")
    ).toBeInTheDocument();
  });

  it("renders description message", () => {
    render(<ProfileNotFound />);
    expect(
      screen.getByText("El perfil que buscás no existe o no está disponible.")
    ).toBeInTheDocument();
  });

  it("renders link to home", () => {
    render(<ProfileNotFound />);
    const link = screen.getByText("Ir al inicio →");
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });
});
