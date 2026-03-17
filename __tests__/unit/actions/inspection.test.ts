import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSession } from "../../helpers/factories";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockCreateInspection = vi.fn();
const mockUpdateFinding = vi.fn();
const mockGetDraft = vi.fn();
vi.mock("@/lib/services/inspection", () => ({
  createInspection: (...args: unknown[]) => mockCreateInspection(...args),
  updateFinding: (...args: unknown[]) => mockUpdateFinding(...args),
  getDraft: (...args: unknown[]) => mockGetDraft(...args),
}));

// Import after mocking
import {
  createInspectionAction,
  updateFindingAction,
  getDraftAction,
} from "@/lib/actions/inspection";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validCreateInput(overrides: Record<string, unknown> = {}) {
  return {
    vehicleId: crypto.randomUUID(),
    inspectionType: "pre_purchase",
    requestedBy: "buyer",
    odometerKm: 50000,
    eventDate: "2025-06-01",
    ...overrides,
  };
}

function validFindingInput(overrides: Record<string, unknown> = {}) {
  return {
    findingId: crypto.randomUUID(),
    status: "good",
    ...overrides,
  };
}

// ─── createInspectionAction ──────────────────────────────────────────────────

describe("createInspectionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createInspectionAction(validCreateInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when user has no nodeId", async () => {
    mockAuth.mockResolvedValue(createMockSession({ nodeId: null }));

    const result = await createInspectionAction(validCreateInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns validation error for invalid vehicleId", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await createInspectionAction(
      validCreateInput({ vehicleId: "not-a-uuid" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for invalid inspectionType", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await createInspectionAction(
      validCreateInput({ inspectionType: "invalid" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for invalid requestedBy", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await createInspectionAction(
      validCreateInput({ requestedBy: "invalid" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for zero odometerKm", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await createInspectionAction(
      validCreateInput({ odometerKm: 0 })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for missing eventDate", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await createInspectionAction(
      validCreateInput({ eventDate: "" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns success with eventId and slug", async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValue(session);

    mockCreateInspection.mockResolvedValue({
      event: { id: "event-1", slug: "abc12345" },
      detail: {},
      findings: [],
      templateSnapshot: {},
    });

    const result = await createInspectionAction(validCreateInput());

    expect(result).toEqual({
      success: true,
      data: { eventId: "event-1", slug: "abc12345" },
    });
  });

  it("passes nodeId and userId from session to service", async () => {
    const session = createMockSession({
      id: "user-99",
      nodeId: "node-99",
    });
    mockAuth.mockResolvedValue(session);

    mockCreateInspection.mockResolvedValue({
      event: { id: "e1", slug: "s1" },
    });

    const input = validCreateInput();
    await createInspectionAction(input);

    expect(mockCreateInspection).toHaveBeenCalledWith(
      expect.objectContaining({
        nodeId: "node-99",
        userId: "user-99",
        vehicleId: input.vehicleId,
        inspectionType: "pre_purchase",
        requestedBy: "buyer",
        odometerKm: 50000,
        eventDate: "2025-06-01",
      })
    );
  });

  it("returns error when service throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockCreateInspection.mockRejectedValue(
      new Error("No tenés permiso para crear verificaciones en este nodo.")
    );

    const result = await createInspectionAction(validCreateInput());

    expect(result).toEqual({
      success: false,
      error: "No tenés permiso para crear verificaciones en este nodo.",
    });
  });

  it("returns generic error for non-Error throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockCreateInspection.mockRejectedValue(42);

    const result = await createInspectionAction(validCreateInput());

    expect(result).toEqual({
      success: false,
      error: "Error al crear la verificación.",
    });
  });
});

// ─── updateFindingAction ─────────────────────────────────────────────────────

describe("updateFindingAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateFindingAction(validFindingInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when user has no nodeId", async () => {
    mockAuth.mockResolvedValue(createMockSession({ nodeId: null }));

    const result = await updateFindingAction(validFindingInput());

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns validation error for invalid findingId", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await updateFindingAction(
      validFindingInput({ findingId: "not-a-uuid" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns validation error for invalid status", async () => {
    mockAuth.mockResolvedValue(createMockSession());

    const result = await updateFindingAction(
      validFindingInput({ status: "invalid_status" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns success with findingId on valid update", async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValue(session);

    mockUpdateFinding.mockResolvedValue({
      id: "finding-1",
      status: "good",
    });

    const result = await updateFindingAction(validFindingInput());

    expect(result).toEqual({
      success: true,
      data: { findingId: "finding-1" },
    });
  });

  it("passes nodeId and userId from session to service", async () => {
    const session = createMockSession({
      id: "user-99",
      nodeId: "node-99",
    });
    mockAuth.mockResolvedValue(session);

    mockUpdateFinding.mockResolvedValue({ id: "f1" });

    const input = validFindingInput();
    await updateFindingAction(input);

    expect(mockUpdateFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        findingId: input.findingId,
        status: "good",
        nodeId: "node-99",
        userId: "user-99",
      })
    );
  });

  it("allows update with only observation", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockUpdateFinding.mockResolvedValue({ id: "f1" });

    const result = await updateFindingAction({
      findingId: crypto.randomUUID(),
      observation: "Minor scratch",
    });

    expect(result.success).toBe(true);
  });

  it("allows update with null observation", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockUpdateFinding.mockResolvedValue({ id: "f1" });

    const result = await updateFindingAction({
      findingId: crypto.randomUUID(),
      observation: null,
    });

    expect(result.success).toBe(true);
  });

  it("returns error when service throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockUpdateFinding.mockRejectedValue(
      new Error("No se puede modificar una verificación firmada.")
    );

    const result = await updateFindingAction(validFindingInput());

    expect(result).toEqual({
      success: false,
      error: "No se puede modificar una verificación firmada.",
    });
  });

  it("returns generic error for non-Error throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockUpdateFinding.mockRejectedValue("oops");

    const result = await updateFindingAction(validFindingInput());

    expect(result).toEqual({
      success: false,
      error: "Error al actualizar el hallazgo.",
    });
  });
});

// ─── getDraftAction ──────────────────────────────────────────────────────────

describe("getDraftAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getDraftAction("event-1");

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when user has no nodeId", async () => {
    mockAuth.mockResolvedValue(createMockSession({ nodeId: null }));

    const result = await getDraftAction("event-1");

    expect(result).toEqual({ success: false, error: "No autenticado." });
  });

  it("returns error when draft is not found", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockGetDraft.mockResolvedValue(null);

    const result = await getDraftAction("event-1");

    expect(result).toEqual({
      success: false,
      error: "Borrador no encontrado.",
    });
  });

  it("returns success with draft data", async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValue(session);

    const draft = {
      event: { id: "event-1" },
      detail: { id: "detail-1" },
      findings: [],
      templateSnapshot: { templateId: "t1", templateName: "T", sections: [] },
    };
    mockGetDraft.mockResolvedValue(draft);

    const result = await getDraftAction("event-1");

    expect(result).toEqual({ success: true, data: draft });
  });

  it("passes eventId and nodeId from session to service", async () => {
    const session = createMockSession({ nodeId: "node-99" });
    mockAuth.mockResolvedValue(session);
    mockGetDraft.mockResolvedValue(null);

    await getDraftAction("event-xyz");

    expect(mockGetDraft).toHaveBeenCalledWith("event-xyz", "node-99");
  });

  it("returns error when service throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockGetDraft.mockRejectedValue(new Error("DB connection failed"));

    const result = await getDraftAction("event-1");

    expect(result).toEqual({
      success: false,
      error: "DB connection failed",
    });
  });

  it("returns generic error for non-Error throws", async () => {
    mockAuth.mockResolvedValue(createMockSession());
    mockGetDraft.mockRejectedValue(undefined);

    const result = await getDraftAction("event-1");

    expect(result).toEqual({
      success: false,
      error: "Error al obtener el borrador.",
    });
  });
});
