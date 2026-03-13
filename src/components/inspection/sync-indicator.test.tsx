import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncIndicator } from "./sync-indicator";

describe("SyncIndicator", () => {
  it("shows 'Guardado' for saved state", () => {
    render(<SyncIndicator status="saved" />);
    expect(screen.getByText("Guardado")).toBeInTheDocument();
  });

  it("shows 'Sincronizando...' for syncing state", () => {
    render(<SyncIndicator status="syncing" />);
    expect(screen.getByText("Sincronizando...")).toBeInTheDocument();
  });

  it("shows 'Sincronizado' for synced state", () => {
    render(<SyncIndicator status="synced" />);
    expect(screen.getByText("Sincronizado")).toBeInTheDocument();
  });

  it("shows 'Sin conexión' for offline state", () => {
    render(<SyncIndicator status="offline" />);
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
  });

  it("has aria-live for screen reader updates", () => {
    const { container } = render(<SyncIndicator status="saved" />);
    const span = container.querySelector("[aria-live]");
    expect(span).toHaveAttribute("aria-live", "polite");
  });

  it("shows spinning animation for syncing", () => {
    const { container } = render(<SyncIndicator status="syncing" />);
    const svg = container.querySelector("svg");
    // SVG className in jsdom is an SVGAnimatedString; check getAttribute instead
    expect(svg?.getAttribute("class")).toContain("animate-spin");
  });
});
