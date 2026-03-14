"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  saveDraft,
  getDraft as getLocalDraft,
  saveFinding,
  enqueueSyncItem,
} from "./dexie";
import type { DraftInspection, DraftFinding } from "@/types/inspection";

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
