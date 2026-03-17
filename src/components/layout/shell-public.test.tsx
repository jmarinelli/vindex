import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShellPublic } from "./shell-public";

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

describe("ShellPublic", () => {
  it("renders children content", () => {
    render(
      <ShellPublic>
        <div>Public Content</div>
      </ShellPublic>
    );
    expect(screen.getByText("Public Content")).toBeInTheDocument();
  });

  it("renders header with logo", () => {
    render(
      <ShellPublic>
        <div>Content</div>
      </ShellPublic>
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/");
  });

  it("renders footer with 'Registrado en' text", () => {
    render(
      <ShellPublic>
        <div>Content</div>
      </ShellPublic>
    );
    expect(screen.getByText("Registrado en")).toBeInTheDocument();
  });

  it("renders footer link to home", () => {
    render(
      <ShellPublic>
        <div>Content</div>
      </ShellPublic>
    );
    const links = screen.getAllByRole("link");
    // Header link + footer link
    expect(links.length).toBeGreaterThanOrEqual(2);
    const footerLink = links[links.length - 1];
    expect(footerLink).toHaveAttribute("href", "/");
  });
});
