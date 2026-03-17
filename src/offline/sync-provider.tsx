"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { getUnsyncedFindings, getUnsyncedPhotos, getPendingPhotoDeletions } from "./dexie";
import { processSyncQueue } from "./sync";

export type SyncStatus = "saved" | "syncing" | "synced" | "offline";

interface SyncContextValue {
  syncStatus: SyncStatus;
  pendingCount: number;
  triggerSync: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  syncStatus: "saved",
  pendingCount: 0,
  triggerSync: () => {},
});

export function useSyncStatus(): SyncContextValue {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    typeof navigator !== "undefined" && navigator.onLine ? "saved" : "offline"
  );
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncingRef = useRef(false);

  // Refresh the pending count from Dexie
  const refreshPendingCount = useCallback(async () => {
    const [findings, photos, deletions] = await Promise.all([
      getUnsyncedFindings(),
      getUnsyncedPhotos(),
      getPendingPhotoDeletions(),
    ]);
    const count = findings.length + photos.length + deletions.length;
    setPendingCount(count);
    return count;
  }, []);

  // Core sync function
  const runSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const count = await refreshPendingCount();
    if (count === 0) {
      setSyncStatus("synced");
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus("syncing");

    try {
      await processSyncQueue();
    } finally {
      isSyncingRef.current = false;
      const remaining = await refreshPendingCount();
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSyncStatus("offline");
      } else if (remaining === 0) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("saved");
      }
    }
  }, [refreshPendingCount]);

  // Public trigger
  const triggerSync = useCallback(() => {
    // Update status to "saved" immediately (data persisted in Dexie)
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
    } else {
      setSyncStatus("saved");
    }
    // Schedule sync
    queueMicrotask(runSync);
  }, [runSync]);

  // On mount: sync if online and pending items exist
  useEffect(() => {
    refreshPendingCount().then((count) => {
      if (count > 0 && navigator.onLine) {
        runSync();
      } else if (count === 0 && navigator.onLine) {
        setSyncStatus("synced");
      }
    });
  }, [refreshPendingCount, runSync]);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      runSync();
    };
    const handleOffline = () => {
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [runSync]);

  // Periodic sync check (every 5s). Also triggers sync when pending items
  // exist — this handles the case where we loaded from SW cache with
  // navigator.onLine already true (so the 'online' event never fires).
  useEffect(() => {
    const interval = setInterval(async () => {
      const count = await refreshPendingCount();
      if (count > 0 && navigator.onLine) {
        runSync();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshPendingCount, runSync]);

  // Ask the SW to cache the current page's HTML after client-side navigations
  // so it's available offline on refresh/direct access.
  const pathname = usePathname();
  useEffect(() => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_PAGE",
        url: pathname,
      });
    }
  }, [pathname]);

  return (
    <SyncContext.Provider value={{ syncStatus, pendingCount, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}
