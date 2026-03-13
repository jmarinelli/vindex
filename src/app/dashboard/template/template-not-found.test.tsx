import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TemplateNotFound } from "./template-not-found";

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

describe("TemplateNotFound", () => {
  it("renders the error message", () => {
    render(<TemplateNotFound />);
    expect(
      screen.getByText("No se encontró un template")
    ).toBeInTheDocument();
    expect(screen.getByText("Contactá soporte.")).toBeInTheDocument();
  });

  it("renders a link back to dashboard", () => {
    render(<TemplateNotFound />);
    const link = screen.getByRole("link", { name: /volver al dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
