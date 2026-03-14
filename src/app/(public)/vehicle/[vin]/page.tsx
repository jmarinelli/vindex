import type { Metadata } from "next";
import { ShellPublic } from "@/components/layout/shell-public";
import { getVehiclePage, getVehicleEvents } from "@/lib/services/vehicle";
import { VehicleTimeline } from "@/components/vehicle/vehicle-timeline";
import { VehicleNotFound } from "@/components/vehicle/vehicle-not-found";

// ─── OG Metadata ────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vin: string }>;
}): Promise<Metadata> {
  const { vin } = await params;
  const data = await getVehiclePage(decodeURIComponent(vin));

  if (!data) {
    return { title: "Vehículo no encontrado | VinDex" };
  }

  const { vehicle } = data;
  const vehicleName =
    [vehicle.make, vehicle.model, vehicle.year, vehicle.trim]
      .filter(Boolean)
      .join(" ") || "Vehículo";

  const title = `${vehicleName} — Historial de inspecciones | VinDex`;
  const description = `Historial de inspecciones verificadas para VIN ${vehicle.vin}.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const { vin } = await params;
  const data = await getVehiclePage(decodeURIComponent(vin));

  if (!data) {
    return (
      <ShellPublic>
        <VehicleNotFound />
      </ShellPublic>
    );
  }

  const { vehicle } = data;
  const { events, total } = await getVehicleEvents(vehicle.id, 0, 10);

  const vehicleName =
    [vehicle.make, vehicle.model, vehicle.year, vehicle.trim]
      .filter(Boolean)
      .join(" ") || "Vehículo";

  return (
    <ShellPublic>
      <div className="flex flex-col gap-4">
        {/* Vehicle summary card */}
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5"
          data-testid="vehicle-summary"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">🚗</span>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {vehicleName}
              </h1>
              <p className="text-sm text-gray-500 font-mono">
                VIN: {vehicle.vin}
              </p>
              {vehicle.plate && (
                <p className="text-sm text-gray-500">
                  Patente: {vehicle.plate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Event timeline */}
        <VehicleTimeline
          initialEvents={events}
          total={total}
          vehicleId={vehicle.id}
        />
      </div>
    </ShellPublic>
  );
}
