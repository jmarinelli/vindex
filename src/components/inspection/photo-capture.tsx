"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, X, RotateCcw, CloudOff, Loader2 } from "lucide-react";
import type { DraftPhoto } from "@/types/inspection";

interface PhotoCaptureProps {
  photos: DraftPhoto[];
  onCapture: (file: File) => void;
  onDelete?: (photoId: string) => void;
  onRetry?: (photoId: string) => void;
  isOnline?: boolean;
  uploadingPhotoIds?: Set<string>;
}

export function PhotoCapture({
  photos,
  onCapture,
  onDelete,
  onRetry,
  isOnline = true,
  uploadingPhotoIds,
}: PhotoCaptureProps) {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- blob URLs must be created/revoked in effect lifecycle
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
    <div className="flex items-center gap-3 overflow-x-auto py-1 px-1">
      {/* Camera button */}
      <button
        type="button"
        onClick={handleClick}
        className="w-12 h-12 shrink-0 flex items-center justify-center border border-gray-200 rounded-sm bg-white text-gray-500 hover:bg-gray-50"
        aria-label="Agregar foto"
      >
        <Camera className="h-5 w-5" />
      </button>
      {photos.length === 0 && (
        <button type="button" onClick={handleClick} className="text-[13px] text-gray-500">
          Agregar foto
        </button>
      )}
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

        const isFailed = !photo.uploaded && photo.retries >= 3;
        const isUploadingThis = !photo.uploaded && uploadingPhotoIds?.has(photo.id);
        const isOfflineLocal = !photo.uploaded && !isOnline;

        return (
          <div
            key={photo.id}
            className={`w-12 h-12 shrink-0 rounded-sm relative ${
              isFailed ? "border-2 border-red-400" : "border border-gray-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={photo.caption || "Foto de verificación"}
              className="w-full h-full object-cover rounded-sm"
            />
            {/* Upload status overlays */}
            {isUploadingThis && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-sm">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
            )}
            {isFailed && !isUploadingThis && (
              <button
                type="button"
                onClick={() => onRetry?.(photo.id)}
                className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-sm"
                aria-label="Reintentar subida"
              >
                <RotateCcw className="h-4 w-4 text-white" />
              </button>
            )}
            {onDelete && !isUploadingThis && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                aria-label="Eliminar foto"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
            {isOfflineLocal && !isFailed && !isUploadingThis && (
              <div className="absolute bottom-0.5 right-0.5">
                <CloudOff className="h-3 w-3 text-gray-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
