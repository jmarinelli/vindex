import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemRow } from "./item-row";
import { createTemplateItem } from "../../../../__tests__/helpers/factories";

// Mock @dnd-kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
}));

describe("ItemRow", () => {
  const defaultProps = {
    item: createTemplateItem({ name: "Carrocería", type: "checklist_item" }),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onToggleType: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    isFirst: false,
    isLast: false,
  };

  it("renders item name", () => {
    render(<ItemRow {...defaultProps} />);
    expect(screen.getByText("Carrocería")).toBeInTheDocument();
  });

  it("renders checklist badge for checklist_item type", () => {
    render(<ItemRow {...defaultProps} />);
    expect(screen.getByText("☑ Checklist")).toBeInTheDocument();
  });

  it("renders free text badge for free_text type", () => {
    const item = createTemplateItem({ name: "Notas", type: "free_text" });
    render(<ItemRow {...defaultProps} item={item} />);
    expect(screen.getByText("✎ Texto libre")).toBeInTheDocument();
  });

  it("calls onToggleType when type badge is clicked", async () => {
    const user = userEvent.setup();
    const onToggleType = vi.fn();
    render(<ItemRow {...defaultProps} onToggleType={onToggleType} />);

    await user.click(screen.getByRole("switch"));
    expect(onToggleType).toHaveBeenCalledOnce();
  });

  it("type toggle has correct aria-checked for checklist_item", () => {
    render(<ItemRow {...defaultProps} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("type toggle has correct aria-checked for free_text", () => {
    const item = createTemplateItem({ type: "free_text" });
    render(<ItemRow {...defaultProps} item={item} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<ItemRow {...defaultProps} onDelete={onDelete} />);

    await user.click(screen.getByLabelText("Eliminar item"));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("calls onMoveUp when move up button is clicked", async () => {
    const user = userEvent.setup();
    const onMoveUp = vi.fn();
    render(<ItemRow {...defaultProps} onMoveUp={onMoveUp} />);

    const upBtn = screen.getByLabelText("Mover arriba");
    await user.click(upBtn);
    expect(onMoveUp).toHaveBeenCalledOnce();
  });

  it("disables move up when isFirst", () => {
    render(<ItemRow {...defaultProps} isFirst />);
    expect(screen.getByLabelText("Mover arriba")).toBeDisabled();
  });

  it("disables move down when isLast", () => {
    render(<ItemRow {...defaultProps} isLast />);
    expect(screen.getByLabelText("Mover abajo")).toBeDisabled();
  });

  it("calls onRename when inline edit is confirmed", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<ItemRow {...defaultProps} onRename={onRename} />);

    await user.click(screen.getByText("Carrocería"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Pintura{Enter}");
    expect(onRename).toHaveBeenCalledWith("Pintura");
  });
});
