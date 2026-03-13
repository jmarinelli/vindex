"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { StatusButtons } from "./status-buttons";
import { PhotoCapture } from "./photo-capture";
import type { DraftFinding, DraftPhoto, FindingStatus } from "@/types/inspection";

const STATUS_BORDER_COLORS: Record<FindingStatus, string> = {
  good: "border-l-status-good",
  attention: "border-l-status-attention",
  critical: "border-l-status-critical",
  not_evaluated: "border-l-gray-200",
};

interface ChecklistItemCardProps {
  finding: DraftFinding;
  itemName: string;
  photos: DraftPhoto[];
  onStatusChange: (findingId: string, status: FindingStatus) => void;
  onObservationChange: (findingId: string, observation: string) => void;
  onPhotoCapture: (findingId: string, file: File) => void;
  onPhotoDelete?: (photoId: string) => void;
}

export function ChecklistItemCard({
  finding,
  itemName,
  photos,
  onStatusChange,
  onObservationChange,
  onPhotoCapture,
  onPhotoDelete,
}: ChecklistItemCardProps) {
  const [observation, setObservation] = useState(finding.observation ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync observation from props
  useEffect(() => {
    setObservation(finding.observation ?? "");
  }, [finding.observation]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [observation, autoResize]);

  const handleObservationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setObservation(value);

    // Debounce 500ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onObservationChange(finding.id, value);
    }, 500);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-md shadow-sm p-4 space-y-3 border-l-[3px]",
        STATUS_BORDER_COLORS[finding.status]
      )}
    >
      {/* Item name */}
      <p className="text-base font-medium text-gray-800">{itemName}</p>

      {/* Status buttons */}
      <StatusButtons
        value={finding.status}
        onChange={(status) => onStatusChange(finding.id, status)}
      />

      {/* Observation */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Observación:</label>
        <textarea
          ref={textareaRef}
          value={observation}
          onChange={handleObservationChange}
          placeholder="Agregar observación..."
          rows={1}
          className="w-full text-base border border-gray-200 rounded-sm px-3 py-2 resize-none focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 placeholder:text-gray-400"
        />
      </div>

      {/* Photos */}
      <PhotoCapture
        photos={photos}
        onCapture={(file) => onPhotoCapture(finding.id, file)}
        onDelete={onPhotoDelete}
      />
    </div>
  );
}
