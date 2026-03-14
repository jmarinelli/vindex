import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Vehicle, Event, InspectionDetail } from "@/db/schema";

const inspectionTypeLabels: Record<string, string> = {
  pre_purchase: "Pre-compra",
  intake: "Recepción",
  periodic: "Periódica",
  other: "Otra",
};

const requestedByLabels: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  agency: "Agencia",
  other: "Otro",
};

function formatOdometer(km: number): string {
  return km.toLocaleString("es-AR");
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

interface VehicleSummaryCardProps {
  vehicle: Vehicle;
  event: Event;
  detail: InspectionDetail;
}

export function VehicleSummaryCard({
  vehicle,
  event,
  detail,
}: VehicleSummaryCardProps) {
  const vehicleName = [vehicle.make, vehicle.model, vehicle.year, vehicle.trim]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 flex flex-col gap-2">
      <h3 className="text-xl font-bold text-gray-800">
        {vehicleName || "Vehículo"}
      </h3>
      <p className="text-[13px] text-gray-500 font-mono">
        VIN: {vehicle.vin}
      </p>
      {vehicle.plate && (
        <p className="text-[13px] text-gray-500">
          Patente: {vehicle.plate}
        </p>
      )}
      <p className="text-[13px] text-gray-600">
        Kilometraje: {formatOdometer(event.odometerKm)} km
      </p>
      <p className="text-[13px] text-gray-600">
        Tipo: {inspectionTypeLabels[detail.inspectionType] ?? detail.inspectionType}
        {" · "}
        Solicitada por: {requestedByLabels[detail.requestedBy] ?? detail.requestedBy}
      </p>
      <p className="text-[13px] text-gray-600">
        Fecha: {formatDate(event.eventDate)}
      </p>
      <Link
        href={`/vehicle/${vehicle.vin}`}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-accent hover:underline"
      >
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        Ver historial del vehículo
      </Link>
    </div>
  );
}
