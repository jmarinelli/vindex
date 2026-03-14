"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
} from "lucide-react";
import { InlineEdit } from "./inline-edit";
import { ItemRow } from "./item-row";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { uuid } from "@/lib/utils";
import type { TemplateSection, TemplateItem } from "@/lib/validators";

interface SectionCardProps {
  section: TemplateSection;
  onUpdate: (section: TemplateSection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  defaultExpanded?: boolean;
  autoFocusName?: boolean;
  lastAddedItemId: string | null;
}

export function SectionCard({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  defaultExpanded = false,
  autoFocusName = false,
  lastAddedItemId,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  function renameSection(name: string) {
    onUpdate({ ...section, name });
  }

  function addItem() {
    const newItem: TemplateItem = {
      id: uuid(),
      name: "Nuevo item",
      order: section.items.length,
      type: "checklist_item",
    };
    onUpdate({
      ...section,
      items: [...section.items, newItem],
    });
    if (!expanded) setExpanded(true);
  }

  function updateItem(index: number, updated: Partial<TemplateItem>) {
    const items = section.items.map((item, i) =>
      i === index ? { ...item, ...updated } : item
    );
    onUpdate({ ...section, items });
  }

  function deleteItem(index: number) {
    const items = section.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    onUpdate({ ...section, items });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= section.items.length) return;
    const items = [...section.items];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    onUpdate({
      ...section,
      items: items.map((item, i) => ({ ...item, order: i })),
    });
  }

  function handleItemReorder(activeId: string, overId: string) {
    const oldIndex = section.items.findIndex((i) => i.id === activeId);
    const newIndex = section.items.findIndex((i) => i.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const items = [...section.items];
    const [moved] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, moved);
    onUpdate({
      ...section,
      items: items.map((item, i) => ({ ...item, order: i })),
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      {/* Section Header */}
      <div
        className={`flex items-center justify-between p-4 ${
          expanded && section.items.length > 0
            ? "border-b border-gray-200"
            : ""
        }`}
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Desktop drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="hidden sm:flex text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 touch-none"
            aria-label="Arrastrar sección"
          >
            <GripVertical className="size-5" />
          </button>

          <InlineEdit
            value={section.name}
            onSave={renameSection}
            className="text-lg font-medium text-gray-800"
            inputClassName="text-lg font-medium text-gray-800"
            emptyMessage="El nombre de la sección no puede estar vacío"
            autoFocus={autoFocusName}
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Item count badge */}
          <span className="hidden sm:inline-flex items-center h-6 px-2.5 bg-gray-100 rounded-full text-xs font-medium text-gray-500">
            {section.items.length}{" "}
            {section.items.length === 1 ? "item" : "items"}
          </span>

          {/* Mobile: badge on first row */}
          <span className="sm:hidden inline-flex items-center h-[22px] px-2 bg-gray-100 rounded-full text-[11px] font-medium text-gray-500">
            {section.items.length}{" "}
            {section.items.length === 1 ? "item" : "items"}
          </span>

          {/* Mobile move buttons */}
          <div className="flex sm:hidden gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-md disabled:opacity-30"
              aria-label="Mover sección arriba"
            >
              <ChevronUp className="size-4 text-gray-500" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-md disabled:opacity-30"
              aria-label="Mover sección abajo"
            >
              <ChevronDown className="size-4 text-gray-500" />
            </button>
          </div>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
            aria-expanded={expanded}
            aria-label={expanded ? "Colapsar sección" : "Expandir sección"}
          >
            {expanded ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </button>

          {/* Delete section */}
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Eliminar sección"
                >
                  <Trash2 className="size-5" />
                </button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar sección?</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Eliminar la sección &quot;{section.name}&quot; y todos sus
                  items? Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  variant="destructive"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Items List (expanded) */}
      {expanded && (
        <div className="px-4 pb-4">
          <SortableContext
            items={section.items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.items.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                onRename={(name) => updateItem(index, { name })}
                onDelete={() => deleteItem(index)}
                onToggleType={() =>
                  updateItem(index, {
                    type:
                      item.type === "checklist_item"
                        ? "free_text"
                        : "checklist_item",
                  })
                }
                onMoveUp={() => moveItem(index, -1)}
                onMoveDown={() => moveItem(index, 1)}
                isFirst={index === 0}
                isLast={index === section.items.length - 1}
                autoFocus={item.id === lastAddedItemId}
              />
            ))}
          </SortableContext>

          {/* Add item button */}
          <button
            onClick={addItem}
            className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-primary hover:text-brand-primary-hover"
          >
            <Plus className="size-4" />
            Agregar item
          </button>
        </div>
      )}
    </div>
  );
}
