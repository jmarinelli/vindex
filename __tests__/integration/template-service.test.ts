import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TemplateSection } from "@/lib/validators";
import {
  createTemplateSection,
  createTemplateSections,
} from "../helpers/factories";

// ─── Mock the database ────────────────────────────────────────────────────────

// Queue of return values for sequential DB queries
let queryResults: unknown[][] = [];
let updateCalls: unknown[] = [];

vi.mock("@/db", () => ({
  db: new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "select") {
          return () => ({
            from: () => ({
              where: () => ({
                limit: () => queryResults.shift() ?? [],
              }),
            }),
          });
        }
        if (prop === "update") {
          return () => ({
            set: (...args: unknown[]) => {
              updateCalls.push(args);
              return {
                where: () => Promise.resolve(),
              };
            },
          });
        }
        return undefined;
      },
    }
  ),
}));

vi.mock("@/db/schema", () => ({
  inspectionTemplates: {
    id: "id",
    nodeId: "node_id",
    name: "name",
    sections: "sections",
    updatedAt: "updated_at",
  },
  nodeMembers: {
    nodeId: "node_id",
    userId: "user_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

// Import after mocking
import { getTemplate, updateTemplate } from "@/lib/services/template";

describe("getTemplate", () => {
  beforeEach(() => {
    queryResults = [];
    updateCalls = [];
  });

  it("returns null when no template exists for the node", async () => {
    queryResults = [[]];
    const result = await getTemplate("non-existent-node-id");
    expect(result).toBeNull();
  });

  it("returns template data when template exists", async () => {
    const sections: TemplateSection[] = createTemplateSections(2);
    const template = {
      id: "template-id",
      nodeId: "node-id",
      name: "Test Template",
      sections: { sections },
      updatedAt: new Date("2025-01-01"),
    };
    queryResults = [[template]];

    const result = await getTemplate("node-id");

    expect(result).toEqual({
      id: "template-id",
      nodeId: "node-id",
      name: "Test Template",
      sections,
      updatedAt: template.updatedAt,
    });
  });

  it("returns sections array from nested structure", async () => {
    const sections: TemplateSection[] = [
      createTemplateSection({ name: "Exterior" }),
    ];
    queryResults = [
      [
        {
          id: "t1",
          nodeId: "n1",
          name: "Template",
          sections: { sections },
          updatedAt: new Date(),
        },
      ],
    ];

    const result = await getTemplate("n1");
    expect(result?.sections).toEqual(sections);
  });
});

describe("updateTemplate", () => {
  const templateId = crypto.randomUUID();
  const nodeId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const sections = createTemplateSections(2);

  beforeEach(() => {
    queryResults = [];
    updateCalls = [];
  });

  it("throws when user is not a node member", async () => {
    queryResults = [[]];

    await expect(
      updateTemplate(templateId, nodeId, userId, "New Name", sections)
    ).rejects.toThrow("No tenés permiso para editar este template.");
  });

  it("throws when template does not belong to node", async () => {
    queryResults = [[{ id: "member-id" }], []];

    await expect(
      updateTemplate(templateId, nodeId, userId, "New Name", sections)
    ).rejects.toThrow("Template no encontrado.");
  });

  it("returns updatedAt when authorized and template exists", async () => {
    queryResults = [[{ id: "member-id" }], [{ id: templateId }]];

    const result = await updateTemplate(
      templateId,
      nodeId,
      userId,
      "Updated Name",
      sections
    );

    expect(result).toHaveProperty("updatedAt");
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(updateCalls.length).toBe(1);
  });
});
