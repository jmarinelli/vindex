import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShellDashboard } from "./shell-dashboard";

// Mock next-auth/react
const mockSession = {
  data: {
    user: {
      id: "user-1",
      name: "Inspector Demo",
      email: "demo@vindex.app",
      role: "user",
      nodeId: "node-1",
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  status: "authenticated" as const,
  update: vi.fn(),
};

const mockSignOut = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockSession,
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// Mock next/link
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

describe("ShellDashboard", () => {
  it("renders children content", () => {
    render(
      <ShellDashboard>
        <div>Dashboard Content</div>
      </ShellDashboard>
    );
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(
      <ShellDashboard title="Editor de Template">
        <div>Content</div>
      </ShellDashboard>
    );
    expect(screen.getByText("Editor de Template")).toBeInTheDocument();
  });

  it("renders default title 'Dashboard'", () => {
    render(
      <ShellDashboard>
        <div>Content</div>
      </ShellDashboard>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders the user first name from session", () => {
    render(
      <ShellDashboard>
        <div>Content</div>
      </ShellDashboard>
    );
    expect(screen.getByText("Inspector")).toBeInTheDocument();
  });

  it("renders user menu with sign-out option", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(
      <ShellDashboard>
        <div>Content</div>
      </ShellDashboard>
    );
    // Open the dropdown
    await user.click(screen.getByText("Inspector"));
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("renders logo link to dashboard", () => {
    render(
      <ShellDashboard>
        <div>Content</div>
      </ShellDashboard>
    );
    const logoLink = screen.getAllByRole("link")[0];
    expect(logoLink).toHaveAttribute("href", "/dashboard");
  });

  it("calls signOut when 'Cerrar sesión' is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(
      <ShellDashboard>
        <div>Content</div>
      </ShellDashboard>
    );

    // Open the dropdown first
    await user.click(screen.getByText("Inspector"));
    await user.click(screen.getByText("Cerrar sesión"));
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
  });
});
