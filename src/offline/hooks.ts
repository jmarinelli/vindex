"use client";

import { useState, useEffect, useCallback } from "react";
import {
  saveDraft,
  getDraft as getLocalDraft,
  getPhotosByEvent,
  localDb,
} from "./dexie";
import type { DraftInspection, DraftPhoto } from "@/types/inspection";

// ─── useOfflineStatus ───────────────────────────────────────────────────────

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    () => typeof window !== "undefined" && navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// ─── useDraft ───────────────────────────────────────────────────────────────

export function useDraft(eventId: string | null) {
  const [draft, setDraft] = useState<DraftInspection | null>(null);
  const [loading, setLoading] = useState(() => !!eventId);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    getLocalDraft(eventId).then((d) => {
      setDraft(d ?? null);
      setLoading(false);
    });
  }, [eventId]);

  const updateDraft = useCallback(
    async (updates: Partial<DraftInspection>) => {
      if (!draft) return;
      const updated = { ...draft, ...updates, updatedAt: new Date().toISOString() };
      setDraft(updated);
      await saveDraft(updated);
    },
    [draft]
  );

  return { draft, loading, setDraft, updateDraft };
}

// ─── usePhotoUpload ──────────────────────────────────────────────────────────

export function usePhotoUpload(eventId: string, triggerSync?: () => void) {
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);

  // Load photos from Dexie on mount
  useEffect(() => {
    getPhotosByEvent(eventId).then(setPhotos);
  }, [eventId]);

  // Refresh local state from Dexie
  const refreshPhotos = useCallback(async () => {
    const updated = await getPhotosByEvent(eventId);
    setPhotos(updated);
  }, [eventId]);

  const pendingCount = photos.filter((p) => !p.uploaded).length;
  const failedCount = photos.filter((p) => !p.uploaded && p.retries >= 3).length;

  // Retry all failed photos (retries >= 3): reset retries and nudge sync worker
  const retryFailed = useCallback(async () => {
    const failed = photos.filter((p) => !p.uploaded && p.retries >= 3);
    for (const photo of failed) {
      await localDb.photos.update(photo.id, { retries: 0 });
    }
    await refreshPhotos();
    triggerSync?.();
  }, [photos, refreshPhotos, triggerSync]);

  // Retry a single photo: reset retries and nudge sync worker
  const retryPhoto = useCallback(
    async (photoId: string) => {
      await localDb.photos.update(photoId, { retries: 0 });
      await refreshPhotos();
      triggerSync?.();
    },
    [refreshPhotos, triggerSync]
  );

  return {
    photos,
    pendingCount,
    failedCount,
    retryFailed,
    retryPhoto,
    refreshPhotos,
  };
}
