import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineEdit } from "./inline-edit";

describe("InlineEdit", () => {
  it("renders the value as text by default", () => {
    render(<InlineEdit value="Exterior" onSave={vi.fn()} />);
    expect(screen.getByText("Exterior")).toBeInTheDocument();
  });

  it("switches to edit mode on click", async () => {
    const user = userEvent.setup();
    render(<InlineEdit value="Exterior" onSave={vi.fn()} />);

    await user.click(screen.getByText("Exterior"));
    expect(screen.getByRole("textbox")).toHaveValue("Exterior");
  });

  it("confirms value on Enter", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="Exterior" onSave={onSave} />);

    await user.click(screen.getByText("Exterior"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Interior{Enter}");

    expect(onSave).toHaveBeenCalledWith("Interior");
  });

  it("cancels and reverts on Escape", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="Exterior" onSave={onSave} />);

    await user.click(screen.getByText("Exterior"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Changed");
    await user.keyboard("{Escape}");

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Exterior")).toBeInTheDocument();
  });

  it("reverts to original value on blur with empty string", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="Exterior" onSave={onSave} />);

    await user.click(screen.getByText("Exterior"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.tab(); // trigger blur

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Exterior")).toBeInTheDocument();
  });

  it("confirms trimmed value on blur with valid text", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="Exterior" onSave={onSave} />);

    await user.click(screen.getByText("Exterior"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "  New Name  ");
    await user.tab();

    expect(onSave).toHaveBeenCalledWith("New Name");
  });

  it("starts in edit mode when autoFocus is true", () => {
    render(<InlineEdit value="Exterior" onSave={vi.fn()} autoFocus />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders placeholder when value is empty", () => {
    render(
      <InlineEdit
        value=""
        onSave={vi.fn()}
        placeholder="Enter name"
      />
    );
    expect(screen.getByText("Enter name")).toBeInTheDocument();
  });

  it("is accessible via keyboard (Enter to start editing)", async () => {
    const user = userEvent.setup();
    render(<InlineEdit value="Exterior" onSave={vi.fn()} />);

    const span = screen.getByRole("button");
    span.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
