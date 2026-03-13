import type { TemplateSection, TemplateItem } from "@/lib/validators";

// ─── Template Factories ───────────────────────────────────────────────────────

let itemCounter = 0;
let sectionCounter = 0;

export function createTemplateItem(
  overrides: Partial<TemplateItem> = {}
): TemplateItem {
  itemCounter++;
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? `Item ${itemCounter}`,
    order: overrides.order ?? 0,
    type: overrides.type ?? "checklist_item",
  };
}

export function createTemplateSection(
  overrides: Partial<TemplateSection> & { itemCount?: number } = {}
): TemplateSection {
  sectionCounter++;
  const { itemCount, ...rest } = overrides;
  const count = itemCount ?? 2;
  return {
    id: rest.id ?? crypto.randomUUID(),
    name: rest.name ?? `Section ${sectionCounter}`,
    order: rest.order ?? 0,
    items:
      rest.items ??
      Array.from({ length: count }, (_, i) =>
        createTemplateItem({ order: i })
      ),
  };
}

export function createTemplateSections(count = 3): TemplateSection[] {
  return Array.from({ length: count }, (_, i) =>
    createTemplateSection({ order: i })
  );
}

// ─── User / Session Factories ─────────────────────────────────────────────────

export function createMockSession(
  overrides: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    nodeId?: string | null;
  } = {}
) {
  return {
    user: {
      id: overrides.id ?? crypto.randomUUID(),
      name: overrides.name ?? "Inspector Demo",
      email: overrides.email ?? "inspector@demo.com",
      role: overrides.role ?? "user",
      nodeId: "nodeId" in overrides ? overrides.nodeId : crypto.randomUUID(),
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ─── Update Template Input ────────────────────────────────────────────────────

export function createUpdateTemplateInput(
  overrides: {
    templateId?: string;
    name?: string;
    sections?: TemplateSection[];
  } = {}
) {
  return {
    templateId: overrides.templateId ?? crypto.randomUUID(),
    name: overrides.name ?? "Inspección Pre-Compra Completa",
    sections: overrides.sections ?? createTemplateSections(2),
  };
}
