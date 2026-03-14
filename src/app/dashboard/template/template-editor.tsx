"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uuid } from "@/lib/utils";
import { SectionCard } from "./section-card";
import { InlineEdit } from "./inline-edit";
import { updateTemplateAction } from "@/lib/actions/template";
import type { TemplateSection } from "@/lib/validators";

interface TemplateEditorProps {
  templateId: string;
  initialName: string;
  initialSections: TemplateSection[];
}

export function TemplateEditor({
  templateId,
  initialName,
  initialSections,
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastAddedSectionId, setLastAddedSectionId] = useState<string | null>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const initialRef = useRef({ name: initialName, sections: initialSections });

  // Track changes
  useEffect(() => {
    const changed =
      name !== initialRef.current.name ||
      JSON.stringify(sections) !== JSON.stringify(initialRef.current.sections);
    setHasChanges(changed);
  }, [name, sections]);

  // Unsaved changes warning
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Section operations
  function addSection() {
    const newId = uuid();
    const newSection: TemplateSection = {
      id: newId,
      name: "Nueva sección",
      order: sections.length,
      items: [],
    };
    setSections((prev) => [...prev, newSection]);
    setLastAddedSectionId(newId);
  }

  function updateSection(index: number, updated: TemplateSection) {
    // Track if a new item was added
    const oldSection = sections[index];
    if (updated.items.length > oldSection.items.length) {
      const newItem = updated.items[updated.items.length - 1];
      setLastAddedItemId(newItem.id);
    }

    setSections((prev) =>
      prev.map((s, i) => (i === index ? updated : s))
    );
  }

  function deleteSection(index: number) {
    setSections((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i }))
    );
  }

  function moveSection(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr.map((s, i) => ({ ...s, order: i }));
    });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setSections((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(oldIndex, 1);
      arr.splice(newIndex, 0, moved);
      return arr.map((s, i) => ({ ...s, order: i }));
    });
  }

  // Items DnD — handled within each section's SortableContext
  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which section contains this item
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];
      const oldIndex = section.items.findIndex((i) => i.id === active.id);
      const newIndex = section.items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const items = [...section.items];
        const [moved] = items.splice(oldIndex, 1);
        items.splice(newIndex, 0, moved);
        updateSection(si, {
          ...section,
          items: items.map((item, i) => ({ ...item, order: i })),
        });
        break;
      }
    }
  }

  // Save
  const handleSave = useCallback(async () => {
    // Client validation
    if (!name.trim()) {
      toast.error("El nombre del template no puede estar vacío.");
      return;
    }
    if (sections.length === 0) {
      toast.error("El template debe tener al menos una sección.");
      return;
    }
    for (const s of sections) {
      if (!s.name.trim()) {
        toast.error(`La sección "${s.name || "(sin nombre)"}" tiene nombre vacío.`);
        return;
      }
      for (const item of s.items) {
        if (!item.name.trim()) {
          toast.error(`Un item en "${s.name}" tiene nombre vacío.`);
          return;
        }
      }
    }

    setSaving(true);
    const result = await updateTemplateAction({
      templateId,
      name,
      sections,
    });

    if (result.success) {
      toast.success("Template guardado");
      initialRef.current = { name, sections };
      setHasChanges(false);
    } else {
      toast.error(
        result.error ?? "Error al guardar. Verificá tu conexión e intentá de nuevo."
      );
    }
    setSaving(false);
  }, [name, sections, templateId]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-primary-hover shrink-0"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <InlineEdit
            value={name}
            onSave={setName}
            className="text-xl sm:text-2xl font-bold text-gray-800"
            inputClassName="text-xl sm:text-2xl font-bold text-gray-800"
            emptyMessage="El nombre del template no puede estar vacío"
          />
        </div>

        {/* Save button — desktop */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="hidden sm:inline-flex h-10 px-4 text-base"
          variant={hasChanges ? "default" : "secondary"}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : hasChanges ? (
            "Guardar"
          ) : (
            "Guardado"
          )}
        </Button>
      </div>

      {/* Section List */}
      {sections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No tenés secciones. Agregá una para empezar.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            // Determine if it's a section or item drag
            const activeId = event.active.id as string;
            const isSection = sections.some((s) => s.id === activeId);
            if (isSection) {
              handleSectionDragEnd(event);
            } else {
              handleItemDragEnd(event);
            }
          }}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-4">
              {sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onUpdate={(updated) => updateSection(index, updated)}
                  onDelete={() => deleteSection(index)}
                  onMoveUp={() => moveSection(index, -1)}
                  onMoveDown={() => moveSection(index, 1)}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                  defaultExpanded={index === 0}
                  autoFocusName={section.id === lastAddedSectionId}
                  lastAddedItemId={lastAddedItemId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Section Button */}
      <button
        onClick={addSection}
        className="mt-4 w-full h-14 flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg text-base font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        <Plus className="size-5" />
        Agregar sección
      </button>

      {/* Mobile Save Button — fixed bottom */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] p-4 z-40">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 text-base"
          variant={hasChanges ? "default" : "secondary"}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : hasChanges ? (
            "Guardar"
          ) : (
            "Guardado"
          )}
        </Button>
      </div>

      {/* Spacer for mobile fixed button */}
      <div className="sm:hidden h-20" />
    </div>
  );
}
