"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Pencil, User, AlertTriangle, CloudOff } from "lucide-react";
import { InspectionList } from "@/components/inspection/inspection-list";
import { OfflineDraftCard } from "@/components/inspection/offline-draft-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInspectionsAction,
  getNodeSlugAction,
} from "@/lib/actions/inspection";
import { useOfflineStatus } from "@/offline/hooks";
import {
  getAllDrafts,
  getFindingsByEvent,
  getPhotosByEvent,
  clearInspectionData,
} from "@/offline/dexie";
import type { InspectionListItem } from "@/lib/services/inspection";
import type { DraftInspection } from "@/types/inspection";

interface OfflineDraftItem {
  draft: DraftInspection;
  findingCounts: { total: number; evaluated: number };
  photoCount: number;
  observationCount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isOnline = useOfflineStatus();
  const [inspections, setInspections] = useState<InspectionListItem[] | null>(
    null
  );
  const [nodeSlug, setNodeSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Defer rendering until after mount to avoid SSR hydration mismatch
  // (useOfflineStatus depends on navigator.onLine which differs server vs client)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Offline state — showOffline can be true even when navigator.onLine is true
  // (unreliable) if the server call failed and we fell back to Dexie.
  const [showOffline, setShowOffline] = useState(false);
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineDraftItem[] | null>(null);
  const [offlineLoaded, setOfflineLoaded] = useState(false);

  // Track if a load is in progress to avoid duplicate calls
  const loadingRef = useRef(false);

  const loadFromDexie = useCallback(async () => {
    const drafts = await getAllDrafts();
    const items: OfflineDraftItem[] = await Promise.all(
      drafts.map(async (draft) => {
        const findings = await getFindingsByEvent(draft.id);
        const photos = await getPhotosByEvent(draft.id);
        const checklistItemIds = new Set<string>();
        for (const section of draft.templateSnapshot.sections) {
          for (const item of section.items) {
            if (item.type === "checklist_item") {
              checklistItemIds.add(item.id);
            }
          }
        }
        const total = checklistItemIds.size;
        const evaluated = findings.filter(
          (f) => checklistItemIds.has(f.itemId) && f.status !== "not_evaluated"
        ).length;
        const photoCount = photos.length;
        const observationCount = findings.filter(
          (f) => f.observation && f.observation.trim().length > 0
        ).length;
        return {
          draft,
          findingCounts: { total, evaluated },
          photoCount,
          observationCount,
        };
      })
    );
    setOfflineDrafts(items);
    setOfflineLoaded(true);
  }, []);

  const loadFromServer = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    setInspections(null);

    // Quick connectivity probe before calling server actions.
    // navigator.onLine is unreliable, and Next.js may handle server action
    // network errors internally (error overlay, retry) rather than rejecting
    // the promise to user code. A simple HEAD request is the safest check.
    try {
      await fetch("/api/auth/session", { method: "HEAD" });
    } catch {
      // Network unreachable — go straight to Dexie, skip server actions
      setShowOffline(true);
      await loadFromDexie();
      loadingRef.current = false;
      return;
    }

    try {
      const [inspResult, slugResult] = await Promise.all([
        getInspectionsAction(),
        getNodeSlugAction(),
      ]);

      if (!inspResult.success) {
        // Server returned an error (could be auth failure while offline,
        // or a real server error). Fall back to Dexie drafts.
        setShowOffline(true);
        await loadFromDexie();
        return;
      }

      const items = inspResult.data ?? [];
      setInspections(items);
      if (slugResult.success && slugResult.data) {
        setNodeSlug(slugResult.data);
      }

      // Clean up Dexie drafts for inspections that are now signed on the server
      const signedEventIds = new Set(
        items
          .filter((i) => i.event.status === "signed")
          .map((i) => i.event.id)
      );
      if (signedEventIds.size > 0) {
        const localDrafts = await getAllDrafts();
        for (const draft of localDrafts) {
          if (signedEventIds.has(draft.id)) {
            await clearInspectionData(draft.id);
          }
        }
      }
    } catch {
      // Server call failed. Fall back to Dexie.
      setShowOffline(true);
      await loadFromDexie();
    } finally {
      loadingRef.current = false;
    }
  }, [loadFromDexie]);

  useEffect(() => {
    if (!mounted) return;
    if (isOnline) {
      // Reset offline state — if the server call fails again,
      // loadFromServer will set showOffline back to true.
      setShowOffline(false);
      setOfflineLoaded(false);
      loadFromServer();
    } else {
      setShowOffline(true);
      setInspections(null);
      setError(null);
      loadFromDexie();
    }
  }, [mounted, isOnline, loadFromServer, loadFromDexie]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Inspector";

  // Before mount, always render loading skeleton (matches SSR output, no hydration mismatch)
  if (!mounted) {
    return (
      <ShellDashboard>
        <div className="space-y-6">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      </ShellDashboard>
    );
  }

  return (
    <ShellDashboard>
      <div className="space-y-6">
        {/* ─── Offline Mode ──────────────────────────────────────────── */}
        {showOffline && (
          <>
            <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">
              Bienvenido, {firstName}
            </h1>

            {/* Offline Banner */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <CloudOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-700">
                Sin conexión — solo se muestran borradores locales
              </span>
            </div>

            {/* Disabled New Inspection Button */}
            <div className="flex items-center justify-center gap-2 w-full h-12 bg-gray-100 text-gray-400 text-base font-medium rounded-md cursor-not-allowed">
              <Plus className="h-5 w-5" />
              Nueva Inspección
            </div>

            {/* Offline Draft List or Empty State */}
            {!offlineLoaded && (
              <div className="space-y-3">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            )}

            {offlineLoaded && offlineDrafts && offlineDrafts.length > 0 && (
              <div className="space-y-4">
                <p className="text-base font-medium text-gray-700">
                  Mis Inspecciones ({offlineDrafts.length})
                </p>
                <div className="space-y-3">
                  {offlineDrafts.map((item) => (
                    <OfflineDraftCard
                      key={item.draft.id}
                      draft={item.draft}
                      findingCounts={item.findingCounts}
                      photoCount={item.photoCount}
                      observationCount={item.observationCount}
                    />
                  ))}
                </div>
              </div>
            )}

            {offlineLoaded && offlineDrafts && offlineDrafts.length === 0 && (
              <div className="text-center py-12" role="status">
                <CloudOff className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-700">
                  No hay borradores locales
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Conectate a internet para ver tus inspecciones.
                </p>
              </div>
            )}
          </>
        )}

        {/* ─── Online Mode ───────────────────────────────────────────── */}
        {!showOffline && (
          <>
            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <p className="mt-4 text-base text-gray-700">
                  Error al cargar tus inspecciones.
                </p>
                <button
                  onClick={loadFromServer}
                  className="mt-3 px-4 py-2 text-sm bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Loading State */}
            {!error && inspections === null && (
              <div className="space-y-6">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="space-y-3">
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-36 w-full" />
                </div>
              </div>
            )}

            {/* Loaded State */}
            {!error && inspections !== null && (
              <>
                {/* Welcome Header */}
                <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">
                  Bienvenido, {firstName}
                </h1>

                {/* New Inspection Button */}
                <Link
                  href="/dashboard/inspect"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-md transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Nueva Inspección
                </Link>

                {/* Inspection List */}
                <InspectionList inspections={inspections} />

                {/* Quick Links */}
                <div className="pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs font-medium text-gray-400 uppercase">
                      Enlaces rápidos
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/dashboard/template"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                      Editor de Template
                    </Link>
                    {nodeSlug && (
                      <Link
                        href={`/inspector/${nodeSlug}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Mi Perfil Público
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </ShellDashboard>
  );
}
