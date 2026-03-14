import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IdentityCard } from "./identity-card";
import type { Node } from "@/db/schema";

function makeNode(overrides?: Partial<Node>): Node {
  return {
    id: "n-1",
    type: "inspector",
    slug: "taller-martinez",
    displayName: "Taller Martínez",
    logoUrl: null,
    brandColor: null,
    contactEmail: "contacto@tallermartinez.com",
    contactPhone: "+54 11 4555-1234",
    address: "Av. Corrientes 4500, CABA",
    bio: "Mecánico especializado en pre-compra con 12 años de experiencia.",
    status: "active",
    verifiedAt: new Date("2024-03-01"),
    createdAt: new Date("2024-03-01"),
    ...overrides,
  };
}

describe("IdentityCard", () => {
  it("renders node name", () => {
    render(<IdentityCard node={makeNode()} />);
    expect(screen.getByText("Taller Martínez")).toBeInTheDocument();
  });

  it("renders verified label", () => {
    render(<IdentityCard node={makeNode()} />);
    expect(screen.getByText("Inspector verificado")).toBeInTheDocument();
  });

  it("renders bio when present", () => {
    render(<IdentityCard node={makeNode()} />);
    expect(
      screen.getByText(/Mecánico especializado/)
    ).toBeInTheDocument();
  });

  it("hides bio when null", () => {
    render(<IdentityCard node={makeNode({ bio: null })} />);
    expect(screen.queryByText(/Mecánico especializado/)).not.toBeInTheDocument();
  });

  it("renders email as mailto link", () => {
    render(<IdentityCard node={makeNode()} />);
    const emailLink = screen.getByText("contacto@tallermartinez.com");
    expect(emailLink.closest("a")).toHaveAttribute(
      "href",
      "mailto:contacto@tallermartinez.com"
    );
  });

  it("hides email when null", () => {
    render(<IdentityCard node={makeNode({ contactEmail: "test@test.com" })} />);
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
  });

  it("renders phone as tel link", () => {
    render(<IdentityCard node={makeNode()} />);
    const phoneLink = screen.getByText("+54 11 4555-1234");
    expect(phoneLink.closest("a")).toHaveAttribute(
      "href",
      "tel:+54 11 4555-1234"
    );
  });

  it("hides phone when null", () => {
    render(<IdentityCard node={makeNode({ contactPhone: null })} />);
    expect(screen.queryByText("+54 11 4555-1234")).not.toBeInTheDocument();
  });

  it("renders address when present", () => {
    render(<IdentityCard node={makeNode()} />);
    expect(
      screen.getByText("Av. Corrientes 4500, CABA")
    ).toBeInTheDocument();
  });

  it("hides address when null", () => {
    render(<IdentityCard node={makeNode({ address: null })} />);
    expect(
      screen.queryByText("Av. Corrientes 4500, CABA")
    ).not.toBeInTheDocument();
  });

  it("renders fallback initial when no logo", () => {
    render(<IdentityCard node={makeNode({ logoUrl: null })} />);
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByLabelText("Taller Martínez")).toBeInTheDocument();
  });

  it("renders logo image when logoUrl is present", () => {
    render(
      <IdentityCard
        node={makeNode({ logoUrl: "https://example.com/logo.jpg" })}
      />
    );
    const img = screen.getByAltText("Taller Martínez logo");
    expect(img).toHaveAttribute("src", "https://example.com/logo.jpg");
  });

  it("uses brand color for top border when set", () => {
    const { container } = render(
      <IdentityCard node={makeNode({ brandColor: "#FF5500" })} />
    );
    const border = container.querySelector("[data-testid='identity-card'] > div");
    expect(border).toHaveStyle({ backgroundColor: "#FF5500" });
  });

  it("uses brand-primary for top border when no brand color", () => {
    const { container } = render(
      <IdentityCard node={makeNode({ brandColor: null })} />
    );
    const border = container.querySelector("[data-testid='identity-card'] > div");
    expect(border).toHaveStyle({
      backgroundColor: "var(--color-brand-primary)",
    });
  });

  it("has verified aria-label", () => {
    render(<IdentityCard node={makeNode()} />);
    expect(
      screen.getByLabelText("Inspector verificado por VinDex")
    ).toBeInTheDocument();
  });
});
