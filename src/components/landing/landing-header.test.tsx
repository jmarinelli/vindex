import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingHeader } from "./landing-header";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/logo", () => ({
  Logo: ({ size, className }: { size?: string; className?: string }) => (
    <span data-testid="logo" data-size={size} className={className}>
      VinDex
    </span>
  ),
}));

describe("LandingHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  it("renders logo", () => {
    render(<LandingHeader />);
    expect(screen.getByTestId("logo")).toBeDefined();
  });

  it("renders nav links on desktop", () => {
    render(<LandingHeader />);

    expect(screen.getByText("Cómo funciona")).toBeDefined();
    expect(screen.getByText("Para compradores")).toBeDefined();
    expect(screen.getByText("Para inspectores")).toBeDefined();
  });

  it("renders login button", () => {
    render(<LandingHeader />);
    expect(screen.getByText("Login")).toBeDefined();
  });

  it("login button links to /login", () => {
    render(<LandingHeader />);
    const loginLink = screen.getByText("Login");
    expect(loginLink.closest("a")?.getAttribute("href")).toBe("/login");
  });

  it("nav links have correct hrefs", () => {
    render(<LandingHeader />);

    expect(
      screen.getByText("Cómo funciona").closest("a")?.getAttribute("href")
    ).toBe("#como-funciona");
    expect(
      screen.getByText("Para compradores").closest("a")?.getAttribute("href")
    ).toBe("#compradores");
    expect(
      screen.getByText("Para inspectores").closest("a")?.getAttribute("href")
    ).toBe("#inspectores");
  });

  it("renders hamburger button with aria-label", () => {
    render(<LandingHeader />);
    const hamburger = screen.getByLabelText("Abrir menú");
    expect(hamburger).toBeDefined();
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens mobile menu on hamburger click", async () => {
    const user = userEvent.setup();
    render(<LandingHeader />);

    await user.click(screen.getByLabelText("Abrir menú"));

    expect(screen.getByLabelText("Cerrar menú")).toBeDefined();
    expect(screen.getByText("Contacto")).toBeDefined();
    expect(screen.getByText("Iniciar sesión")).toBeDefined();
  });

  it("closes mobile menu on close button click", async () => {
    const user = userEvent.setup();
    render(<LandingHeader />);

    await user.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getByLabelText("Cerrar menú")).toBeDefined();

    await user.click(screen.getByLabelText("Cerrar menú"));

    expect(screen.queryByLabelText("Cerrar menú")).toBeNull();
  });

  it("closes mobile menu when nav link is clicked", async () => {
    const user = userEvent.setup();
    render(<LandingHeader />);

    await user.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getByLabelText("Cerrar menú")).toBeDefined();

    // Click the "Contacto" link that only appears in mobile menu
    await user.click(screen.getByText("Contacto"));

    expect(screen.queryByLabelText("Cerrar menú")).toBeNull();
  });

  it("mobile menu has contact link to #contacto", async () => {
    const user = userEvent.setup();
    render(<LandingHeader />);

    await user.click(screen.getByLabelText("Abrir menú"));
    const contactLink = screen.getByText("Contacto");
    expect(contactLink.closest("a")?.getAttribute("href")).toBe("#contacto");
  });

  it("mobile menu overlay has role dialog", async () => {
    const user = userEvent.setup();
    render(<LandingHeader />);

    await user.click(screen.getByLabelText("Abrir menú"));

    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("has navigation landmark with aria-label", () => {
    render(<LandingHeader />);
    const navs = screen.getAllByLabelText("Navegación principal");
    expect(navs.length).toBeGreaterThan(0);
  });
});
