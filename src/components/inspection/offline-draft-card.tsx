"use client";

import Link from "next/link";
import type { DraftInspection } from "@/types/inspection";

const inspectionTypeLabels: Record<string, string> = {
  pre_purchase: "Pre-compra",
  intake: "Ingreso",
  periodic: "Periódica",
  other: "Otra",
};

const requestedByLabels: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  agency: "Agencia",
  other: "Otro",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatOdometer(km: number): string {
  return km.toLocaleString("es-AR");
}

interface OfflineDraftCardProps {
  draft: DraftInspection;
  findingCounts: {
    total: number;
    evaluated: number;
  };
  photoCount: number;
  observationCount: number;
}

export function OfflineDraftCard({
  draft,
  findingCounts,
  photoCount,
  observationCount,
}: OfflineDraftCardProps) {
  const vehicleName = draft.vehicleName || "Vehículo sin datos";

  return (
    <Link
      href={`/dashboard/inspect/${draft.id}`}
      role="link"
      aria-label={`${vehicleName} — Borrador, ${formatDate(draft.eventDate)}`}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-medium text-gray-800 truncate">
            {vehicleName}
          </span>
          <span
            className="shrink-0 text-xs font-medium rounded-full px-2.5 py-0.5 text-amber-700 bg-amber-50"
            aria-label="Estado: Borrador"
          >
            BORRADOR
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {formatDate(draft.eventDate)} · {formatOdometer(draft.odometerKm)} km
        </p>
        <p className="text-xs text-gray-500">
          {inspectionTypeLabels[draft.inspectionType] ?? draft.inspectionType}{" "}
          · {requestedByLabels[draft.requestedBy] ?? draft.requestedBy}
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-5 py-3">
        <p className="text-xs text-gray-500">
          {findingCounts.evaluated}/{findingCounts.total} items ·{" "}
          {photoCount} fotos · {observationCount} obs
        </p>
      </div>
    </Link>
  );
}
