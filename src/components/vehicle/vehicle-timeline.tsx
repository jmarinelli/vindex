"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, AlertTriangle, Info } from "lucide-react";
import type { VehicleEventItem } from "@/lib/services/vehicle";

interface VehicleTimelineProps {
  initialEvents: VehicleEventItem[];
  total: number;
  vehicleId: string;
}

const inspectionTypeLabels: Record<string, string> = {
  pre_purchase: "Pre-compra",
  intake: "Recepción",
  periodic: "Periódica",
  other: "Otra",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatOdometer(km: number): string {
  return km.toLocaleString("es-AR");
}

function EventCard({ item }: { item: VehicleEventItem }) {
  const router = useRouter();
  const { event, node, detail, findingCounts, photoCount, correction, correctionOf } = item;
  const typeLabel = inspectionTypeLabels[detail.inspectionType] ?? "Inspección";

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if the user clicked an inner link
    if ((e.target as HTMLElement).closest("a")) return;
    router.push(`/report/${event.slug}`);
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-50 rounded-md p-3 sm:p-4 hover:bg-gray-100 transition-colors cursor-pointer"
      role="link"
      tabIndex={0}
      aria-label={`${typeLabel} — ${formatDate(event.signedAt)} — ${node.displayName} — Ver reporte`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/report/${event.slug}`);
        }
      }}
    >
      <div className="flex flex-col gap-1.5">
        {/* Correction notice — on original event */}
        {correction && (
          <div
            className="flex items-center gap-1.5 bg-status-attention/10 rounded px-2 py-1.5"
            role="status"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-status-attention shrink-0" aria-hidden="true" />
            <span className="text-xs text-status-attention">Se emitió una corrección</span>
            <Link
              href={`/report/${correction.slug}`}
              className="text-xs font-medium text-brand-accent ml-auto shrink-0"
            >
              Ver corrección →
            </Link>
          </div>
        )}

        {/* Correction notice — on correction event */}
        {correctionOf && (
          <div
            className="flex items-center gap-1.5 bg-blue-50 rounded px-2 py-1.5"
            role="status"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
            <span className="text-xs text-blue-600">Corrige reporte anterior</span>
            <Link
              href={`/report/${correctionOf.slug}`}
              className="text-xs font-medium text-brand-accent ml-auto shrink-0"
            >
              Ver original →
            </Link>
          </div>
        )}

        {/* Type + Odometer */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">{typeLabel}</span>
          <span className="text-sm text-gray-500 shrink-0">
            {formatOdometer(event.odometerKm)} km
          </span>
        </div>

        {/* Status summary + photo count */}
        <div
          className="flex items-center gap-1.5"
          aria-label={`${findingCounts.good} items bien, ${findingCounts.attention} atención, ${findingCounts.critical} crítico`}
        >
          <span className="text-xs font-semibold text-status-good">
            ✓{findingCounts.good}
          </span>
          <span className="text-xs font-semibold text-status-attention">
            ⚠{findingCounts.attention}
          </span>
          <span
            className={`text-xs font-semibold ${
              findingCounts.critical > 0
                ? "text-status-critical"
                : "text-gray-400"
            }`}
          >
            ✕{findingCounts.critical}
          </span>
          <span className="text-xs text-gray-500">
            · {photoCount} fotos
          </span>
        </div>

        {/* Inspector name + report link */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/inspector/${node.slug}`}
            className="text-xs text-gray-500 hover:underline truncate"
            aria-label={`Ver perfil de ${node.displayName}`}
          >
            {node.displayName}
          </Link>
          <span className="text-xs font-medium text-brand-accent shrink-0">
            Ver reporte →
          </span>
        </div>
      </div>
    </div>
  );
}

export function VehicleTimeline({
  initialEvents,
  total,
  vehicleId,
}: VehicleTimelineProps) {
  const [eventItems, setEventItems] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const hasMore = eventItems.length < total;

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/vehicle/${vehicleId}/events?offset=${eventItems.length}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setEventItems((prev) => [...prev, ...data.events]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4"
      data-testid="timeline-card"
    >
      <h2 className="text-base font-semibold text-gray-800">
        Historial de inspecciones ({total})
      </h2>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <ClipboardList className="w-10 h-10 text-gray-300" aria-hidden="true" />
          <p className="text-sm text-gray-500 text-center">
            Este vehículo aún no tiene inspecciones firmadas.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-0" aria-label="Timeline de inspecciones">
          {eventItems.map((item, index) => (
            <li key={item.event.id} className="relative pl-6 sm:pl-8">
              {/* Timeline line */}
              {index < eventItems.length - 1 && (
                <div
                  className="absolute left-[5px] sm:left-[7px] top-[10px] bottom-0 w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}

              {/* Date marker */}
              <div
                className="flex items-center gap-2 mb-2"
                aria-label={`${formatDate(item.event.signedAt)} — ${inspectionTypeLabels[item.detail.inspectionType] ?? "Inspección"}, ${formatOdometer(item.event.odometerKm)} km`}
              >
                <div
                  className="absolute left-0 sm:left-0.5 w-2.5 h-2.5 rounded-full bg-brand-primary border-2 border-white"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-gray-600">
                  {formatDate(item.event.signedAt)}
                </span>
              </div>

              {/* Event card */}
              <div className="mb-4">
                <EventCard item={item} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="text-sm font-medium text-brand-accent py-2 hover:underline disabled:opacity-50 text-center"
          aria-label="Cargar más inspecciones"
        >
          {loading ? "Cargando..." : "Ver más"}
        </button>
      )}
    </div>
  );
}
