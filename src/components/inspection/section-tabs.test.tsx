import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionTabs } from "./section-tabs";

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockSections = [
  {
    id: "s1",
    name: "Exterior",
    order: 0,
    items: [
      { id: "i1", name: "Carrocería", order: 0, type: "checklist_item" as const },
      { id: "i2", name: "Vidrios", order: 1, type: "checklist_item" as const },
    ],
  },
  {
    id: "s2",
    name: "Motor",
    order: 1,
    items: [
      { id: "i3", name: "Aceite", order: 0, type: "checklist_item" as const },
    ],
  },
  {
    id: "s3",
    name: "Interior",
    order: 2,
    items: [],
  },
];

describe("SectionTabs", () => {
  it("renders all section tabs", () => {
    render(
      <SectionTabs
        sections={mockSections}
        activeIndex={0}
        onSelect={() => {}}
        evaluatedCounts={{}}
      />
    );

    expect(screen.getByText("Exterior")).toBeInTheDocument();
    expect(screen.getByText("Motor")).toBeInTheDocument();
    expect(screen.getByText("Interior")).toBeInTheDocument();
  });

  it("marks active tab with aria-selected", () => {
    render(
      <SectionTabs
        sections={mockSections}
        activeIndex={1}
        onSelect={() => {}}
        evaluatedCounts={{}}
      />
    );

    const motorTab = screen.getByText("Motor").closest("button");
    expect(motorTab).toHaveAttribute("aria-selected", "true");

    const exteriorTab = screen.getByText("Exterior").closest("button");
    expect(exteriorTab).toHaveAttribute("aria-selected", "false");
  });

  it("calls onSelect when tab is tapped", () => {
    const onSelect = vi.fn();
    render(
      <SectionTabs
        sections={mockSections}
        activeIndex={0}
        onSelect={onSelect}
        evaluatedCounts={{}}
      />
    );

    fireEvent.click(screen.getByText("Motor"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("shows check icon for fully evaluated sections", () => {
    render(
      <SectionTabs
        sections={mockSections}
        activeIndex={0}
        onSelect={() => {}}
        evaluatedCounts={{ s1: 2, s2: 0 }}
      />
    );

    // Exterior (s1) has 2 items and 2 evaluated → check icon present
    // The Check icon from lucide renders as an SVG
    const exteriorTab = screen.getByText("Exterior").closest("button");
    const svg = exteriorTab?.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("does not show check icon for partially evaluated sections", () => {
    render(
      <SectionTabs
        sections={mockSections}
        activeIndex={0}
        onSelect={() => {}}
        evaluatedCounts={{ s1: 1 }}
      />
    );

    const exteriorTab = screen.getByText("Exterior").closest("button");
    const svg = exteriorTab?.querySelector("svg");
    expect(svg).toBeFalsy();
  });

  it("has tablist role", () => {
    render(
      <SectionTabs
        sections={mockSections}
        activeIndex={0}
        onSelect={() => {}}
        evaluatedCounts={{}}
      />
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
