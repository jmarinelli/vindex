"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, AlertTriangle, X, Minus, Pencil, Camera, CloudOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInspectionForReviewAction,
  signInspectionAction,
} from "@/lib/actions/inspection";
import { useOfflineStatus } from "@/offline/hooks";
import { getPhotosByEvent } from "@/offline/dexie";
import type { FindingStatus, TemplateSnapshot } from "@/types/inspection";
import type { InspectionFinding, Vehicle, Event, InspectionDetail } from "@/db/schema";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FindingStatus,
  { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
  good: {
    icon: <Check className="h-4 w-4" />,
    label: "Bien",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500",
  },
  attention: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "Atención",
    color: "text-amber-600",
    bgColor: "bg-amber-500",
  },
  critical: {
    icon: <X className="h-4 w-4" />,
    label: "Crítico",
    color: "text-red-600",
    bgColor: "bg-red-500",
  },
  not_evaluated: {
    icon: <Minus className="h-4 w-4" />,
    label: "N/E",
    color: "text-gray-400",
    bgColor: "bg-gray-300",
  },
};

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  pre_purchase: "Pre-compra",
  intake: "Ingreso",
  periodic: "Periódica",
  other: "Otra",
};

const REQUESTED_BY_LABELS: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  agency: "Agencia",
  other: "Otro",
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatOdometer(km: number): string {
  return km.toLocaleString("es-AR");
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReviewSignPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const isOnline = useOfflineStatus();

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [photos, setPhotos] = useState<Array<{ id: string; findingId: string | null; photoType: string | null; url: string | null }>>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [templateSnapshot, setTemplateSnapshot] = useState<TemplateSnapshot | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getInspectionForReviewAction(eventId);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "No se pudo cargar la inspección.");
        router.replace("/dashboard");
        return;
      }
      setEvent(result.data.event);
      setDetail(result.data.detail);
      setFindings(result.data.findings);
      setVehicle(result.data.vehicle);
      setTemplateSnapshot(result.data.templateSnapshot);

      // Merge photos from server and local Dexie (photos live in IndexedDB
      // until uploaded, so server alone may be incomplete)
      const serverPhotos = result.data.photos;
      const localPhotos = await getPhotosByEvent(eventId);

      const serverIds = new Set(serverPhotos.map((p) => p.id));
      const merged: Array<{ id: string; findingId: string | null; photoType: string | null; url: string | null }> = [
        ...serverPhotos.map((p) => ({ id: p.id, findingId: p.findingId, photoType: p.photoType, url: p.url })),
        ...localPhotos
          .filter((p) => !serverIds.has(p.id))
          .map((p) => ({ id: p.id, findingId: p.findingId, photoType: p.photoType, url: p.url ?? (p.blob ? URL.createObjectURL(p.blob) : null) })),
      ];
      setPhotos(merged);
      setLoading(false);
    }
    load();
  }, [eventId, router]);

  // ─── Computed values ────────────────────────────────────────────────────

  const statusCounts = useMemo(() => {
    const counts: Record<FindingStatus, number> = {
      good: 0,
      attention: 0,
      critical: 0,
      not_evaluated: 0,
    };
    if (!templateSnapshot) return counts;

    // Only count checklist_item findings
    const checklistItemIds = new Set<string>();
    for (const section of templateSnapshot.sections) {
      for (const item of section.items) {
        if (item.type === "checklist_item") {
          checklistItemIds.add(`${section.id}:${item.id}`);
        }
      }
    }

    for (const f of findings) {
      const key = `${f.sectionId}:${f.itemId}`;
      if (checklistItemIds.has(key)) {
        const status = (f.status as FindingStatus) ?? "not_evaluated";
        counts[status]++;
      }
    }
    return counts;
  }, [findings, templateSnapshot]);

  const totalChecklist = statusCounts.good + statusCounts.attention + statusCounts.critical + statusCounts.not_evaluated;
  const isComplete = statusCounts.not_evaluated === 0;

  const vehiclePhotos = useMemo(
    () => photos.filter((p) => p.photoType === "vehicle"),
    [photos]
  );

  // ─── Section data ───────────────────────────────────────────────────────

  const sectionData = useMemo(() => {
    if (!templateSnapshot) return [];

    return templateSnapshot.sections.map((section) => {
      const sectionFindings = section.items.map((item) => {
        const finding = findings.find(
          (f) => f.sectionId === section.id && f.itemId === item.id
        );
        const photoCount = photos.filter(
          (p) => finding && p.findingId === finding.id
        ).length;
        return { item, finding, photoCount };
      });

      const checklistItems = section.items.filter((i) => i.type === "checklist_item");
      const evaluatedCount = checklistItems.filter((item) => {
        const f = findings.find(
          (f) => f.sectionId === section.id && f.itemId === item.id
        );
        return f && f.status !== "not_evaluated";
      }).length;

      return {
        section,
        findings: sectionFindings,
        evaluatedCount,
        totalChecklistItems: checklistItems.length,
        isComplete: checklistItems.length === 0 || evaluatedCount === checklistItems.length,
      };
    });
  }, [templateSnapshot, findings, photos]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSign = async () => {
    if (!isComplete || !isOnline || signing) return;
    setSigning(true);
    try {
      const result = await signInspectionAction({ eventId });
      if (result.success) {
        router.replace(`/dashboard/inspect/${eventId}/signed`);
      } else {
        toast.error(result.error ?? "Error al firmar. Intentá de nuevo.");
        setSigning(false);
      }
    } catch {
      toast.error("Error al firmar. Intentá de nuevo.");
      setSigning(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/dashboard/inspect/${eventId}`);
  };

  const handleFindingTap = (sectionIndex: number) => {
    // Navigate back to field mode at the specific section
    router.push(`/dashboard/inspect/${eventId}?section=${sectionIndex}`);
  };

  // ─── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <ShellDashboard title="Revisar Inspección">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </ShellDashboard>
    );
  }

  if (!event || !vehicle || !detail || !templateSnapshot) return null;

  const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(" ");

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <ShellDashboard title="Revisar Inspección">
      <div className="max-w-3xl mx-auto space-y-4 pb-24 sm:pb-6">
        {/* Back link */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a inspección
        </button>

        {/* Vehicle Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="text-lg font-medium text-gray-800">
              {vehicleName} {vehicle.plate ? `— ${vehicle.plate}` : ""}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">VIN: {vehicle.vin}</p>
          <p className="text-sm text-gray-600">
            Tipo: {INSPECTION_TYPE_LABELS[detail.inspectionType] ?? detail.inspectionType} · Solicitada por: {REQUESTED_BY_LABELS[detail.requestedBy] ?? detail.requestedBy}
          </p>
          <p className="text-sm text-gray-600">
            Kilometraje: {formatOdometer(event.odometerKm)} km · Fecha: {formatDate(event.eventDate)}
          </p>
        </div>

        {/* Status Counts Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          {/* Segmented bar */}
          {totalChecklist > 0 && (
            <div className="h-2 rounded-full overflow-hidden flex">
              {(["good", "attention", "critical", "not_evaluated"] as const).map(
                (status) =>
                  statusCounts[status] > 0 && (
                    <div
                      key={status}
                      className={`${STATUS_CONFIG[status].bgColor}`}
                      style={{
                        width: `${(statusCounts[status] / totalChecklist) * 100}%`,
                      }}
                      aria-label={`${STATUS_CONFIG[status].label}: ${statusCounts[status]}`}
                    />
                  )
              )}
            </div>
          )}
          {/* Count labels */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {(["good", "attention", "critical", "not_evaluated"] as const).map(
              (status) => (
                <span
                  key={status}
                  className={`flex items-center gap-1 text-sm ${STATUS_CONFIG[status].color}`}
                >
                  {STATUS_CONFIG[status].icon}
                  {statusCounts[status]} {STATUS_CONFIG[status].label}
                </span>
              )
            )}
          </div>
        </div>

        {/* Incomplete Warning */}
        {!isComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm font-medium text-amber-700">
              {statusCounts.not_evaluated} items sin evaluar
            </span>
          </div>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <div
            className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center gap-2"
            role="alert"
          >
            <CloudOff className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-700">
              Se requiere conexión para firmar
            </span>
          </div>
        )}

        {/* Vehicle Photos Preview */}
        {vehiclePhotos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Fotos del vehículo ({vehiclePhotos.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {vehiclePhotos.slice(0, 6).map((photo, idx) => {
                const isLast = idx === 5 && vehiclePhotos.length > 6;
                return (
                  <div
                    key={photo.id}
                    className="relative w-16 h-16 rounded-sm border border-gray-200 overflow-hidden shrink-0"
                  >
                    {photo.url && (
                      <img
                        src={photo.url}
                        alt={`Foto del vehículo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {isLast && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          +{vehiclePhotos.length - 6} más
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Groups */}
        {sectionData.map((sd, sectionIndex) => (
          <div key={sd.section.id}>
            {/* Section Header */}
            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <span className="text-base font-medium text-gray-800">
                {sd.section.name}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                {sd.evaluatedCount}/{sd.totalChecklistItems}
                {sd.isComplete && sd.totalChecklistItems > 0 && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </span>
            </div>

            {/* Finding Rows */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {sd.findings.map(({ item, finding, photoCount }, i) => {
                const status = (finding?.status as FindingStatus) ?? "not_evaluated";
                const config = STATUS_CONFIG[status];
                const isFreeText = item.type === "free_text";
                const observation = finding?.observation;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleFindingTap(sectionIndex)}
                    className={`w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors ${
                      i < sd.findings.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                    role="link"
                    aria-label={`${item.name}: ${isFreeText ? "Texto libre" : config.label}${observation ? `, con observación` : ""}`}
                  >
                    {/* Status icon */}
                    <span className={`mt-0.5 shrink-0 ${isFreeText ? "text-gray-500" : config.color}`}>
                      {isFreeText ? <Pencil className="h-4 w-4" /> : config.icon}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 block truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500 block truncate">
                        {observation
                          ? observation.slice(0, 80) + (observation.length > 80 ? "…" : "")
                          : "Sin observación"}
                        {photoCount > 0 && ` · ${photoCount} fotos`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign Button — desktop inline */}
        <div className="hidden sm:block">
          <Button
            onClick={handleSign}
            disabled={!isComplete || !isOnline || signing}
            className="w-full h-12 text-base"
            aria-disabled={!isComplete || !isOnline}
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Firmando...
              </>
            ) : (
              "Firmar Inspección"
            )}
          </Button>
        </div>
      </div>

      {/* Sign Button — mobile fixed at bottom */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
        <Button
          onClick={handleSign}
          disabled={!isComplete || !isOnline || signing}
          className="w-full h-12 text-base"
          aria-disabled={!isComplete || !isOnline}
        >
          {signing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Firmando...
            </>
          ) : (
            "Firmar Inspección"
          )}
        </Button>
      </div>
    </ShellDashboard>
  );
}
