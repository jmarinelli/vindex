import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTemplateSections } from "../../helpers/factories";

// ─── Mock the database ────────────────────────────────────────────────────────

let queryResults: unknown[][] = [];
let insertReturns: unknown[][] = [];

vi.mock("@/db", () => ({
  db: new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "select") {
          return () => ({
            from: () => ({
              where: () => {
                const results = queryResults.shift() ?? [];
                return {
                  limit: () => results,
                  // When no .limit() is called (e.g., findings select)
                  then: (resolve: (v: unknown) => void) => resolve(results),
                  [Symbol.iterator]: function* () {
                    yield* results as Iterable<unknown>;
                  },
                };
              },
            }),
          });
        }
        if (prop === "insert") {
          return () => ({
            values: () => ({
              returning: () => insertReturns.shift() ?? [],
            }),
          });
        }
        if (prop === "update") {
          return () => ({
            set: () => ({
              where: () => ({
                returning: () => insertReturns.shift() ?? [],
              }),
            }),
          });
        }
        return undefined;
      },
    }
  ),
}));

vi.mock("@/db/schema", () => ({
  events: {
    id: "id",
    vehicleId: "vehicle_id",
    nodeId: "node_id",
    status: "status",
    slug: "slug",
  },
  inspectionDetails: {
    id: "id",
    eventId: "event_id",
    templateSnapshot: "template_snapshot",
  },
  inspectionFindings: {
    id: "id",
    eventId: "event_id",
    sectionId: "section_id",
    itemId: "item_id",
    status: "status",
  },
  inspectionTemplates: {
    id: "id",
    nodeId: "node_id",
  },
  nodeMembers: {
    nodeId: "node_id",
    userId: "user_id",
  },
  vehicles: {
    id: "id",
  },
  eventPhotos: {
    eventId: "event_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

vi.mock("@/lib/slug", () => ({
  generateSlug: vi.fn(() => "abc12345"),
}));

// Import after mocking
import {
  createInspection,
  getDraft,
  updateFinding,
} from "@/lib/services/inspection";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("createInspection", () => {
  const baseParams = {
    vehicleId: "vehicle-1",
    nodeId: "node-1",
    userId: "user-1",
    inspectionType: "pre_purchase" as const,
    requestedBy: "buyer" as const,
    odometerKm: 50000,
    eventDate: "2025-06-01",
  };

  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
  });

  it("throws when user is not a node member", async () => {
    // membership check returns empty
    queryResults = [[]];

    await expect(createInspection(baseParams)).rejects.toThrow(
      "No tenés permiso para crear inspecciones en este nodo."
    );
  });

  it("throws when no template exists for the node", async () => {
    // membership check succeeds
    queryResults = [[{ id: "member-1" }]];
    // template check returns empty
    queryResults.push([]);

    await expect(createInspection(baseParams)).rejects.toThrow(
      "No hay un template configurado para este nodo."
    );
  });

  it("creates event, detail, and findings on success", async () => {
    const sections = createTemplateSections(1); // 1 section with 2 items

    // membership check
    queryResults = [[{ id: "member-1" }]];
    // template check
    queryResults.push([
      {
        id: "template-1",
        name: "Test Template",
        sections: { sections },
        nodeId: "node-1",
      },
    ]);

    const event = {
      id: "event-1",
      vehicleId: "vehicle-1",
      nodeId: "node-1",
      eventType: "inspection",
      odometerKm: 50000,
      eventDate: "2025-06-01",
      status: "draft",
      slug: "abc12345",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const detail = {
      id: "detail-1",
      eventId: "event-1",
      templateSnapshot: {
        templateId: "template-1",
        templateName: "Test Template",
        sections,
      },
      inspectionType: "pre_purchase",
      requestedBy: "buyer",
    };

    const findings = sections[0].items.map((item, i) => ({
      id: `finding-${i}`,
      eventId: "event-1",
      sectionId: sections[0].id,
      itemId: item.id,
      status: "not_evaluated",
      observation: null,
      tags: null,
      createdAt: new Date(),
    }));

    const vehicle = { id: "vehicle-1", make: "Toyota", model: "Corolla", year: 2020 };

    // event insert
    insertReturns = [[event]];
    // detail insert
    insertReturns.push([detail]);
    // findings insert
    insertReturns.push(findings);
    // vehicle query (after inserts)
    queryResults.push([vehicle]);

    const result = await createInspection(baseParams);

    expect(result.event).toEqual(event);
    expect(result.detail).toEqual(detail);
    expect(result.findings).toEqual(findings);
    expect(result.photos).toEqual([]);
    expect(result.vehicle).toEqual(vehicle);
    expect(result.templateSnapshot).toEqual({
      templateId: "template-1",
      templateName: "Test Template",
      sections,
    });
  });
});

describe("getDraft", () => {
  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
  });

  it("returns null when event is not found", async () => {
    queryResults = [[]];
    const result = await getDraft("event-1", "node-1");
    expect(result).toBeNull();
  });

  it("returns null when event is not a draft", async () => {
    queryResults = [
      [
        {
          id: "event-1",
          nodeId: "node-1",
          status: "signed",
        },
      ],
    ];

    const result = await getDraft("event-1", "node-1");
    expect(result).toBeNull();
  });

  it("returns null when detail is not found", async () => {
    // event found as draft
    queryResults = [
      [{ id: "event-1", nodeId: "node-1", status: "draft" }],
    ];
    // detail not found
    queryResults.push([]);

    const result = await getDraft("event-1", "node-1");
    expect(result).toBeNull();
  });

  it("returns the full draft when everything exists", async () => {
    const sections = createTemplateSections(1);
    const templateSnapshot = {
      templateId: "t1",
      templateName: "Template",
      sections,
    };
    const event = { id: "event-1", nodeId: "node-1", status: "draft" };
    const detail = {
      id: "detail-1",
      eventId: "event-1",
      templateSnapshot,
    };
    const findings = [
      {
        id: "f1",
        eventId: "event-1",
        sectionId: sections[0].id,
        itemId: sections[0].items[0].id,
        status: "not_evaluated",
      },
    ];

    const vehicle = { id: "v1", make: "Toyota", model: "Corolla", year: 2020, vehicleId: "v1" };
    const photos = [{ id: "p1", eventId: "event-1", photoType: "vehicle", url: "https://example.com/photo.jpg" }];

    // event query
    queryResults = [[event]];
    // detail query
    queryResults.push([detail]);
    // vehicle query
    queryResults.push([vehicle]);
    // Promise.all: findings query, photos query
    queryResults.push(findings);
    queryResults.push(photos);

    const result = await getDraft("event-1", "node-1");

    expect(result).not.toBeNull();
    expect(result!.event).toEqual(event);
    expect(result!.detail).toEqual(detail);
    expect(result!.findings).toEqual(findings);
    expect(result!.photos).toEqual(photos);
    expect(result!.vehicle).toEqual(vehicle);
    expect(result!.templateSnapshot).toEqual(templateSnapshot);
  });
});

describe("updateFinding", () => {
  const baseParams = {
    findingId: "finding-1",
    nodeId: "node-1",
    userId: "user-1",
  };

  beforeEach(() => {
    queryResults = [];
    insertReturns = [];
  });

  it("throws when finding is not found", async () => {
    queryResults = [[]];

    await expect(
      updateFinding({ ...baseParams, status: "good" })
    ).rejects.toThrow("Hallazgo no encontrado.");
  });

  it("throws when event is not found", async () => {
    // finding found
    queryResults = [[{ id: "finding-1", eventId: "event-1" }]];
    // event not found
    queryResults.push([]);

    await expect(
      updateFinding({ ...baseParams, status: "good" })
    ).rejects.toThrow("Evento no encontrado.");
  });

  it("throws when event is signed", async () => {
    queryResults = [[{ id: "finding-1", eventId: "event-1" }]];
    queryResults.push([{ id: "event-1", status: "signed", nodeId: "node-1" }]);

    await expect(
      updateFinding({ ...baseParams, status: "good" })
    ).rejects.toThrow("No se puede modificar una inspección firmada.");
  });

  it("throws when node does not match", async () => {
    queryResults = [[{ id: "finding-1", eventId: "event-1" }]];
    queryResults.push([
      { id: "event-1", status: "draft", nodeId: "other-node" },
    ]);

    await expect(
      updateFinding({ ...baseParams, status: "good" })
    ).rejects.toThrow("No tenés permiso para modificar este hallazgo.");
  });

  it("returns the finding unchanged when no updates are provided", async () => {
    const finding = {
      id: "finding-1",
      eventId: "event-1",
      status: "not_evaluated",
      observation: null,
    };
    queryResults = [[finding]];
    queryResults.push([{ id: "event-1", status: "draft", nodeId: "node-1" }]);

    const result = await updateFinding(baseParams);
    expect(result).toEqual(finding);
  });

  it("updates status and returns the updated finding", async () => {
    const finding = {
      id: "finding-1",
      eventId: "event-1",
      status: "not_evaluated",
      observation: null,
    };
    const updatedFinding = { ...finding, status: "good" };

    queryResults = [[finding]];
    queryResults.push([{ id: "event-1", status: "draft", nodeId: "node-1" }]);
    insertReturns = [[updatedFinding]]; // update().set().where().returning()

    const result = await updateFinding({ ...baseParams, status: "good" });
    expect(result).toEqual(updatedFinding);
  });

  it("updates observation and returns the updated finding", async () => {
    const finding = {
      id: "finding-1",
      eventId: "event-1",
      status: "not_evaluated",
      observation: null,
    };
    const updatedFinding = { ...finding, observation: "Scratched" };

    queryResults = [[finding]];
    queryResults.push([{ id: "event-1", status: "draft", nodeId: "node-1" }]);
    insertReturns = [[updatedFinding]];

    const result = await updateFinding({
      ...baseParams,
      observation: "Scratched",
    });
    expect(result).toEqual(updatedFinding);
  });
});
