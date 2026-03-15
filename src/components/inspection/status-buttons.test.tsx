import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusButtons } from "./status-buttons";

describe("StatusButtons", () => {
  it("renders 4 status buttons", () => {
    render(<StatusButtons value="not_evaluated" onChange={() => {}} />);
    const buttons = screen.getAllByRole("radio");
    expect(buttons).toHaveLength(4);
  });

  it("renders correct labels", () => {
    render(<StatusButtons value="not_evaluated" onChange={() => {}} />);
    expect(screen.getByText("Bien")).toBeInTheDocument();
    expect(screen.getByText("Att")).toBeInTheDocument();
    expect(screen.getByText("Crit")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("marks the selected button as checked", () => {
    render(<StatusButtons value="good" onChange={() => {}} />);
    const goodButton = screen.getByText("Bien").closest("button");
    expect(goodButton).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with new status on tap", () => {
    const onChange = vi.fn();
    render(<StatusButtons value="not_evaluated" onChange={onChange} />);

    fireEvent.click(screen.getByText("Bien"));
    expect(onChange).toHaveBeenCalledWith("good");
  });

  it("deselects when tapping the selected button (returns to not_evaluated)", () => {
    const onChange = vi.fn();
    render(<StatusButtons value="good" onChange={onChange} />);

    fireEvent.click(screen.getByText("Bien"));
    expect(onChange).toHaveBeenCalledWith("not_evaluated");
  });

  it("selects attention status", () => {
    const onChange = vi.fn();
    render(<StatusButtons value="not_evaluated" onChange={onChange} />);

    fireEvent.click(screen.getByText("Att"));
    expect(onChange).toHaveBeenCalledWith("attention");
  });

  it("selects critical status", () => {
    const onChange = vi.fn();
    render(<StatusButtons value="not_evaluated" onChange={onChange} />);

    fireEvent.click(screen.getByText("Crit"));
    expect(onChange).toHaveBeenCalledWith("critical");
  });

  it("selects not_applicable status", () => {
    const onChange = vi.fn();
    render(<StatusButtons value="not_evaluated" onChange={onChange} />);

    fireEvent.click(screen.getByText("N/A"));
    expect(onChange).toHaveBeenCalledWith("not_applicable");
  });

  it("deselects N/A back to not_evaluated", () => {
    const onChange = vi.fn();
    render(<StatusButtons value="not_applicable" onChange={onChange} />);

    fireEvent.click(screen.getByText("N/A"));
    expect(onChange).toHaveBeenCalledWith("not_evaluated");
  });

  it("has proper ARIA radiogroup role", () => {
    render(<StatusButtons value="not_evaluated" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("applies selected styling to the active button", () => {
    render(<StatusButtons value="critical" onChange={() => {}} />);
    const critButton = screen.getByText("Crit").closest("button");
    expect(critButton?.className).toContain("font-semibold");
  });

  it("unselected buttons do not have font-semibold", () => {
    render(<StatusButtons value="critical" onChange={() => {}} />);
    const goodButton = screen.getByText("Bien").closest("button");
    expect(goodButton?.className).not.toContain("font-semibold");
  });
});
