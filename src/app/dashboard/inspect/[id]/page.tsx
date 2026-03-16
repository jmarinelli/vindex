"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Camera, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ShellField } from "@/components/layout/shell-field";
import { SectionTabs } from "@/components/inspection/section-tabs";
import { SyncIndicator } from "@/components/inspection/sync-indicator";
import { ChecklistItemCard } from "@/components/inspection/checklist-item-card";
import { FreeTextItemCard } from "@/components/inspection/free-text-item-card";
import { PhotoCapture } from "@/components/inspection/photo-capture";
import { Skeleton } from "@/components/ui/skeleton";
import { getDraftAction } from "@/lib/actions/inspection";
import { useOfflineStatus, useDraft, usePhotoUpload } from "@/offline/hooks";
import { useSyncStatus } from "@/offline/sync-provider";
import { saveDraft as saveLocalDraft, saveFinding, deletePhoto, savePhoto, getFindingsByEvent, localDb } from "@/offline/dexie";
import { capturePhoto } from "@/offline/photo-queue";
import type { DraftInspection, DraftFinding, FindingStatus, TemplateSnapshot } from "@/types/inspection";

export default function FieldModePage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const searchParams = useSearchParams();

  const isOnline = useOfflineStatus();
  const { syncStatus, triggerSync } = useSyncStatus();

  // Core state
  const [loading, setLoading] = useState(true);
  const [templateSnapshot, setTemplateSnapshot] = useState<TemplateSnapshot | null>(null);
  const [findings, setFindings] = useState<DraftFinding[]>([]);
  const [vehicleName, setVehicleName] = useState("");
  const initialSection = Number(searchParams.get("section") ?? 0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(initialSection);

  // Vehicle photos section state
  const [vehiclePhotosExpanded, setVehiclePhotosExpanded] = useState(false);

  // Draft
  const { draft, loading: draftLoading, setDraft } = useDraft(eventId);

  // Photos
  const {
    photos,
    retryPhoto,
    refreshPhotos,
  } = usePhotoUpload(eventId, triggerSync);


  // Load inspection data
  useEffect(() => {
    if (draftLoading) return;  // Wait for Dexie lookup to finish

    async function load() {
      // Try local draft first
      if (draft) {
        setTemplateSnapshot(draft.templateSnapshot);

        // Load findings from findings table (single source of truth)
        const localFindings = await getFindingsByEvent(eventId);
        setFindings(localFindings);

        setVehicleName(draft.vehicleName);
        setActiveSectionIndex(draft.lastSectionIndex ?? 0);
        // Photos are loaded by usePhotoUpload hook
        const hasVehiclePhotos = photos.some((p) => p.photoType === "vehicle");
        setVehiclePhotosExpanded(hasVehiclePhotos);
        setLoading(false);
        return;
      }

      // Fetch from server
      const result = await getDraftAction(eventId);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "No se pudo cargar la inspección.");
        router.replace("/dashboard");
        return;
      }

      const { event, detail, findings: serverFindings, photos: serverPhotos, vehicle, templateSnapshot: snapshot } = result.data;

      const name = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");

      const draftFindings: DraftFinding[] = serverFindings.map((f) => ({
        id: f.id,
        eventId: f.eventId,
        sectionId: f.sectionId,
        itemId: f.itemId,
        status: (f.status as FindingStatus) ?? "not_evaluated",
        observation: f.observation,
        syncedAt: new Date().toISOString(),
      }));

      // Seed findings into findings table individually
      for (const f of draftFindings) {
        await saveFinding(f);
      }

      const localDraft: DraftInspection = {
        id: event.id,
        vehicleId: event.vehicleId,
        nodeId: event.nodeId,
        vehicleName: name,
        inspectionType: detail.inspectionType,
        requestedBy: detail.requestedBy,
        odometerKm: event.odometerKm,
        eventDate: event.eventDate,
        slug: event.slug,
        templateSnapshot: snapshot,
        findingsSeeded: true,
        lastSectionIndex: 0,
        updatedAt: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      };

      // Save to local DB
      await saveLocalDraft(localDraft);

      // Seed server photos into Dexie so usePhotoUpload picks them up
      // Dedup by serverPhotoId to avoid duplicates on re-entry (#15)
      for (const sp of serverPhotos) {
        const existing = await localDb.photos
          .where("serverPhotoId")
          .equals(sp.id)
          .first();
        if (existing) continue;

        await savePhoto({
          id: sp.id,
          eventId: sp.eventId,
          findingId: sp.findingId,
          photoType: (sp.photoType as "finding" | "vehicle") ?? "finding",
          url: sp.url,
          caption: sp.caption,
          order: sp.order,
          uploaded: true,
          retries: 0,
          serverPhotoId: sp.id,
        });
      }

      setDraft(localDraft);
      setTemplateSnapshot(snapshot);
      setFindings(draftFindings);
      await refreshPhotos();
      const hasVehiclePhotos = serverPhotos.some((p) => p.photoType === "vehicle");
      setVehiclePhotosExpanded(hasVehiclePhotos);
      setVehicleName(name);
      setLoading(false);
    }

    load();
  }, [eventId, draftLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const sections = useMemo(() => templateSnapshot?.sections ?? [], [templateSnapshot]);

  // Compute evaluated counts per section
  // Checklist items count when status !== "not_evaluated"
  // Free text items count when they have observation content
  const evaluatedCounts = useMemo(() => {
    const freeTextItemIds = new Set(
      sections.flatMap((s) =>
        s.items.filter((item) => item.type === "free_text").map((item) => item.id)
      )
    );
    const counts: Record<string, number> = {};
    for (const f of findings) {
      const isFreeText = freeTextItemIds.has(f.itemId);
      if (isFreeText ? f.observation?.trim() : f.status !== "not_evaluated") {
        counts[f.sectionId] = (counts[f.sectionId] ?? 0) + 1;
      }
    }
    return counts;
  }, [findings, sections]);
  const activeSection = sections[activeSectionIndex];
  const totalSections = sections.length;

  // Get findings for the active section
  const sectionFindings = useMemo(() => {
    if (!activeSection) return [];
    return activeSection.items.map((item) => {
      const finding = findings.find(
        (f) => f.sectionId === activeSection.id && f.itemId === item.id
      );
      return { item, finding };
    });
  }, [activeSection, findings]);

  // Get photos for a specific finding
  const getPhotosForFinding = useCallback(
    (findingId: string) => photos.filter((p) => p.findingId === findingId),
    [photos]
  );

  // Vehicle photos
  const vehiclePhotos = useMemo(
    () => photos.filter((p) => p.photoType === "vehicle"),
    [photos]
  );

  // Handle status change
  const handleStatusChange = useCallback(
    async (findingId: string, status: FindingStatus) => {
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, status } : f))
      );

      const finding = findings.find((f) => f.id === findingId);
      if (finding) {
        const updated = { ...finding, status, syncedAt: null };
        await saveFinding(updated);
        triggerSync();
      }
    },
    [findings, triggerSync]
  );

  // Handle observation change (already debounced in the card)
  const handleObservationChange = useCallback(
    async (findingId: string, observation: string) => {
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, observation } : f))
      );

      const finding = findings.find((f) => f.id === findingId);
      if (finding) {
        const updated = { ...finding, observation, syncedAt: null };
        await saveFinding(updated);
        triggerSync();
      }
    },
    [findings, triggerSync]
  );

  // Handle finding photo capture
  const handlePhotoCapture = useCallback(
    async (findingId: string, file: File) => {
      try {
        await capturePhoto({
          file,
          eventId,
          findingId,
          photoType: "finding",
        });
        await refreshPhotos();
        triggerSync();
      } catch {
        toast.error("Error al capturar la foto.");
      }
    },
    [eventId, refreshPhotos, triggerSync]
  );

  // Handle vehicle photo capture
  const handleVehiclePhoto = useCallback(
    async (file: File) => {
      try {
        await capturePhoto({
          file,
          eventId,
          findingId: null,
          photoType: "vehicle",
        });
        await refreshPhotos();
        setVehiclePhotosExpanded(true);
        triggerSync();
      } catch {
        toast.error("Error al capturar la foto.");
      }
    },
    [eventId, refreshPhotos, triggerSync]
  );

  // Handle photo deletion — soft-deletes in Dexie, sync worker handles server
  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      await deletePhoto(photoId);
      await refreshPhotos();
      triggerSync();
    },
    [refreshPhotos, triggerSync]
  );

  // Section navigation
  const goToPrevSection = () => {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(activeSectionIndex - 1);
    }
  };

  const goToNextSection = () => {
    if (activeSectionIndex < totalSections - 1) {
      setActiveSectionIndex(activeSectionIndex + 1);
    }
  };

  const handleClose = () => {
    // Draft auto-saved, just navigate
    router.push("/dashboard");
  };

  const handleFinishReview = () => {
    // Findings already persisted individually, just navigate
    router.push(`/dashboard/inspect/${eventId}/sign`);
  };

  // Update lastSectionIndex in local draft & scroll to top
  useEffect(() => {
    // Scroll the main content area to top on section change
    const main = document.querySelector("main");
    if (main) main.scrollTo(0, 0);

    if (draft && activeSectionIndex !== draft.lastSectionIndex) {
      const updated = { ...draft, lastSectionIndex: activeSectionIndex, updatedAt: new Date().toISOString() };
      saveLocalDraft(updated);
    }
  }, [activeSectionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading skeleton
  if (loading) {
    return (
      <ShellField title="Cargando...">
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ShellField>
    );
  }

  const isFirstSection = activeSectionIndex === 0;
  const isLastSection = activeSectionIndex === totalSections - 1;

  return (
    <ShellField
      title={vehicleName}
      progress={`${activeSectionIndex + 1}/${totalSections}`}
      syncIndicator={<SyncIndicator status={syncStatus} />}
      sectionTabs={
        <SectionTabs
          sections={sections}
          activeIndex={activeSectionIndex}
          onSelect={setActiveSectionIndex}
          evaluatedCounts={evaluatedCounts}
        />
      }
      bottomBar={
        <footer className="h-14 border-t border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
          <button
            onClick={goToPrevSection}
            disabled={isFirstSection}
            className={`text-sm h-12 px-4 font-medium ${
              isFirstSection ? "text-gray-300" : "text-gray-700"
            }`}
          >
            ← Anterior
          </button>

          <button
            onClick={isLastSection ? handleFinishReview : goToNextSection}
            className="text-sm h-12 px-4 text-gray-700 font-medium"
          >
            {isLastSection ? "Revisar →" : "Siguiente →"}
          </button>
        </footer>
      }
      onClose={handleClose}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800">
          ⚠ Sin conexión — los cambios se guardan localmente
        </div>
      )}

      {/* Item cards */}
      <div className="p-4 space-y-4 max-w-3xl mx-auto sm:p-6">
        {/* Vehicle Photos Section — collapsible, top of item area */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setVehiclePhotosExpanded(!vehiclePhotosExpanded)}
            className="w-full flex items-center gap-2 p-3 text-left"
          >
            <Camera className="h-4 w-4 text-gray-500 shrink-0" />
            <span className="text-sm font-medium text-gray-700 flex-1">
              Fotos del vehículo{vehiclePhotos.length > 0 ? ` (${vehiclePhotos.length})` : ""}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${
                vehiclePhotosExpanded ? "" : "-rotate-90"
              }`}
            />
          </button>

          {vehiclePhotosExpanded && (
            <div className="px-3 pb-3">
              <PhotoCapture
                photos={vehiclePhotos}
                onCapture={(file) => handleVehiclePhoto(file)}
                onDelete={handleDeletePhoto}
                onRetry={retryPhoto}
                isOnline={isOnline}

              />
            </div>
          )}
        </div>

        {activeSection && activeSection.items.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            Esta sección no tiene items.
          </p>
        )}

        {sectionFindings.map(({ item, finding }) => {
          if (!finding) return null;

          const itemPhotos = getPhotosForFinding(finding.id);

          if (item.type === "free_text") {
            return (
              <FreeTextItemCard
                key={item.id}
                finding={finding}
                itemName={item.name}
                photos={itemPhotos}
                onObservationChange={handleObservationChange}
                onPhotoCapture={handlePhotoCapture}
                onPhotoDelete={handleDeletePhoto}
                onPhotoRetry={retryPhoto}
                isOnline={isOnline}

              />
            );
          }

          return (
            <ChecklistItemCard
              key={item.id}
              finding={finding}
              itemName={item.name}
              photos={itemPhotos}
              onStatusChange={handleStatusChange}
              onObservationChange={handleObservationChange}
              onPhotoCapture={handlePhotoCapture}
              onPhotoDelete={handleDeletePhoto}
              onPhotoRetry={retryPhoto}
              isOnline={isOnline}
            />
          );
        })}
      </div>
    </ShellField>
  );
}
