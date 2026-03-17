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

const mockSignOut = vi.fn();

let sessionState: {
  data: { user: { name: string; role: string } } | null;
  status: "authenticated" | "unauthenticated" | "loading";
} = { data: null, status: "unauthenticated" };

vi.mock("next-auth/react", () => ({
  useSession: () => sessionState,
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

function mockUnauthenticated() {
  sessionState = { data: null, status: "unauthenticated" };
}

function mockLoading() {
  sessionState = { data: null, status: "loading" };
}

function mockAuthenticated(
  name = "Carlos Martínez",
  role: "user" | "platform_admin" = "user"
) {
  sessionState = {
    data: { user: { name, role } },
    status: "authenticated",
  };
}

describe("LandingHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    mockUnauthenticated();
  });

  describe("unauthenticated", () => {
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

    it("does not render avatar or dropdown", () => {
      render(<LandingHeader />);
      expect(screen.queryByText("CM")).toBeNull();
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });

  describe("loading", () => {
    it("renders empty right-side area (no Login, no avatar)", () => {
      mockLoading();
      render(<LandingHeader />);
      expect(screen.queryByText("Login")).toBeNull();
      expect(screen.queryByText("CM")).toBeNull();
    });
  });

  describe("authenticated (user role)", () => {
    beforeEach(() => {
      mockAuthenticated("Carlos Martínez", "user");
    });

    it("renders avatar with correct initials", () => {
      render(<LandingHeader />);
      expect(screen.getAllByText("CM").length).toBeGreaterThan(0);
    });

    it("renders first name on desktop", () => {
      render(<LandingHeader />);
      expect(screen.getByText("Carlos")).toBeDefined();
    });

    it("does not render Login button", () => {
      render(<LandingHeader />);
      expect(screen.queryByText("Login")).toBeNull();
    });

    it("click avatar opens dropdown with dashboard and sign out", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByText("Carlos"));

      expect(screen.getByRole("menu")).toBeDefined();
      expect(screen.getByText("Ir al dashboard")).toBeDefined();
      expect(screen.getByText("Cerrar sesión")).toBeDefined();
    });

    it("dashboard link goes to /dashboard for user role", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByText("Carlos"));
      const dashLink = screen.getByText("Ir al dashboard");
      expect(dashLink.closest("a")?.getAttribute("href")).toBe("/dashboard");
    });

    it("sign out calls signOut with redirect: false", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByText("Carlos"));
      await user.click(screen.getByText("Cerrar sesión"));

      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    });

    it("closes dropdown on click outside", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByText("Carlos"));
      expect(screen.getByRole("menu")).toBeDefined();

      // Click outside
      await user.click(document.body);
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("closes dropdown on Escape", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByText("Carlos"));
      expect(screen.getByRole("menu")).toBeDefined();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });

  describe("authenticated (admin role)", () => {
    beforeEach(() => {
      mockAuthenticated("Admin User", "platform_admin");
    });

    it("dropdown shows 'Admin panel' linking to /admin", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByText("Admin"));
      const adminLink = screen.getByText("Admin panel");
      expect(adminLink.closest("a")?.getAttribute("href")).toBe("/admin");
    });
  });

  describe("mobile menu (unauthenticated)", () => {
    it("renders hamburger button with aria-label", () => {
      render(<LandingHeader />);
      const hamburger = screen.getByLabelText("Abrir menú");
      expect(hamburger).toBeDefined();
      expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    });

    it("opens overlay with login button", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      expect(screen.getByLabelText("Cerrar menú")).toBeDefined();
      expect(screen.getByText("Iniciar sesión")).toBeDefined();
    });

    it("does not show user info row", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      expect(screen.queryByText("Carlos Martínez")).toBeNull();
    });

    it("closes on close button click", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      await user.click(screen.getByLabelText("Cerrar menú"));
      expect(screen.queryByLabelText("Cerrar menú")).toBeNull();
    });

    it("closes when nav link is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      await user.click(screen.getByText("Contacto"));
      expect(screen.queryByLabelText("Cerrar menú")).toBeNull();
    });

    it("has contact link to #contacto", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      const contactLink = screen.getByText("Contacto");
      expect(contactLink.closest("a")?.getAttribute("href")).toBe("#contacto");
    });

    it("overlay has role dialog", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      expect(screen.getByRole("dialog")).toBeDefined();
    });
  });

  describe("mobile menu (authenticated)", () => {
    beforeEach(() => {
      mockAuthenticated("Carlos Martínez", "user");
    });

    it("shows user info (avatar + full name)", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      expect(screen.getByText("Carlos Martínez")).toBeDefined();
    });

    it("shows 'Ir al dashboard' button", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      const dashLink = screen.getByText("Ir al dashboard");
      expect(dashLink.closest("a")?.getAttribute("href")).toBe("/dashboard");
    });

    it("shows 'Cerrar sesión' link that signs out", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      await user.click(screen.getByText("Cerrar sesión"));

      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    });

    it("does not show 'Iniciar sesión' button", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      expect(screen.queryByText("Iniciar sesión")).toBeNull();
    });
  });

  describe("mobile menu (admin)", () => {
    beforeEach(() => {
      mockAuthenticated("Admin User", "platform_admin");
    });

    it("shows 'Admin panel' instead of 'Ir al dashboard'", async () => {
      const user = userEvent.setup();
      render(<LandingHeader />);

      await user.click(screen.getByLabelText("Abrir menú"));
      expect(screen.getByText("Admin panel")).toBeDefined();
      expect(screen.queryByText("Ir al dashboard")).toBeNull();
    });
  });

  describe("initials extraction", () => {
    it("extracts two-word initials: 'Carlos Martínez' → 'CM'", () => {
      mockAuthenticated("Carlos Martínez");
      render(<LandingHeader />);
      expect(screen.getAllByText("CM").length).toBeGreaterThan(0);
    });

    it("extracts single-word initials: 'Carlos' → 'CA'", () => {
      mockAuthenticated("Carlos");
      render(<LandingHeader />);
      expect(screen.getAllByText("CA").length).toBeGreaterThan(0);
    });
  });

  it("has navigation landmark with aria-label", () => {
    render(<LandingHeader />);
    const navs = screen.getAllByLabelText("Navegación principal");
    expect(navs.length).toBeGreaterThan(0);
  });
});
