import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

// Mock next-auth/react
const mockSignIn = vi.fn();
const mockGetSession = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Logo component
vi.mock("@/components/ui/logo", () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("button", { name: "Ingresar" })
    ).toBeInTheDocument();
  });

  it("renders logo", () => {
    render(<LoginForm />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("renders 'Iniciar sesión' heading", () => {
    render(<LoginForm />);
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("calls signIn with credentials on submit", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ user: { role: "user" } });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "admin@vindex.app");
    await user.type(screen.getByLabelText("Contraseña"), "admin123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "admin@vindex.app",
      password: "admin123",
      redirect: false,
    });
  });

  it("redirects to /dashboard on successful login", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ user: { role: "user" } });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "admin@vindex.app");
    await user.type(screen.getByLabelText("Contraseña"), "admin123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error message on failed login", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "wrong@email.com");
    await user.type(screen.getByLabelText("Contraseña"), "wrong");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(
      screen.getByText("Email o contraseña incorrectos")
    ).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    // Make signIn hang
    mockSignIn.mockReturnValue(new Promise(() => {}));
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "admin@vindex.app");
    await user.type(screen.getByLabelText("Contraseña"), "admin123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(screen.getByText("Ingresando...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has required attribute on email and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Contraseña")).toBeRequired();
  });

  it("email input has type email", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  it("password input has type password", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "type",
      "password"
    );
  });
});
