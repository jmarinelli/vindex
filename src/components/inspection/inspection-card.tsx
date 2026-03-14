"use client";

import Link from "next/link";
import type { InspectionListItem } from "@/lib/services/inspection";

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

export function InspectionCard({ item }: { item: InspectionListItem }) {
  const { event, vehicle, detail, findingCounts, photoCount, observationCount } =
    item;

  const vehicleName =
    [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") ||
    "Vehículo sin datos";

  const isDraft = event.status === "draft";
  const href = isDraft
    ? `/dashboard/inspect/${event.id}`
    : `/report/${event.slug}`;

  return (
    <Link
      href={href}
      role="link"
      aria-label={`${vehicleName} — ${isDraft ? "Borrador" : "Firmado"}, ${formatDate(event.eventDate)}`}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-medium text-gray-800 truncate">
            {vehicleName}
          </span>
          {isDraft ? (
            <span
              className="shrink-0 text-xs font-medium rounded-full px-2.5 py-0.5 text-amber-700 bg-amber-50"
              aria-label="Estado: Borrador"
            >
              BORRADOR
            </span>
          ) : (
            <span
              className="shrink-0 text-xs font-medium rounded-full px-2.5 py-0.5 text-emerald-700 bg-emerald-50"
              aria-label="Estado: Firmado"
            >
              FIRMADO
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 font-mono">VIN: {vehicle.vin}</p>
        <p className="text-xs text-gray-500">
          {formatDate(event.eventDate)} · {formatOdometer(event.odometerKm)} km
        </p>
        <p className="text-xs text-gray-500">
          {inspectionTypeLabels[detail.inspectionType] ?? detail.inspectionType}{" "}
          · {requestedByLabels[detail.requestedBy] ?? detail.requestedBy}
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-5 py-3">
        {isDraft ? (
          <p className="text-xs text-gray-500">
            {findingCounts.evaluated}/{findingCounts.total} items ·{" "}
            {photoCount} fotos · {observationCount} obs
          </p>
        ) : (
          <p className="text-xs">
            <span className="text-emerald-600">✓ {findingCounts.good} Bien</span>
            {" · "}
            <span className="text-amber-600">⚠ {findingCounts.attention} Att</span>
            {" · "}
            <span className="text-red-600">✕ {findingCounts.critical} Crit</span>
            {" · "}
            <span className="text-gray-500">{photoCount} fotos</span>
          </p>
        )}
      </div>
    </Link>
  );
}
