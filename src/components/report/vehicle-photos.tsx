"use client";

import { useState, useCallback } from "react";
import type { EventPhoto } from "@/db/schema";
import { PhotoLightbox } from "./photo-lightbox";

interface VehiclePhotosProps {
  photos: EventPhoto[];
}

export function VehiclePhotos({ photos }: VehiclePhotosProps) {
  const [lightbox, setLightbox] = useState<{
    photos: EventPhoto[];
    currentIndex: number;
  } | null>(null);

  const handlePhotoClick = useCallback(
    (index: number) => {
      setLightbox({ photos, currentIndex: index });
    },
    [photos]
  );

  if (photos.length === 0) return null;

  const maxVisible = 6;
  const visiblePhotos = photos.slice(0, maxVisible);
  const overflow = photos.length - maxVisible;

  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-gray-800">
          Fotos del vehículo
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {visiblePhotos.map((photo, idx) => {
            const isLastVisible = idx === visiblePhotos.length - 1 && overflow > 0;
            return (
              <button
                key={photo.id}
                type="button"
                className="relative aspect-[4/3] rounded-sm border border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handlePhotoClick(idx)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Foto del vehículo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isLastVisible && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      +{overflow}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          currentIndex={lightbox.currentIndex}
          onClose={() => setLightbox(null)}
          onNavigate={(index) =>
            setLightbox((prev) => (prev ? { ...prev, currentIndex: index } : null))
          }
        />
      )}
    </>
  );
}
