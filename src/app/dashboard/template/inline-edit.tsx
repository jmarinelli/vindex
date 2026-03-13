"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  emptyMessage?: string;
  autoFocus?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  placeholder,
  emptyMessage = "El nombre no puede estar vacío",
  autoFocus = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(autoFocus);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function confirm() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      setDraft(value);
      setEditing(false);
      return;
    }
    onSave(trimmed);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      confirm();
    } else if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={emptyMessage}
        className={cn(
          "bg-transparent border-2 border-brand-accent rounded-md px-1 outline-none",
          "text-[16px]", // prevent iOS zoom
          inputClassName
        )}
        style={{ width: "100%", maxWidth: "100%" }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn("cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 truncate", className)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setEditing(true);
      }}
    >
      {value || placeholder}
    </span>
  );
}
