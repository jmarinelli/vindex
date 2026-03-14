"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PhotoCapture } from "./photo-capture";
import type { DraftFinding, DraftPhoto } from "@/types/inspection";

interface FreeTextItemCardProps {
  finding: DraftFinding;
  itemName: string;
  photos: DraftPhoto[];
  onObservationChange: (findingId: string, observation: string) => void;
  onPhotoCapture: (findingId: string, file: File) => void;
  onPhotoDelete?: (photoId: string) => void;
}

export function FreeTextItemCard({
  finding,
  itemName,
  photos,
  onObservationChange,
  onPhotoCapture,
  onPhotoDelete,
}: FreeTextItemCardProps) {
  const [text, setText] = useState(finding.observation ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local state from prop change
    setText(finding.observation ?? "");
  }, [finding.observation]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onObservationChange(finding.id, value);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 space-y-3">
      <p className="text-base font-medium text-gray-800">{itemName}</p>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder="Escribir..."
        rows={3}
        className="w-full text-base border border-gray-200 rounded-sm px-3 py-2 resize-none focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 placeholder:text-gray-400"
      />

      <PhotoCapture
        photos={photos}
        onCapture={(file) => onPhotoCapture(finding.id, file)}
        onDelete={onPhotoDelete}
      />
    </div>
  );
}
