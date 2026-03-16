"use client";

import { uploadToCloudinary } from "@/lib/services/cloudinary";
import { saveEventPhotoAction } from "@/lib/actions/inspection";
import { localDb } from "./dexie";
import type { DraftPhoto } from "@/types/inspection";

/**
 * Upload a single photo to Cloudinary with exponential backoff retry.
 * Returns the Cloudinary URL on success.
 * After max retries, updates the photo's retries count in Dexie and throws.
 */
export async function uploadWithRetry(
  photo: DraftPhoto,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const url = await uploadToCloudinary({
        blob: photo.blob!,
        eventId: photo.eventId,
        photoType: photo.photoType,
        photoId: photo.id,
      });
      return url;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Max retries exceeded — update retries count in Dexie
  await localDb.photos.update(photo.id, {
    retries: (photo.retries ?? 0) + maxRetries,
  });

  throw lastError ?? new Error("Upload failed after retries");
}

/**
 * Upload a single photo and save to server.
 * Returns true on success, false on failure.
 */
export async function uploadAndSavePhoto(photo: DraftPhoto): Promise<boolean> {
  try {
    const url = await uploadWithRetry(photo);
    const result = await saveEventPhotoAction({
      eventId: photo.eventId,
      findingId: photo.findingId,
      photoType: photo.photoType,
      url,
      caption: photo.caption,
      order: photo.order,
    });
    if (result.success) {
      await localDb.photos.update(photo.id, {
        uploaded: true,
        url,
        serverPhotoId: result.data?.eventPhoto.id,
      });
      return true;
    }
  } catch {
    // Upload failed — retries count already updated by uploadWithRetry
  }
  return false;
}

/**
 * Process all pending (unuploaded) photos for an event sequentially.
 * On success: calls saveEventPhotoAction, updates Dexie.
 * Per-photo errors are caught — one failure doesn't abort the queue.
 */
export async function processPhotoQueue(eventId: string): Promise<void> {
  const photos = await localDb.photos
    .where("eventId")
    .equals(eventId)
    .toArray();

  const pending = photos.filter((p) => !p.uploaded && p.blob);

  for (const photo of pending) {
    try {
      const cloudinaryUrl = await uploadWithRetry(photo);

      // Persist to server
      const result = await saveEventPhotoAction({
        eventId: photo.eventId,
        findingId: photo.findingId,
        photoType: photo.photoType,
        url: cloudinaryUrl,
        caption: photo.caption,
        order: photo.order,
      });

      if (result.success) {
        await localDb.photos.update(photo.id, {
          uploaded: true,
          url: cloudinaryUrl,
          serverPhotoId: result.data?.eventPhoto.id,
        });
      }
    } catch {
      // Per-photo error — continue with next photo
    }
  }
}
