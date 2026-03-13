"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { ShellField } from "@/components/layout/shell-field";
import { SectionTabs } from "@/components/inspection/section-tabs";
import { SyncIndicator } from "@/components/inspection/sync-indicator";
import { ChecklistItemCard } from "@/components/inspection/checklist-item-card";
import { FreeTextItemCard } from "@/components/inspection/free-text-item-card";
import { PhotoCapture } from "@/components/inspection/photo-capture";
import { Skeleton } from "@/components/ui/skeleton";
import { getDraftAction, updateFindingAction } from "@/lib/actions/inspection";
import { useOfflineStatus, useAutoSave, useDraft } from "@/offline/hooks";
import { saveDraft as saveLocalDraft, saveFinding as saveLocalFinding, getPhotosByEvent } from "@/offline/dexie";
import { capturePhoto } from "@/offline/photo-queue";
import type { DraftInspection, DraftFinding, DraftPhoto, FindingStatus, TemplateSnapshot } from "@/types/inspection";
import type { TemplateSection } from "@/lib/validators";

export default function FieldModePage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const isOnline = useOfflineStatus();

  // Core state
  const [loading, setLoading] = useState(true);
  const [templateSnapshot, setTemplateSnapshot] = useState<TemplateSnapshot | null>(null);
  const [findings, setFindings] = useState<DraftFinding[]>([]);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [vehicleName, setVehicleName] = useState("");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Draft & auto-save
  const { draft, setDraft } = useDraft(eventId);
  const { syncStatus, saveFindingStatus, saveObservation } = useAutoSave(draft, isOnline);

  // Load inspection data
  useEffect(() => {
    async function load() {
      // Try local draft first
      if (draft) {
        setTemplateSnapshot(draft.templateSnapshot);
        setFindings(draft.findings);
        setVehicleName(draft.vehicleName);
        setActiveSectionIndex(draft.lastSectionIndex ?? 0);
        // Load photos from Dexie photos table (blobs aren't stored in drafts)
        const localPhotos = await getPhotosByEvent(eventId);
        setPhotos(localPhotos);
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

      const { event, detail, findings: serverFindings, templateSnapshot: snapshot } = result.data;

      const name = sessionStorage.getItem("vindex_inspect_vehicleName") ?? "Vehículo";

      const draftFindings: DraftFinding[] = serverFindings.map((f) => ({
        id: f.id,
        eventId: f.eventId,
        sectionId: f.sectionId,
        itemId: f.itemId,
        status: (f.status as FindingStatus) ?? "not_evaluated",
        observation: f.observation,
      }));

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
        findings: draftFindings,
        photos: [],
        lastSectionIndex: 0,
        updatedAt: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      };

      // Save to local DB
      await saveLocalDraft(localDraft);
      setDraft(localDraft);
      setTemplateSnapshot(snapshot);
      setFindings(draftFindings);
      // Load any previously captured photos from Dexie
      const localPhotos = await getPhotosByEvent(eventId);
      setPhotos(localPhotos);
      setVehicleName(name);
      setLoading(false);
    }

    load();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute evaluated counts per section
  const evaluatedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of findings) {
      if (f.status !== "not_evaluated") {
        counts[f.sectionId] = (counts[f.sectionId] ?? 0) + 1;
      }
    }
    return counts;
  }, [findings]);

  const sections = templateSnapshot?.sections ?? [];
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

  // General photos (not tied to any finding)
  const generalPhotos = useMemo(
    () => photos.filter((p) => !p.findingId),
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
        const updated = { ...finding, status };
        await saveFindingStatus(updated);

        // Sync to server if online
        if (isOnline) {
          updateFindingAction({ findingId, status }).catch(() => {});
        }
      }
    },
    [findings, saveFindingStatus, isOnline]
  );

  // Handle observation change (already debounced in the card)
  const handleObservationChange = useCallback(
    async (findingId: string, observation: string) => {
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, observation } : f))
      );

      const finding = findings.find((f) => f.id === findingId);
      if (finding) {
        const updated = { ...finding, observation };
        await saveObservation(updated);

        if (isOnline) {
          updateFindingAction({ findingId, observation }).catch(() => {});
        }
      }
    },
    [findings, saveObservation, isOnline]
  );

  // Handle photo capture
  const handlePhotoCapture = useCallback(
    async (findingId: string, file: File) => {
      try {
        const photo = await capturePhoto({
          file,
          eventId,
          findingId,
        });
        setPhotos((prev) => [...prev, photo]);
      } catch {
        toast.error("Error al capturar la foto.");
      }
    },
    [eventId]
  );

  // Handle general photo (from bottom bar)
  const handleGeneralPhoto = useCallback(
    async (file: File) => {
      try {
        const photo = await capturePhoto({
          file,
          eventId,
          findingId: null,
        });
        setPhotos((prev) => [...prev, photo]);
      } catch {
        toast.error("Error al capturar la foto.");
      }
    },
    [eventId]
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

  const handleFinishReview = async () => {
    // Phase 3 will add Review & Sign flow here.
    // For now, save draft and return to dashboard.
    if (draft) {
      const updated = { ...draft, findings, updatedAt: new Date().toISOString() };
      await saveLocalDraft(updated);
    }
    toast.success("Borrador guardado. La firma estará disponible próximamente.");
    router.push("/dashboard");
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

  // General photo file input ref
  let generalPhotoInput: HTMLInputElement | null = null;

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
            className={`text-sm h-12 px-4 ${
              isFirstSection ? "text-gray-300" : "text-gray-600"
            }`}
          >
            ← Anterior
          </button>

          <button
            onClick={() => generalPhotoInput?.click()}
            className="text-brand-accent h-12 px-4 flex items-center gap-1 text-sm"
          >
            <Camera className="h-4 w-4" />
            Foto
          </button>
          <input
            ref={(el) => { generalPhotoInput = el; }}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleGeneralPhoto(file);
              e.target.value = "";
            }}
            className="hidden"
          />

          <button
            onClick={isLastSection ? handleFinishReview : goToNextSection}
            className="text-sm h-12 px-4 text-brand-accent font-medium"
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
            />
          );
        })}

        {/* General photos (from footer camera button) */}
        {generalPhotos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 space-y-2">
            <p className="text-sm font-medium text-gray-600">Fotos generales</p>
            <PhotoCapture
              photos={generalPhotos}
              onCapture={(file) => handleGeneralPhoto(file)}
            />
          </div>
        )}
      </div>
    </ShellField>
  );
}
