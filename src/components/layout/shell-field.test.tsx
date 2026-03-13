import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShellField } from "./shell-field";

describe("ShellField", () => {
  it("renders children content", () => {
    render(
      <ShellField>
        <div>Field Content</div>
      </ShellField>
    );
    expect(screen.getByText("Field Content")).toBeInTheDocument();
  });

  it("renders default title 'Inspección'", () => {
    render(
      <ShellField>
        <div>Content</div>
      </ShellField>
    );
    expect(screen.getByText("Inspección")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(
      <ShellField title="Pre-Compra">
        <div>Content</div>
      </ShellField>
    );
    expect(screen.getByText("Pre-Compra")).toBeInTheDocument();
  });

  it("renders progress text when provided", () => {
    render(
      <ShellField progress="3/9">
        <div>Content</div>
      </ShellField>
    );
    expect(screen.getByText("3/9")).toBeInTheDocument();
  });

  it("does not render progress when not provided", () => {
    render(
      <ShellField>
        <div>Content</div>
      </ShellField>
    );
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
  });

  it("renders close button when onClose is provided", () => {
    render(
      <ShellField onClose={vi.fn()}>
        <div>Content</div>
      </ShellField>
    );
    expect(screen.getByLabelText("Cerrar")).toBeInTheDocument();
  });

  it("does not render close button when onClose is not provided", () => {
    render(
      <ShellField>
        <div>Content</div>
      </ShellField>
    );
    expect(screen.queryByLabelText("Cerrar")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ShellField onClose={onClose}>
        <div>Content</div>
      </ShellField>
    );

    await user.click(screen.getByLabelText("Cerrar"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders navigation buttons", () => {
    render(
      <ShellField>
        <div>Content</div>
      </ShellField>
    );
    expect(screen.getByText(/Anterior/)).toBeInTheDocument();
    expect(screen.getByText(/Siguiente/)).toBeInTheDocument();
  });
});
