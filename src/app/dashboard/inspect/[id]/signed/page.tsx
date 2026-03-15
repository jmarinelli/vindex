"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Check, Copy, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSignedInspectionAction } from "@/lib/actions/inspection";
import type { FindingStatus, TemplateSnapshot } from "@/types/inspection";
import type { InspectionFinding, Vehicle, Event } from "@/db/schema";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSignedDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatSignedTime(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SignedConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [signerName, setSignerName] = useState("");
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [templateSnapshot, setTemplateSnapshot] = useState<TemplateSnapshot | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getSignedInspectionAction(eventId);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "No se pudo cargar la inspección.");
        router.replace("/dashboard");
        return;
      }
      setEvent(result.data.event);
      setVehicle(result.data.vehicle);
      setSignerName(result.data.signerName);
      setFindings(result.data.findings);
      setTemplateSnapshot(result.data.templateSnapshot);
      setLoading(false);
    }
    load();
  }, [eventId, router]);

  // Status counts for compact summary
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

  const reportUrl = event
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/report/${event.slug}`
    : "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }, [reportUrl]);

  const handleShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `Inspección — ${vehicle?.make ?? ""} ${vehicle?.model ?? ""} ${vehicle?.year ?? ""}`,
        url: reportUrl,
      });
    } catch {
      // User cancelled or share failed — ignore
    }
  }, [reportUrl, vehicle]);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ShellDashboard title="Inspección Firmada">
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </ShellDashboard>
    );
  }

  if (!event || !vehicle) return null;

  const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(" ");

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <ShellDashboard title="Inspección Firmada">
      <div className="max-w-xl mx-auto space-y-6 py-4">
        {/* Success Badge */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 sm:h-16 sm:w-16 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Inspección firmada
          </h1>
          <p className="text-sm text-gray-500">
            Firmada el {formatSignedDate(event.signedAt)} a las{" "}
            {formatSignedTime(event.signedAt)}
          </p>
          <p className="text-sm text-gray-500">por {signerName}</p>
        </div>

        {/* Report Link Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
            🔗 Enlace al reporte
          </p>
          <p className="text-base font-mono text-brand-accent break-all select-all">
            {reportUrl}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="h-10 gap-2"
              aria-live="polite"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copiado ✓" : "Copiar enlace"}
            </Button>
            {canShare && (
              <Button
                variant="secondary"
                onClick={handleShare}
                className="h-10 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </Button>
            )}
          </div>
        </div>

        {/* Vehicle Summary (Compact) */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
          <p className="text-base font-medium text-gray-800">
            🚗 {vehicleName}
          </p>
          <p className="text-xs text-gray-500 font-mono">
            VIN: {vehicle.vin}
          </p>
          <p className="text-sm text-gray-600">
            <span className="text-emerald-600">✓ {statusCounts.good} Bien</span>
            {" · "}
            <span className="text-amber-600">⚠ {statusCounts.attention} Atención</span>
            {" · "}
            <span className="text-red-600">✕ {statusCounts.critical} Crítico</span>
            {statusCounts.not_applicable > 0 && (
              <>
                {" · "}
                <span className="text-gray-500">ø {statusCounts.not_applicable} N/A</span>
              </>
            )}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() =>
              window.open(`/report/${event.slug}`, "_blank")
            }
            className="h-12 px-6 text-base flex-1 gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Reporte Público
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="h-12 px-6 text-base flex-1 text-gray-600"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </ShellDashboard>
  );
}
