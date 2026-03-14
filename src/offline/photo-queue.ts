"use client";

import { savePhoto, getPhotosByEvent } from "./dexie";
import { uuid } from "@/lib/utils";
import type { DraftPhoto } from "@/types/inspection";

/**
 * Compress an image blob using canvas API.
 * Target: ~500KB–1MB.
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Capture a photo from a file input, compress it, and save to Dexie.
 */
export async function capturePhoto(params: {
  file: File;
  eventId: string;
  findingId: string | null;
  photoType: "finding" | "vehicle";
}): Promise<DraftPhoto> {
  const blob = await compressImage(params.file);

  const photos = await getPhotosByEvent(params.eventId);
  const sameTypePhotos = params.photoType === "finding"
    ? photos.filter((p) => p.findingId === params.findingId)
    : photos.filter((p) => p.photoType === "vehicle");

  const photo: DraftPhoto = {
    id: uuid(),
    eventId: params.eventId,
    findingId: params.findingId,
    photoType: params.photoType,
    blob,
    url: null,
    caption: null,
    order: sameTypePhotos.length,
    uploaded: false,
  };

  await savePhoto(photo);
  return photo;
}
