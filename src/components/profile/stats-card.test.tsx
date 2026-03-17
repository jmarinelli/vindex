import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "./stats-card";
import type { NodeStats } from "@/lib/services/node";

function makeStats(overrides?: Partial<NodeStats>): NodeStats {
  return {
    inspectionCount: 24,
    operatingSince: new Date("2024-03-15"),
    avgPhotosPerReport: 8.3,
    avgObservationsPerReport: 5.2,
    avgSectionsPerReport: 4.1,
    ...overrides,
  };
}

describe("StatsCard", () => {
  it("renders all stat tiles with correct values", () => {
    render(<StatsCard stats={makeStats()} />);
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("verificaciones")).toBeInTheDocument();
    expect(screen.getByText("Mar 2024")).toBeInTheDocument();
    expect(screen.getByText("verificando desde")).toBeInTheDocument();
    expect(screen.getByText("8.3")).toBeInTheDocument();
    expect(screen.getByText("fotos/reporte")).toBeInTheDocument();
    expect(screen.getByText("5.2")).toBeInTheDocument();
    expect(screen.getByText("obs/reporte")).toBeInTheDocument();
    expect(screen.getByText("4.1")).toBeInTheDocument();
    expect(screen.getByText("secciones/rep")).toBeInTheDocument();
  });

  it("renders section title", () => {
    render(<StatsCard stats={makeStats()} />);
    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
  });

  it("is hidden when zero inspections", () => {
    const { container } = render(
      <StatsCard stats={makeStats({ inspectionCount: 0 })} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("hides operating since when null", () => {
    render(
      <StatsCard stats={makeStats({ operatingSince: null })} />
    );
    expect(
      screen.queryByText("verificando desde")
    ).not.toBeInTheDocument();
  });

  it("has aria-labels on stat tiles", () => {
    render(<StatsCard stats={makeStats()} />);
    expect(screen.getByLabelText("24 verificaciones")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mar 2024 verificando desde")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("8.3 fotos/reporte")).toBeInTheDocument();
  });
});
