"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, AlertTriangle, X, Slash, Minus, Pencil, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectivityMessage } from "@/components/offline/connectivity-message";
import { OfflineBanner } from "@/components/offline/offline-banner";
import {
  getInspectionForReviewAction,
  signInspectionAction,
  updateCustomerEmailAction,
} from "@/lib/actions/inspection";
import { useOfflineStatus, usePhotoUpload, useDraft } from "@/offline/hooks";
import { useSyncStatus } from "@/offline/sync-provider";
import { clearInspectionData, getFindingsByEvent } from "@/offline/dexie";
import type { FindingStatus, TemplateSnapshot } from "@/types/inspection";

// ─── Unified ReviewData ──────────────────────────────────────────────────────

interface ReviewData {
  vehicleName: string;
  vin: string;
  plate: string;
  inspectionType: string;
  requestedBy: string;
  odometerKm: number;
  eventDate: string;
  templateSnapshot: TemplateSnapshot;
  findings: Array<{
    id: string;
    sectionId: string;
    itemId: string;
    status: string | null;
    observation: string | null;
  }>;
}

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
  not_applicable: {
    icon: <Slash className="h-4 w-4" />,
    label: "N/A",
    color: "text-gray-500",
    bgColor: "bg-gray-400",
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
  const { triggerSync } = useSyncStatus();

  const { draft, loading: draftLoading } = useDraft(eventId);
  const {
    photos: dexiePhotos,
    pendingCount,
    failedCount,
    retryFailed,
  } = usePhotoUpload(eventId, triggerSync);

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [initialCustomerEmail, setInitialCustomerEmail] = useState("");
  const [serverPhotos, setServerPhotos] = useState<Array<{ id: string; findingId: string | null; photoType: string | null; url: string | null }>>([]);
  const [dataSource, setDataSource] = useState<"server" | "dexie" | null>(null);
  // showOffline can be true even when navigator.onLine is true (unreliable)
  const [showOffline, setShowOffline] = useState(!isOnline);

  // ─── Helpers ─────────────────────────────────────────────────────────

  function applyServerData(data: NonNullable<Awaited<ReturnType<typeof getInspectionForReviewAction>>["data"]>) {
    const { event, vehicle, detail, findings, photos, templateSnapshot } = data;
    const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
      .filter(Boolean)
      .join(" ");
    setReviewData({
      vehicleName,
      vin: vehicle.vin,
      plate: vehicle.plate,
      inspectionType: detail.inspectionType,
      requestedBy: detail.requestedBy,
      odometerKm: event.odometerKm,
      eventDate: event.eventDate,
      templateSnapshot,
      findings: findings.map((f) => ({
        id: f.id,
        sectionId: f.sectionId,
        itemId: f.itemId,
        status: f.status,
        observation: f.observation,
      })),
    });
    setServerPhotos(
      photos.map((p) => ({ id: p.id, findingId: p.findingId, photoType: p.photoType, url: p.url }))
    );
    const email = (detail as { customerEmail?: string | null }).customerEmail ?? "";
    setCustomerEmail(email);
    setInitialCustomerEmail(email);
    setShowOffline(false);
    setDataSource("server");
  }

  // ─── Data loading ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadFromDexie() {
      if (draftLoading) return;
      if (!draft) {
        setLoading(false);
        return;
      }
      const dexieFindings = await getFindingsByEvent(eventId);
      if (cancelled) return;
      setReviewData({
        vehicleName: draft.vehicleName,
        vin: "",
        plate: "",
        inspectionType: draft.inspectionType,
        requestedBy: draft.requestedBy,
        odometerKm: draft.odometerKm,
        eventDate: draft.eventDate,
        templateSnapshot: draft.templateSnapshot,
        findings: dexieFindings.map((f) => ({
          id: f.id,
          sectionId: f.sectionId,
          itemId: f.itemId,
          status: f.status,
          observation: f.observation,
        })),
      });
      setDataSource("dexie");
      setLoading(false);
    }

    async function load() {
      // Connectivity probe — navigator.onLine is unreliable
      try {
        const probe = await fetch("/api/auth/session");
        if (!probe.ok) throw new Error("probe failed");
      } catch {
        // Offline — fall back to Dexie
        if (cancelled) return;
        setShowOffline(true);
        await loadFromDexie();
        return;
      }

      if (cancelled) return;

      // Server reachable — fetch inspection data
      const result = await getInspectionForReviewAction(eventId);
      if (cancelled) return;

      if (result.success && result.data) {
        applyServerData(result.data);
        setLoading(false);
        return;
      }

      // Server returned an error — fall back to Dexie
      setShowOffline(true);
      await loadFromDexie();
    }

    load();
    return () => { cancelled = true; };
  }, [eventId, draftLoading, draft]);

  // When navigator detects online, try to refresh from server
  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      return;
    }
    if (dataSource !== "dexie") return;

    async function refresh() {
      try {
        const probe = await fetch("/api/auth/session");
        if (!probe.ok) return;
      } catch {
        return;
      }
      const result = await getInspectionForReviewAction(eventId);
      if (result.success && result.data) {
        applyServerData(result.data);
      }
    }

    refresh();
  }, [isOnline, dataSource, eventId]);

  // Periodic retry when showing offline — recovers when connectivity returns
  // (handles cached page load where navigator.onLine was already true)
  useEffect(() => {
    if (!showOffline) return;
    const interval = setInterval(async () => {
      try {
        const probe = await fetch("/api/auth/session");
        if (!probe.ok) return;
      } catch {
        return;
      }
      const result = await getInspectionForReviewAction(eventId);
      if (result.success && result.data) {
        applyServerData(result.data);
        setLoading(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [showOffline, eventId]);

  // Photos source of truth: Dexie if a local draft exists, server otherwise
  const photos: Array<{ id: string; findingId: string | null; photoType: string | null; url: string | null; blob?: Blob }> = useMemo(() => {
    if (draft) {
      return dexiePhotos;
    }
    return serverPhotos;
  }, [draft, dexiePhotos, serverPhotos]);

  // ─── Computed values ────────────────────────────────────────────────────

  const findings = useMemo(() => reviewData?.findings ?? [], [reviewData?.findings]);
  const templateSnapshot = reviewData?.templateSnapshot ?? null;

  const statusCounts = useMemo(() => {
    const counts: Record<FindingStatus, number> = {
      good: 0,
      attention: 0,
      critical: 0,
      not_evaluated: 0,
      not_applicable: 0,
    };
    if (!templateSnapshot) return counts;

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

  const totalChecklist = statusCounts.good + statusCounts.attention + statusCounts.critical + statusCounts.not_evaluated + statusCounts.not_applicable;
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
          (fi) => fi.sectionId === section.id && fi.itemId === item.id
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

  const canSign = isComplete && !showOffline && pendingCount === 0;

  const saveCustomerEmail = async () => {
    const trimmed = customerEmail.trim();
    if (trimmed === initialCustomerEmail) return;
    try {
      await updateCustomerEmailAction({ eventId, customerEmail: trimmed || undefined });
      setInitialCustomerEmail(trimmed);
    } catch {
      // Best-effort save
    }
  };

  const handleSign = async () => {
    if (!canSign || signing) return;
    setSigning(true);
    try {
      // Save customer email before signing if changed
      const trimmed = customerEmail.trim();
      if (trimmed !== initialCustomerEmail) {
        await updateCustomerEmailAction({ eventId, customerEmail: trimmed || undefined });
      }
      const result = await signInspectionAction({ eventId });
      if (result.success) {
        await clearInspectionData(eventId);
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

  // ─── Offline — no local draft ─────────────────────────────────────────

  if (showOffline && !reviewData) {
    return (
      <ShellDashboard title="Revisar Inspección">
        <div className="max-w-3xl mx-auto">
          <ConnectivityMessage
            title="Inspección no disponible offline"
            subtitle="Esta inspección no está guardada en este dispositivo."
          />
        </div>
      </ShellDashboard>
    );
  }

  if (!reviewData) return null;

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

        {/* Offline connectivity banner */}
        {showOffline && (
          <OfflineBanner message="Sin conexión — se requiere conexión para firmar" />
        )}

        {/* Vehicle Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="text-lg font-medium text-gray-800">
              {reviewData.vehicleName} {reviewData.plate ? `— ${reviewData.plate}` : ""}
            </span>
          </div>
          {reviewData.vin && (
            <p className="text-sm text-gray-500 font-mono">VIN: {reviewData.vin}</p>
          )}
          <p className="text-sm text-gray-600">
            Tipo: {INSPECTION_TYPE_LABELS[reviewData.inspectionType] ?? reviewData.inspectionType} · Solicitada por: {REQUESTED_BY_LABELS[reviewData.requestedBy] ?? reviewData.requestedBy}
          </p>
          <p className="text-sm text-gray-600">
            Kilometraje: {formatOdometer(reviewData.odometerKm)} km · Fecha: {formatDate(reviewData.eventDate)}
          </p>
        </div>

        {/* Status Counts Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          {/* Segmented bar */}
          {totalChecklist > 0 && (
            <div className="h-2 rounded-full overflow-hidden flex">
              {(["good", "attention", "critical", "not_applicable", "not_evaluated"] as const).map(
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
            {(["good", "attention", "critical", "not_applicable", "not_evaluated"] as const).map(
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

        {/* Pending uploads warning */}
        {pendingCount > 0 && !showOffline && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
            {failedCount > 0 ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-red-700">
                    Hay {failedCount} foto(s) que no se pudieron subir. Reintentá la subida o eliminá las fotos para continuar.
                  </span>
                  <button onClick={retryFailed} className="block text-sm text-blue-600 underline mt-1">
                    Reintentar subida
                  </button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 text-amber-600 animate-spin shrink-0" />
                <span className="text-sm text-amber-700">
                  Subiendo {pendingCount} foto(s)... Esperá a que termine la subida para firmar.
                </span>
              </>
            )}
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
                    {(photo.url || photo.blob) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photo.url ?? (photo.blob ? URL.createObjectURL(photo.blob) : "")}
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

        {/* Customer Email */}
        {!showOffline && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <label
              htmlFor="customer-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email del cliente (opcional)
            </label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              onBlur={saveCustomerEmail}
              placeholder="comprador@email.com"
              className="h-10"
            />
            <p className="text-xs text-gray-500">
              Se le notificará cuando firmes la inspección.
            </p>
          </div>
        )}

        {/* Sign Button — desktop inline */}
        <div className="hidden sm:block">
          <Button
            onClick={handleSign}
            disabled={!canSign || signing}
            className="w-full h-12 text-base"
            aria-disabled={!canSign}
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
          disabled={!canSign || signing}
          className="w-full h-12 text-base"
          aria-disabled={!canSign}
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
