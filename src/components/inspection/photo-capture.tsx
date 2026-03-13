"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, X } from "lucide-react";
import type { DraftPhoto } from "@/types/inspection";

interface PhotoCaptureProps {
  photos: DraftPhoto[];
  onCapture: (file: File) => void;
  onDelete?: (photoId: string) => void;
}

export function PhotoCapture({ photos, onCapture, onDelete }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  // Create/revoke blob URLs
  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const photo of photos) {
      if (photo.blob) {
        urls[photo.id] = URL.createObjectURL(photo.blob);
      } else if (photo.url) {
        urls[photo.id] = photo.url;
      }
    }
    setBlobUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [photos]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      // Reset input so the same file can be captured again
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {/* Camera button */}
      <button
        type="button"
        onClick={handleClick}
        className="w-12 h-12 shrink-0 flex items-center justify-center border border-gray-200 rounded-sm bg-white text-gray-500 hover:bg-gray-50"
        aria-label="Agregar foto"
      >
        <Camera className="h-5 w-5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Thumbnails */}
      {photos.map((photo) => {
        const url = blobUrls[photo.id];
        if (!url) return null;

        return (
          <div
            key={photo.id}
            className="w-16 h-16 shrink-0 rounded-sm border border-gray-200 overflow-hidden relative group"
          >
            <img
              src={url}
              alt={photo.caption || "Foto de inspección"}
              className="w-full h-full object-cover"
            />
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(photo.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar foto"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
            {!photo.uploaded && photo.blob && (
              <div className="absolute bottom-0.5 right-0.5">
                <span className="text-[10px] text-gray-400">local</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
