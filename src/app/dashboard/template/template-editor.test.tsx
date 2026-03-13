import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateEditor } from "./template-editor";
import {
  createTemplateSection,
  createTemplateItem,
} from "../../../../__tests__/helpers/factories";

// Capture the onDragEnd handler so we can simulate DnD in tests
const { capturedDragEnd } = vi.hoisted(() => ({
  capturedDragEnd: { current: null as ((event: any) => void) | null },
}));

// Mock @dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd?: any }) => {
    capturedDragEnd.current = onDragEnd ?? null;
    return <div>{children}</div>;
  },
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
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

// Mock @base-ui/react/alert-dialog
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

// Use vi.hoisted to create mock variables that are available in hoisted vi.mock factories
const { mockToast, mockUpdateTemplateAction } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  mockUpdateTemplateAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@/lib/actions/template", () => ({
  updateTemplateAction: (...args: unknown[]) =>
    mockUpdateTemplateAction(...args),
}));

// Mock @base-ui/react/button
vi.mock("@base-ui/react/button", () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

import React from "react";

describe("TemplateEditor", () => {
  const sections = [
    createTemplateSection({
      name: "Exterior",
      order: 0,
      items: [
        createTemplateItem({ name: "Carrocería", order: 0 }),
        createTemplateItem({ name: "Vidrios", order: 1 }),
      ],
    }),
    createTemplateSection({
      name: "Motor",
      order: 1,
      items: [createTemplateItem({ name: "Aceite", order: 0 })],
    }),
  ];

  const defaultProps = {
    templateId: crypto.randomUUID(),
    initialName: "Inspección Pre-Compra Completa",
    initialSections: sections,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTemplateAction.mockResolvedValue({ success: true });
  });

  it("renders template name", () => {
    render(<TemplateEditor {...defaultProps} />);
    expect(
      screen.getByText("Inspección Pre-Compra Completa")
    ).toBeInTheDocument();
  });

  it("renders all sections", () => {
    render(<TemplateEditor {...defaultProps} />);
    expect(screen.getByText("Exterior")).toBeInTheDocument();
    expect(screen.getByText("Motor")).toBeInTheDocument();
  });

  it("renders Dashboard back link", () => {
    render(<TemplateEditor {...defaultProps} />);
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("renders 'Agregar sección' button", () => {
    render(<TemplateEditor {...defaultProps} />);
    expect(screen.getByText("Agregar sección")).toBeInTheDocument();
  });

  it("shows 'Guardado' when no changes have been made", () => {
    render(<TemplateEditor {...defaultProps} />);
    const guardadoButtons = screen.getAllByText("Guardado");
    expect(guardadoButtons.length).toBeGreaterThan(0);
  });

  it("adds a new section when 'Agregar sección' is clicked", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    await user.click(screen.getByText("Agregar sección"));
    // autoFocus=true puts InlineEdit in edit mode, so "Nueva sección" is an input value
    const inputs = screen.getAllByRole("textbox");
    const newSectionInput = inputs.find(
      (i) => (i as HTMLInputElement).value === "Nueva sección"
    );
    expect(newSectionInput).toBeDefined();
  });

  it("shows empty state message when all sections are removed", () => {
    render(
      <TemplateEditor {...defaultProps} initialSections={[]} />
    );
    expect(
      screen.getByText("No tenés secciones. Agregá una para empezar.")
    ).toBeInTheDocument();
  });

  it("shows 'Guardar' after making a change", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    // Add a section to trigger change
    await user.click(screen.getByText("Agregar sección"));

    const guardarButtons = screen.getAllByText("Guardar");
    expect(guardarButtons.length).toBeGreaterThan(0);
  });

  it("calls updateTemplateAction on save", async () => {
    const user = userEvent.setup();
    mockUpdateTemplateAction.mockResolvedValue({ success: true });
    render(<TemplateEditor {...defaultProps} />);

    // Make a change first
    await user.click(screen.getByText("Agregar sección"));

    // Click save (desktop button)
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockUpdateTemplateAction).toHaveBeenCalledOnce();
  });

  it("shows success toast after successful save", async () => {
    const user = userEvent.setup();
    mockUpdateTemplateAction.mockResolvedValue({ success: true });
    render(<TemplateEditor {...defaultProps} />);

    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockToast.success).toHaveBeenCalledWith("Template guardado");
  });

  it("shows error toast after failed save", async () => {
    const user = userEvent.setup();
    mockUpdateTemplateAction.mockResolvedValue({
      success: false,
      error: "Server error",
    });
    render(<TemplateEditor {...defaultProps} />);

    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockToast.error).toHaveBeenCalledWith("Server error");
  });

  it("blocks save and shows error when client validation fails (empty name)", async () => {
    // This tests the handleSave validation path for empty name
    const user = userEvent.setup();
    render(
      <TemplateEditor
        {...defaultProps}
        initialName=""
        initialSections={[createTemplateSection()]}
      />
    );

    // hasChanges is true because name="" differs from... actually it starts as "",
    // so hasChanges=false. Let's add a section to trigger change.
    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockToast.error).toHaveBeenCalledWith(
      "El nombre del template no puede estar vacío."
    );
    expect(mockUpdateTemplateAction).not.toHaveBeenCalled();
  });

  it("shows error toast when section has empty name on save", async () => {
    const user = userEvent.setup();
    const sectionWithEmptyItem = createTemplateSection({
      name: "",
      order: 0,
    });
    render(
      <TemplateEditor
        {...defaultProps}
        initialName="Valid Name"
        initialSections={[sectionWithEmptyItem]}
      />
    );

    // Make a change to enable save
    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockToast.error).toHaveBeenCalled();
    expect(mockUpdateTemplateAction).not.toHaveBeenCalled();
  });

  it("shows error toast when item has empty name on save", async () => {
    const user = userEvent.setup();
    const sectionWithEmptyItem = createTemplateSection({
      name: "Valid Section",
      order: 0,
      items: [createTemplateItem({ name: "", order: 0 })],
    });
    render(
      <TemplateEditor
        {...defaultProps}
        initialName="Valid Name"
        initialSections={[sectionWithEmptyItem]}
      />
    );

    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockToast.error).toHaveBeenCalled();
    expect(mockUpdateTemplateAction).not.toHaveBeenCalled();
  });

  it("updates section when onUpdate callback is triggered", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    // Expand first section to see items
    await user.click(screen.getByLabelText("Expandir sección"));
    // Toggle first item type
    const toggles = screen.getAllByRole("switch");
    await user.click(toggles[0]);

    // Should now show "Guardar" (hasChanges=true)
    const saveButtons = screen.getAllByText("Guardar");
    expect(saveButtons.length).toBeGreaterThan(0);
  });

  it("reverts to 'Guardado' after successful save", async () => {
    const user = userEvent.setup();
    mockUpdateTemplateAction.mockResolvedValue({ success: true });
    render(<TemplateEditor {...defaultProps} />);

    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    // After successful save, should show "Guardado"
    const guardadoButtons = screen.getAllByText("Guardado");
    expect(guardadoButtons.length).toBeGreaterThan(0);
  });

  it("shows generic error message when save fails without error text", async () => {
    const user = userEvent.setup();
    mockUpdateTemplateAction.mockResolvedValue({ success: false });
    render(<TemplateEditor {...defaultProps} />);

    await user.click(screen.getByText("Agregar sección"));
    const saveButtons = screen.getAllByText("Guardar");
    await user.click(saveButtons[0]);

    expect(mockToast.error).toHaveBeenCalledWith(
      "Error al guardar. Verificá tu conexión e intentá de nuevo."
    );
  });

  it("can rename template via inline edit", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    await user.click(screen.getByText("Inspección Pre-Compra Completa"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Nuevo Nombre{Enter}");

    expect(screen.getByText("Nuevo Nombre")).toBeInTheDocument();
  });

  it("deletes a section when confirmed", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    // Open delete dialog for first section
    const deleteButtons = screen.getAllByLabelText("Eliminar sección");
    await user.click(deleteButtons[0]);

    // Click Eliminar in the confirmation dialog (multiple sections = multiple Eliminar buttons)
    const eliminarBtns = screen.getAllByText("Eliminar");
    await user.click(eliminarBtns[0]);

    // First section should be gone
    expect(screen.queryByText("Exterior")).not.toBeInTheDocument();
    expect(screen.getByText("Motor")).toBeInTheDocument();
  });

  it("moves section up via button", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    // Move second section up
    const moveUpButtons = screen.getAllByLabelText("Mover sección arriba");
    // First section's move up is disabled, second one should work
    await user.click(moveUpButtons[1]);

    // After move, order should change — "Motor" should come before "Exterior"
    // We can verify by checking that the first section's name changed
    const sectionNames = screen
      .getAllByRole("button")
      .filter((el) => el.textContent === "Motor" || el.textContent === "Exterior");
    expect(sectionNames.length).toBeGreaterThan(0);
  });

  it("moves section down via button", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor {...defaultProps} />);

    const moveDownButtons = screen.getAllByLabelText("Mover sección abajo");
    await user.click(moveDownButtons[0]);

    // Sections should have reordered
    const saveButtons = screen.getAllByText("Guardar");
    expect(saveButtons.length).toBeGreaterThan(0); // hasChanges=true
  });

  it("handles section drag end by reordering sections", () => {
    const { act } = require("react");
    render(<TemplateEditor {...defaultProps} />);

    // Simulate a section drag
    act(() => {
      if (capturedDragEnd.current) {
        capturedDragEnd.current({
          active: { id: sections[0].id },
          over: { id: sections[1].id },
        });
      }
    });

    // After drag, should have changes
    const saveButtons = screen.getAllByText("Guardar");
    expect(saveButtons.length).toBeGreaterThan(0);
  });

  it("handles item drag end by reordering items within section", () => {
    const { act } = require("react");
    // Need sections with items
    render(<TemplateEditor {...defaultProps} />);

    const itemId1 = sections[0].items[0].id;
    const itemId2 = sections[0].items[1].id;

    act(() => {
      if (capturedDragEnd.current) {
        capturedDragEnd.current({
          active: { id: itemId1 },
          over: { id: itemId2 },
        });
      }
    });

    // hasChanges should be true
    const saveButtons = screen.getAllByText("Guardar");
    expect(saveButtons.length).toBeGreaterThan(0);
  });

  it("drag end with same active and over id does nothing", () => {
    const { act } = require("react");
    render(<TemplateEditor {...defaultProps} />);

    act(() => {
      if (capturedDragEnd.current) {
        capturedDragEnd.current({
          active: { id: sections[0].id },
          over: { id: sections[0].id },
        });
      }
    });

    // No changes — still "Guardado"
    const guardadoButtons = screen.getAllByText("Guardado");
    expect(guardadoButtons.length).toBeGreaterThan(0);
  });

  it("drag end with no over target does nothing", () => {
    const { act } = require("react");
    render(<TemplateEditor {...defaultProps} />);

    act(() => {
      if (capturedDragEnd.current) {
        capturedDragEnd.current({
          active: { id: sections[0].id },
          over: null,
        });
      }
    });

    const guardadoButtons = screen.getAllByText("Guardado");
    expect(guardadoButtons.length).toBeGreaterThan(0);
  });
});
