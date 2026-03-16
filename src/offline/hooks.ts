"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  saveDraft,
  getDraft as getLocalDraft,
  saveFinding,
  enqueueSyncItem,
  getPhotosByEvent,
  localDb,
} from "./dexie";
import { processPhotoQueue, uploadAndSavePhoto } from "./photo-upload";
import type { DraftInspection, DraftFinding, DraftPhoto } from "@/types/inspection";

// ─── useOfflineStatus ───────────────────────────────────────────────────────

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
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

// ─── useAutoSave ────────────────────────────────────────────────────────────

export type SyncStatus = "saved" | "syncing" | "synced" | "offline";

export function useAutoSave(draft: DraftInspection | null, isOnline: boolean) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isOnline ? "saved" : "offline"
  );
  const syncedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Update status based on connectivity
  useEffect(() => {
    if (!isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external navigator.onLine state
      setSyncStatus("offline");
    }
  }, [isOnline]);

  /**
   * Save a finding status change immediately (no debounce).
   */
  const saveFindingStatus = useCallback(
    async (finding: DraftFinding) => {
      await saveFinding(finding);

      if (isOnline) {
        setSyncStatus("syncing");
        await enqueueSyncItem({
          type: "finding",
          payload: {
            findingId: finding.id,
            status: finding.status,
          },
          createdAt: new Date().toISOString(),
          retries: 0,
        });
        setSyncStatus("synced");
        if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
        syncedTimerRef.current = setTimeout(() => setSyncStatus("saved"), 2000);
      } else {
        setSyncStatus("offline");
      }
    },
    [isOnline]
  );

  /**
   * Save an observation with debounced sync.
   */
  const saveObservation = useCallback(
    async (finding: DraftFinding) => {
      await saveFinding(finding);

      if (isOnline) {
        setSyncStatus("syncing");
        await enqueueSyncItem({
          type: "finding",
          payload: {
            findingId: finding.id,
            observation: finding.observation,
          },
          createdAt: new Date().toISOString(),
          retries: 0,
        });
        setSyncStatus("synced");
        if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
        syncedTimerRef.current = setTimeout(() => setSyncStatus("saved"), 2000);
      } else {
        setSyncStatus("offline");
      }
    },
    [isOnline]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
    };
  }, []);

  return { syncStatus, saveFindingStatus, saveObservation };
}

// ─── usePhotoUpload ──────────────────────────────────────────────────────────

export function usePhotoUpload(eventId: string, isOnline: boolean) {
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPhotoIds, setUploadingPhotoIds] = useState<Set<string>>(new Set());
  const prevOnlineRef = useRef(isOnline);
  const initialProcessDone = useRef(false);

  // Load photos from Dexie on mount
  useEffect(() => {
    getPhotosByEvent(eventId).then(setPhotos);
  }, [eventId]);

  // Refresh local state from Dexie
  const refreshPhotos = useCallback(async () => {
    const updated = await getPhotosByEvent(eventId);
    setPhotos(updated);
  }, [eventId]);

  // Process pending uploads (used on mount and offline→online)
  const processPending = useCallback(async () => {
    setIsUploading(true);
    await processPhotoQueue(eventId);
    setIsUploading(false);
    await refreshPhotos();
  }, [eventId, refreshPhotos]);

  // On mount: process any pending photos if online
  useEffect(() => {
    if (initialProcessDone.current) return;
    initialProcessDone.current = true;

    if (isOnline) {
      getPhotosByEvent(eventId).then((loaded) => {
        const hasPending = loaded.some((p) => !p.uploaded && p.blob && p.retries < 3);
        if (hasPending) processPending();
      });
    }
  }, [eventId, isOnline, processPending]);

  // When transitioning from offline → online, process the queue
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      queueMicrotask(processPending);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, processPending]);

  const pendingCount = photos.filter((p) => !p.uploaded).length;
  const failedCount = photos.filter((p) => !p.uploaded && p.retries >= 3).length;

  // Upload a single photo immediately (called after capture when online)
  const uploadPhoto = useCallback(
    async (photo: DraftPhoto) => {
      if (!isOnline || !photo.blob) return;
      setIsUploading(true);
      setUploadingPhotoIds((prev) => new Set(prev).add(photo.id));
      await uploadAndSavePhoto(photo);
      setUploadingPhotoIds((prev) => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
      await refreshPhotos();
      setIsUploading(false);
    },
    [isOnline, refreshPhotos]
  );

  // Retry all failed photos (retries >= 3)
  const retryFailed = useCallback(async () => {
    const failed = photos.filter((p) => !p.uploaded && p.retries >= 3);
    for (const photo of failed) {
      await localDb.photos.update(photo.id, { retries: 0 });
    }
    setIsUploading(true);
    await processPhotoQueue(eventId);
    setIsUploading(false);
    await refreshPhotos();
  }, [photos, eventId, refreshPhotos]);

  // Retry a single photo
  const retryPhoto = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      await localDb.photos.update(photoId, { retries: 0 });
      setIsUploading(true);
      if (photo) setUploadingPhotoIds((prev) => new Set(prev).add(photoId));
      await processPhotoQueue(eventId);
      setUploadingPhotoIds((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
      setIsUploading(false);
      await refreshPhotos();
    },
    [photos, eventId, refreshPhotos]
  );

  return {
    photos,
    pendingCount,
    failedCount,
    isUploading,
    uploadingPhotoIds,
    uploadPhoto,
    retryFailed,
    retryPhoto,
    refreshPhotos,
  };
}
