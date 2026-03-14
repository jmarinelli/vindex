import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "./page";

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

// Mock client components
vi.mock("@/components/landing/landing-header", () => ({
  LandingHeader: () => <nav data-testid="landing-header">Header</nav>,
}));

vi.mock("@/components/landing/contact-form", () => ({
  ContactForm: () => <form data-testid="contact-form">Form</form>,
}));

vi.mock("@/components/ui/logo", () => ({
  Logo: ({ size, className }: { size?: string; className?: string }) => (
    <span data-testid="logo" data-size={size} className={className}>
      VinDex
    </span>
  ),
}));

describe("LandingPage", () => {
  it("renders the landing header", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("landing-header")).toBeDefined();
  });

  it("renders hero section with tagline and subheading", () => {
    render(<LandingPage />);
    expect(
      screen.getByText("El historial que cada auto debería tener.")
    ).toBeDefined();
    expect(
      screen.getByText(/VinDex construye identidad vehicular documentada/)
    ).toBeDefined();
  });

  it("renders hero CTAs", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("Cómo funciona").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("¿Sos inspector? Contactanos")).toBeDefined();
  });

  it("renders trust indicator", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(
        /Identidad vehicular documentada.*Inmutable.*Profesional/
      )
    ).toBeDefined();
  });

  it("renders the-idea section", () => {
    render(<LandingPage />);
    expect(
      screen.getByText("Hoy, comprar un usado es un acto de fe")
    ).toBeDefined();
    expect(
      screen.getByText(/No hay forma confiable de saber qué le hicieron/)
    ).toBeDefined();
  });

  it("renders how-it-works section with 4 steps", () => {
    render(<LandingPage />);
    expect(
      screen.getByText("Un profesional evalúa el vehículo")
    ).toBeDefined();
    expect(
      screen.getByText("El resultado queda sellado al VIN")
    ).toBeDefined();
    expect(
      screen.getByText("El cliente recibe un informe profesional")
    ).toBeDefined();
    expect(
      screen.getByText("El vehículo acumula su historia")
    ).toBeDefined();
  });

  it("renders buyers section with 3 feature cards", () => {
    render(<LandingPage />);
    expect(screen.getByText("Confianza con evidencia")).toBeDefined();
    expect(screen.getByText("Consultá el historial")).toBeDefined();
    expect(screen.getByText("Inmutable por diseño")).toBeDefined();
    expect(screen.getByText("Transparencia total")).toBeDefined();
  });

  it("renders inspectors section with 3 feature cards", () => {
    render(<LandingPage />);
    expect(
      screen.getByText("Tu herramienta, tu marca, tu historial")
    ).toBeDefined();
    expect(screen.getByText("Una herramienta superior")).toBeDefined();
    expect(screen.getByText("Tu marca, no la nuestra")).toBeDefined();
    expect(screen.getByText("Reputación que se acumula")).toBeDefined();
  });

  it("renders vehicle timeline section with 4 events", () => {
    render(<LandingPage />);
    expect(
      screen.getByText("Un VIN, toda su vida documentada")
    ).toBeDefined();
    expect(screen.getByText("Inspección pre-compra")).toBeDefined();
    expect(screen.getByText("Cambio de aceite y filtros")).toBeDefined();
    expect(screen.getByText("Alineación y balanceo")).toBeDefined();
    expect(screen.getByText("Inspección periódica")).toBeDefined();
  });

  it("renders contact section with form", () => {
    render(<LandingPage />);
    expect(screen.getByText("¿Sos inspector?")).toBeDefined();
    expect(
      screen.getByText("Contactanos para empezar a usar VinDex.")
    ).toBeDefined();
    expect(screen.getByTestId("contact-form")).toBeDefined();
  });

  it("renders footer with links and copyright", () => {
    render(<LandingPage />);
    expect(screen.getByText("Privacidad")).toBeDefined();
    expect(screen.getByText("Términos")).toBeDefined();
    expect(screen.getByText("contacto@vindex.app")).toBeDefined();
    expect(
      screen.getByText(/© 2026 VinDex\. Todos los derechos reservados\./)
    ).toBeDefined();
  });

  it("renders skip-to-content link", () => {
    render(<LandingPage />);
    expect(screen.getByText("Ir al contenido")).toBeDefined();
  });

  it("has correct section anchor IDs", () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector("#como-funciona")).toBeDefined();
    expect(container.querySelector("#compradores")).toBeDefined();
    expect(container.querySelector("#inspectores")).toBeDefined();
    expect(container.querySelector("#historial")).toBeDefined();
    expect(container.querySelector("#contacto")).toBeDefined();
  });

  it("renders step numbers 1 through 4", () => {
    render(<LandingPage />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
  });
});
