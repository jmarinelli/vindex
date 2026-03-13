"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { InlineEdit } from "./inline-edit";
import type { TemplateItem } from "@/lib/validators";

interface ItemRowProps {
  item: TemplateItem;
  onRename: (name: string) => void;
  onDelete: () => void;
  onToggleType: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  autoFocus?: boolean;
}

export function ItemRow({
  item,
  onRename,
  onDelete,
  onToggleType,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  autoFocus = false,
}: ItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isChecklist = item.type === "checklist_item";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 group/item"
    >
      {/* Left side */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Desktop drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="hidden sm:flex text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          aria-label="Arrastrar item"
        >
          <GripVertical className="size-4" />
        </button>

        <InlineEdit
          value={item.name}
          onSave={onRename}
          className="text-base text-gray-700"
          inputClassName="text-base text-gray-700"
          emptyMessage="El nombre del item no puede estar vacío"
          autoFocus={autoFocus}
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5 shrink-0 ml-2">
        {/* Type toggle badge */}
        <button
          onClick={onToggleType}
          role="switch"
          aria-checked={isChecklist}
          className={`inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-medium transition-colors ${
            isChecklist
              ? "bg-[#E0F2FE] text-brand-accent"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {isChecklist ? "☑ Checklist" : "✎ Texto libre"}
        </button>

        {/* Mobile move buttons */}
        <div className="flex sm:hidden gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-md disabled:opacity-30"
            aria-label="Mover arriba"
          >
            <ChevronUp className="size-4 text-gray-500" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-md disabled:opacity-30"
            aria-label="Mover abajo"
          >
            <ChevronDown className="size-4 text-gray-500" />
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-600 transition-colors"
          aria-label="Eliminar item"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
