import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUpdateTemplateInput,
  createMockSession,
} from "../helpers/factories";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockUpdateTemplate = vi.fn();
vi.mock("@/lib/services/template", () => ({
  updateTemplate: (...args: unknown[]) => mockUpdateTemplate(...args),
}));

// Import after mocking
import { updateTemplateAction } from "@/lib/actions/template";

describe("updateTemplateAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateTemplateAction(createUpdateTemplateInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when user has no nodeId", async () => {
    mockAuth.mockResolvedValue(createMockSession({ nodeId: null }));

    const result = await updateTemplateAction(createUpdateTemplateInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error on invalid input (empty name)", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const input = createUpdateTemplateInput({ name: "" });
    const result = await updateTemplateAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error on invalid input (empty sections)", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const input = createUpdateTemplateInput({ sections: [] });
    const result = await updateTemplateAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error on invalid templateId", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const input = { ...createUpdateTemplateInput(), templateId: "bad-id" };
    const result = await updateTemplateAction(input);

    expect(result.success).toBe(false);
  });

  it("returns success with updatedAt on valid input", async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValue(session);
    const updatedAt = new Date("2025-06-01T00:00:00Z");
    mockUpdateTemplate.mockResolvedValue({ updatedAt });

    const input = createUpdateTemplateInput();
    const result = await updateTemplateAction(input);

    expect(result).toEqual({
      success: true,
      data: { updatedAt: updatedAt.toISOString() },
    });
    expect(mockUpdateTemplate).toHaveBeenCalledWith(
      input.templateId,
      session.user.nodeId,
      session.user.id,
      input.name,
      input.sections
    );
  });

  it("returns error when service throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockUpdateTemplate.mockRejectedValue(
      new Error("No tenés permiso para editar este template.")
    );

    const result = await updateTemplateAction(createUpdateTemplateInput());

    expect(result).toEqual({
      success: false,
      error: "No tenés permiso para editar este template.",
    });
  });

  it("returns generic error for non-Error throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockUpdateTemplate.mockRejectedValue("string error");

    const result = await updateTemplateAction(createUpdateTemplateInput());

    expect(result).toEqual({
      success: false,
      error: "Error al guardar el template.",
    });
  });
});
