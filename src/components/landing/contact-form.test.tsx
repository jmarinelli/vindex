import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "./contact-form";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock server action
const mockSubmitContactFormAction = vi.fn();
vi.mock("@/lib/actions/contact", () => ({
  submitContactFormAction: (...args: unknown[]) =>
    mockSubmitContactFormAction(...args),
}));

import { toast } from "sonner";

describe("ContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("Nombre")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Teléfono (opcional)")).toBeDefined();
    expect(screen.getByLabelText("Mensaje")).toBeDefined();
  });

  it("renders submit button", () => {
    render(<ContactForm />);
    expect(screen.getByText("Enviar mensaje")).toBeDefined();
  });

  it("shows validation error for empty name on submit", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Este es un mensaje de prueba con al menos diez caracteres.");
    await user.click(screen.getByText("Enviar mensaje"));

    expect(
      screen.getByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeDefined();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Email"), "invalid-email");
    await user.type(screen.getByLabelText("Mensaje"), "Este es un mensaje de prueba con al menos diez caracteres.");
    await user.click(screen.getByText("Enviar mensaje"));

    expect(screen.getByText("Ingresá un email válido.")).toBeDefined();
  });

  it("shows validation error for short message", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Corto");
    await user.click(screen.getByText("Enviar mensaje"));

    expect(
      screen.getByText("El mensaje debe tener al menos 10 caracteres.")
    ).toBeDefined();
  });

  it("shows validation errors for all empty required fields", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByText("Enviar mensaje"));

    expect(
      screen.getByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeDefined();
    expect(screen.getByText("Ingresá un email válido.")).toBeDefined();
    expect(
      screen.getByText("El mensaje debe tener al menos 10 caracteres.")
    ).toBeDefined();
  });

  it("clears field error when user starts typing", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByText("Enviar mensaje"));
    expect(
      screen.getByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeDefined();

    await user.type(screen.getByLabelText("Nombre"), "J");

    expect(
      screen.queryByText("El nombre debe tener al menos 2 caracteres.")
    ).toBeNull();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    mockSubmitContactFormAction.mockResolvedValue({ success: true });

    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@test.com");
    await user.type(screen.getByLabelText("Teléfono (opcional)"), "+54 11 1234");
    await user.type(screen.getByLabelText("Mensaje"), "Tengo un taller de inspecciones.");
    await user.click(screen.getByText("Enviar mensaje"));

    await waitFor(() => {
      expect(mockSubmitContactFormAction).toHaveBeenCalledWith({
        name: "Juan Pérez",
        email: "juan@test.com",
        phone: "+54 11 1234",
        message: "Tengo un taller de inspecciones.",
      });
    });
  });

  it("shows success state after submission", async () => {
    const user = userEvent.setup();
    mockSubmitContactFormAction.mockResolvedValue({ success: true });

    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Tengo un taller de inspecciones.");
    await user.click(screen.getByText("Enviar mensaje"));

    await waitFor(() => {
      expect(screen.getByText("¡Mensaje enviado!")).toBeDefined();
    });
  });

  it("shows error toast on server error", async () => {
    const user = userEvent.setup();
    mockSubmitContactFormAction.mockResolvedValue({
      success: false,
      error: "Error al enviar.",
    });

    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Tengo un taller de inspecciones.");
    await user.click(screen.getByText("Enviar mensaje"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al enviar.");
    });
  });

  it("does not submit when form is already pending", async () => {
    const user = userEvent.setup();
    mockSubmitContactFormAction.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Tengo un taller de inspecciones.");
    await user.click(screen.getByText("Enviar mensaje"));

    await waitFor(() => {
      expect(screen.getByText("Enviando...")).toBeDefined();
    });

    expect(mockSubmitContactFormAction).toHaveBeenCalledTimes(1);
  });

  it("phone field is optional and does not show error when empty", async () => {
    const user = userEvent.setup();
    mockSubmitContactFormAction.mockResolvedValue({ success: true });

    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Tengo un taller de inspecciones.");
    await user.click(screen.getByText("Enviar mensaje"));

    await waitFor(() => {
      expect(mockSubmitContactFormAction).toHaveBeenCalled();
    });

    // No phone-specific error should appear
    const phoneInput = screen.getByLabelText("Teléfono (opcional)");
    expect(phoneInput.getAttribute("aria-describedby")).toBeNull();
  });

  it("has correct input types", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("Nombre").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Teléfono (opcional)").getAttribute("type")).toBe("tel");
  });

  it("has correct placeholders", () => {
    render(<ContactForm />);

    expect(screen.getByPlaceholderText("Tu nombre")).toBeDefined();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeDefined();
    expect(screen.getByPlaceholderText("+54 11 1234-5678")).toBeDefined();
    expect(
      screen.getByPlaceholderText(
        "Contanos sobre tu taller o servicio de inspección..."
      )
    ).toBeDefined();
  });

  it("has aria-describedby linking inputs to error messages", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByText("Enviar mensaje"));

    const nameInput = screen.getByLabelText("Nombre");
    expect(nameInput.getAttribute("aria-describedby")).toBe("name-error");
    expect(document.getElementById("name-error")).toBeDefined();
  });

  it("sets aria-busy on submit button when pending", async () => {
    const user = userEvent.setup();
    mockSubmitContactFormAction.mockImplementation(
      () => new Promise(() => {})
    );

    render(<ContactForm />);

    await user.type(screen.getByLabelText("Nombre"), "Juan Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@test.com");
    await user.type(screen.getByLabelText("Mensaje"), "Tengo un taller de inspecciones.");
    await user.click(screen.getByText("Enviar mensaje"));

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-busy")).toBe("true");
    });
  });
});
