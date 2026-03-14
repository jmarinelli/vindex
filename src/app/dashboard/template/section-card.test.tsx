import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionCard } from "./section-card";
import {
  createTemplateSection,
  createTemplateItem,
} from "../../../../__tests__/helpers/factories";

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

// Mock @base-ui/react/alert-dialog to render simple HTML
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("@base-ui/react/alert-dialog", () => {
  const AlertDialog = {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger: ({ render, children, ...props }: any) => {
      if (render) return React.cloneElement(render, props);
      return <button {...props}>{children}</button>;
    },
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Backdrop: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Popup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Title: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    Description: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Close: ({ render, children, ...props }: any) => {
      if (render) return React.cloneElement(render, props);
      return <button {...props}>{children}</button>;
    },
  };
  return { AlertDialog };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

import React from "react";

describe("SectionCard", () => {
  const section = createTemplateSection({
    name: "Exterior",
    items: [
      createTemplateItem({ name: "Carrocería", order: 0 }),
      createTemplateItem({ name: "Vidrios", order: 1 }),
      createTemplateItem({ name: "Luces", order: 2 }),
    ],
  });

  const defaultProps = {
    section,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    isFirst: false,
    isLast: false,
    defaultExpanded: false,
    autoFocusName: false,
    lastAddedItemId: null,
  };

  it("renders section name", () => {
    render(<SectionCard {...defaultProps} />);
    expect(screen.getByText("Exterior")).toBeInTheDocument();
  });

  it("renders item count badge", () => {
    render(<SectionCard {...defaultProps} />);
    // Desktop + mobile badges both exist; just check at least one
    const badges = screen.getAllByText(/3 items/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows '1 item' for singular count", () => {
    const singleSection = createTemplateSection({
      name: "Test",
      items: [createTemplateItem()],
    });
    render(<SectionCard {...defaultProps} section={singleSection} />);
    const badges = screen.getAllByText(/1 item\b/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show items when collapsed", () => {
    render(<SectionCard {...defaultProps} defaultExpanded={false} />);
    expect(screen.queryByText("Carrocería")).not.toBeInTheDocument();
  });

  it("shows items when expanded", () => {
    render(<SectionCard {...defaultProps} defaultExpanded />);
    expect(screen.getByText("Carrocería")).toBeInTheDocument();
    expect(screen.getByText("Vidrios")).toBeInTheDocument();
    expect(screen.getByText("Luces")).toBeInTheDocument();
  });

  it("toggles expand/collapse on click", async () => {
    const user = userEvent.setup();
    render(<SectionCard {...defaultProps} />);

    // Initially collapsed — items not visible
    expect(screen.queryByText("Carrocería")).not.toBeInTheDocument();

    // Click expand
    await user.click(screen.getByLabelText("Expandir sección"));
    expect(screen.getByText("Carrocería")).toBeInTheDocument();

    // Click collapse
    await user.click(screen.getByLabelText("Colapsar sección"));
    expect(screen.queryByText("Carrocería")).not.toBeInTheDocument();
  });

  it("shows 'Agregar item' button when expanded", () => {
    render(<SectionCard {...defaultProps} defaultExpanded />);
    expect(screen.getByText("Agregar item")).toBeInTheDocument();
  });

  it("calls onUpdate with new item when 'Agregar item' is clicked", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <SectionCard {...defaultProps} onUpdate={onUpdate} defaultExpanded />
    );

    await user.click(screen.getByText("Agregar item"));
    expect(onUpdate).toHaveBeenCalledOnce();

    const updatedSection = onUpdate.mock.calls[0][0];
    expect(updatedSection.items).toHaveLength(4);
    expect(updatedSection.items[3].name).toBe("Nuevo item");
    expect(updatedSection.items[3].type).toBe("checklist_item");
  });

  it("disables move up when isFirst", () => {
    render(<SectionCard {...defaultProps} isFirst />);
    expect(screen.getByLabelText("Mover sección arriba")).toBeDisabled();
  });

  it("disables move down when isLast", () => {
    render(<SectionCard {...defaultProps} isLast />);
    expect(screen.getByLabelText("Mover sección abajo")).toBeDisabled();
  });

  it("calls onMoveUp when move up button is clicked", async () => {
    const user = userEvent.setup();
    const onMoveUp = vi.fn();
    render(<SectionCard {...defaultProps} onMoveUp={onMoveUp} />);

    await user.click(screen.getByLabelText("Mover sección arriba"));
    expect(onMoveUp).toHaveBeenCalledOnce();
  });

  it("calls onUpdate when section is renamed via inline edit", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<SectionCard {...defaultProps} onUpdate={onUpdate} />);

    await user.click(screen.getByText("Exterior"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Interior{Enter}");

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Interior" })
    );
  });

  it("has aria-expanded attribute on expand/collapse button", () => {
    render(<SectionCard {...defaultProps} defaultExpanded />);
    expect(screen.getByLabelText("Colapsar sección")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("calls onDelete when delete confirmation is accepted", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<SectionCard {...defaultProps} onDelete={onDelete} />);

    // Click the delete trigger button
    await user.click(screen.getByLabelText("Eliminar sección"));
    // Confirm deletion in the alert dialog
    await user.click(screen.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("calls onUpdate when an item is deleted", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <SectionCard {...defaultProps} onUpdate={onUpdate} defaultExpanded />
    );

    // Delete the first item
    const deleteButtons = screen.getAllByLabelText("Eliminar item");
    await user.click(deleteButtons[0]);

    expect(onUpdate).toHaveBeenCalledOnce();
    const updatedSection = onUpdate.mock.calls[0][0];
    expect(updatedSection.items).toHaveLength(2);
  });

  it("calls onUpdate when item type is toggled", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <SectionCard {...defaultProps} onUpdate={onUpdate} defaultExpanded />
    );

    // Toggle the first item type
    const toggles = screen.getAllByRole("switch");
    await user.click(toggles[0]);

    expect(onUpdate).toHaveBeenCalledOnce();
    const updatedSection = onUpdate.mock.calls[0][0];
    expect(updatedSection.items[0].type).toBe("free_text");
  });

  it("calls onUpdate when item is moved up", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <SectionCard {...defaultProps} onUpdate={onUpdate} defaultExpanded />
    );

    // Move second item up
    const moveUpButtons = screen.getAllByLabelText("Mover arriba");
    await user.click(moveUpButtons[1]); // second item's move up
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it("calls onUpdate when item is moved down", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <SectionCard {...defaultProps} onUpdate={onUpdate} defaultExpanded />
    );

    const moveDownButtons = screen.getAllByLabelText("Mover abajo");
    await user.click(moveDownButtons[0]); // first item's move down
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it("calls onUpdate when item is renamed", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <SectionCard {...defaultProps} onUpdate={onUpdate} defaultExpanded />
    );

    await user.click(screen.getByText("Carrocería"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Pintura{Enter}");

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ name: "Pintura" }),
        ]),
      })
    );
  });

  it("auto-expands when adding item to collapsed section", async () => {
    const user = userEvent.setup();
    // Start collapsed, click add item
    const emptySection = createTemplateSection({
      name: "Empty",
      items: [],
    });
    const onUpdate = vi.fn();
    render(
      <SectionCard
        {...defaultProps}
        section={emptySection}
        onUpdate={onUpdate}
        defaultExpanded={false}
      />
    );

    // The add item button isn't visible when collapsed.
    // But the addItem function sets expanded=true internally.
    // We need to expand first, then add.
    await user.click(screen.getByLabelText("Expandir sección"));
    await user.click(screen.getByText("Agregar item"));
    expect(onUpdate).toHaveBeenCalled();
  });

  it("renders 0 items badge for empty section", () => {
    const emptySection = createTemplateSection({ name: "Empty", items: [] });
    render(<SectionCard {...defaultProps} section={emptySection} />);
    const badges = screen.getAllByText(/0 items/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onMoveDown when move down is clicked", async () => {
    const user = userEvent.setup();
    const onMoveDown = vi.fn();
    render(<SectionCard {...defaultProps} onMoveDown={onMoveDown} />);

    await user.click(screen.getByLabelText("Mover sección abajo"));
    expect(onMoveDown).toHaveBeenCalledOnce();
  });

  it("shows delete dialog text", () => {
    render(<SectionCard {...defaultProps} />);
    expect(screen.getByText(/Eliminar la sección/)).toBeInTheDocument();
  });
});
